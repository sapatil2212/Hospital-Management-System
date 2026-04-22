import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * POST /api/pharmacy/counter-sale
 * Direct pharmacy counter sale — patient walks in, buys pharma items, pays.
 * Creates Bill + BillItems + Payment + Revenue. No prescription needed.
 * Bill is tagged with "PHARMACY_COUNTER_SALE" in notes so it appears in
 * hospital-admin / reception billing with a clear "Pharmacy Dept" remark.
 *
 * IMPORTANT: Deducts stock from inventory batches (FIFO) and records movements.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      patientId,
      items,           // [{ inventoryItemId, name, quantity, unitPrice }]
      paymentMethod,   // CASH | UPI | CARD | ONLINE
      transactionId,
      discount,
      remarks,
      notifyAdmin,
      notifyReception,
    } = body;

    if (!patientId) return errorResponse("patientId is required", 400);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse("At least one item is required", 400);
    }

    // Validate items & check stock availability (combined quantities per inventory item)
    const combinedQty: Record<string, number> = {};
    for (const item of items) {
      if (!item.inventoryItemId) return errorResponse("All items must be selected from inventory (missing inventoryItemId)", 400);
      if (!item.name || !item.quantity || item.quantity < 1) {
        return errorResponse("Each item must have a name and quantity >= 1", 400);
      }
      combinedQty[item.inventoryItemId] = (combinedQty[item.inventoryItemId] || 0) + item.quantity;
    }

    // Verify stock availability for combined quantities
    for (const [itemId, totalQty] of Object.entries(combinedQty)) {
      const invItem = await px.inventoryItem.findFirst({
        where: { id: itemId, hospitalId: auth.hospitalId },
        include: { batches: { where: { remainingQty: { gt: 0 } }, orderBy: { expiryDate: "asc" } } },
      });
      if (!invItem) return errorResponse(`Inventory item not found: ${itemId}`, 404);
      const totalStock = invItem.batches.reduce((s: number, b: any) => s + b.remainingQty, 0);
      if (totalStock < totalQty) {
        return errorResponse(`Insufficient stock for ${invItem.name}. Available: ${totalStock}, Requested: ${totalQty}`, 400);
      }
    }

    // Verify patient exists
    const patient = await px.patient.findFirst({
      where: { id: patientId, hospitalId: auth.hospitalId },
    });
    if (!patient) return errorResponse("Patient not found", 404);

    // Generate bill number
    const billCount = await px.bill.count({ where: { hospitalId: auth.hospitalId } });
    const billNo = `BILL-${String(billCount + 1).padStart(5, "0")}`;

    // Calculate totals
    const billItems = items.map((item: any) => {
      const qty = parseInt(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      return {
        name: item.name,
        quantity: qty,
        unitPrice: price,
        amount: qty * price,
        type: "PHARMACY",
        referenceId: item.inventoryItemId || null,
      };
    });

    const subtotal = billItems.reduce((s: number, i: any) => s + i.amount, 0);
    const discountAmt = parseFloat(discount) || 0;
    const total = Math.max(subtotal - discountAmt, 0);

    const counterSaleRemark = `[PHARMACY_COUNTER_SALE] ${remarks || "Direct pharmacy purchase"}`;

    // Create bill + items + payment + revenue + deduct stock in a transaction
    const result = await px.$transaction(async (tx: any) => {
      // Create bill
      const bill = await tx.bill.create({
        data: {
          hospitalId: auth.hospitalId,
          billNo,
          patientId,
          prescriptionId: null,
          visitId: null,
          items: JSON.stringify(billItems),
          subtotal,
          discount: discountAmt,
          tax: 0,
          total,
          paidAmount: total,
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: paymentMethod || "CASH",
          notes: counterSaleRemark,
        },
      });

      // Create bill items
      for (const bi of billItems) {
        await tx.billItem.create({
          data: {
            hospitalId: auth.hospitalId,
            billId: bill.id,
            type: bi.type,
            referenceId: bi.referenceId,
            name: bi.name,
            quantity: bi.quantity,
            unitPrice: bi.unitPrice,
            amount: bi.amount,
          },
        });
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          hospitalId: auth.hospitalId,
          billId: bill.id,
          amount: total,
          method: paymentMethod || "CASH",
          transactionId: transactionId || null,
          status: "SUCCESS",
          notes: counterSaleRemark,
          paidAt: new Date(),
        },
      });

      // Log revenue
      await tx.revenue.create({
        data: {
          hospitalId: auth.hospitalId,
          sourceType: "PHARMACY",
          referenceId: bill.id,
          referenceType: "COUNTER_SALE",
          amount: total,
          description: counterSaleRemark,
        },
      });

      // ── Deduct stock from batches (FIFO — earliest expiry first) ──
      for (const [itemId, totalQty] of Object.entries(combinedQty)) {
        let remaining = totalQty;
        // Fetch batches with stock, ordered by expiry (FIFO)
        const batches = await tx.stockBatch.findMany({
          where: { itemId, hospitalId: auth.hospitalId, remainingQty: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        });

        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.remainingQty, remaining);
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { remainingQty: batch.remainingQty - deduct },
          });
          // Record movement
          await tx.stockMovement.create({
            data: {
              hospitalId: auth.hospitalId,
              itemId,
              batchId: batch.id,
              type: "SALE",
              quantity: deduct,
              source: "PHARMACY_COUNTER_SALE",
              referenceId: bill.id,
              notes: `Counter sale — Bill ${billNo}`,
              performedBy: auth.user?.userId,
            },
          });
          remaining -= deduct;
        }

        // Update totalStock on InventoryItem
        const updatedBatches = await tx.stockBatch.findMany({
          where: { itemId, hospitalId: auth.hospitalId },
        });
        const newTotalStock = updatedBatches.reduce((s: number, b: any) => s + b.remainingQty, 0);
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { updatedAt: new Date() },
        });
      }

      return { bill, payment };
    });

    return successResponse(
      { billId: result.bill.id, billNo: result.bill.billNo, total: result.bill.total },
      "Pharmacy counter sale completed successfully"
    );
  } catch (err: any) {
    console.error("Pharmacy counter-sale error:", err);
    return errorResponse(err.message || "Failed to process counter sale", 500);
  }
}
