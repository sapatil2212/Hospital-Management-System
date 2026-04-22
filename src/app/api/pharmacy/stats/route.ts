import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/stats
 * Dashboard stats for pharmacy: today's dispensing, inventory alerts, revenue
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get pharmacy sub-dept for this user
    let pharmacySubDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    }

    // Today's prescriptions with medications
    const todayRxCount = await px.prescription.count({
      where: {
        hospitalId: auth.hospitalId,
        medications: { not: null },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    // Today's completed pharmacy workflows
    const todayDispensed = await px.prescriptionWorkflow.count({
      where: {
        hospitalId: auth.hospitalId,
        ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
        status: "COMPLETED",
        completedAt: { gte: today, lt: tomorrow },
      },
    });

    // Pending pharmacy workflows
    const pendingCount = await px.prescriptionWorkflow.count({
      where: {
        hospitalId: auth.hospitalId,
        ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    });

    // Inventory stats - low stock items (pharmacy category)
    const allItems = await px.inventoryItem.findMany({
      where: { hospitalId: auth.hospitalId, isActive: true },
      include: {
        batches: {
          where: { remainingQty: { gt: 0 } },
          select: { remainingQty: true, expiryDate: true },
        },
      },
    });

    let lowStockCount = 0;
    let expiringCount = 0;
    let totalItems = allItems.length;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const item of allItems) {
      const totalStock = item.batches.reduce((sum: number, b: any) => sum + b.remainingQty, 0);
      if (totalStock <= item.minStock) lowStockCount++;
      for (const batch of item.batches) {
        if (batch.expiryDate && new Date(batch.expiryDate) <= thirtyDaysFromNow) {
          expiringCount++;
          break; // count item only once
        }
      }
    }

    // Today's pharmacy revenue (dispense + counter-sale)
    const todayMovements = await px.stockMovement.findMany({
      where: {
        hospitalId: auth.hospitalId,
        type: "OUT",
        source: { in: ["PHARMACY_DISPENSE", "PHARMACY_COUNTER_SALE"] },
        createdAt: { gte: today, lt: tomorrow },
      },
      include: {
        item: { select: { sellingPrice: true, name: true } },
      },
    });

    const todayRevenue = todayMovements.reduce((sum: number, m: any) => {
      return sum + (m.quantity * (m.item?.sellingPrice || 0));
    }, 0);

    // Total revenue (all time — dispense + counter-sale)
    const allMovements = await px.stockMovement.findMany({
      where: {
        hospitalId: auth.hospitalId,
        type: "OUT",
        source: { in: ["PHARMACY_DISPENSE", "PHARMACY_COUNTER_SALE"] },
      },
      include: {
        item: { select: { sellingPrice: true } },
      },
    });

    const totalRevenue = allMovements.reduce((sum: number, m: any) => {
      return sum + (m.quantity * (m.item?.sellingPrice || 0));
    }, 0);

    // Recent sales (last 7 days for chart)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weekMovements = await px.stockMovement.findMany({
      where: {
        hospitalId: auth.hospitalId,
        type: "OUT",
        source: { in: ["PHARMACY_DISPENSE", "PHARMACY_COUNTER_SALE"] },
        createdAt: { gte: sevenDaysAgo },
      },
      include: { item: { select: { sellingPrice: true } } },
    });

    const dailySales: Record<string, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = { count: 0, revenue: 0 };
    }
    for (const m of weekMovements) {
      const key = new Date(m.createdAt).toISOString().slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].count += m.quantity;
        dailySales[key].revenue += m.quantity * (m.item?.sellingPrice || 0);
      }
    }

    const chartData = Object.entries(dailySales).map(([date, data]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      count: data.count,
      revenue: data.revenue,
    }));

    // Top dispensed medicines (last 30 days)
    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const topMedsMovements = await px.stockMovement.findMany({
      where: {
        hospitalId: auth.hospitalId,
        type: "OUT",
        source: { in: ["PHARMACY_DISPENSE", "PHARMACY_COUNTER_SALE"] },
        createdAt: { gte: thirtyDaysAgoDate },
      },
      include: { item: { select: { id: true, name: true, category: true, sellingPrice: true } } },
    });

    const medMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>();
    for (const m of topMedsMovements) {
      const key = m.itemId;
      const existing = medMap.get(key);
      const rev = m.quantity * (m.item?.sellingPrice || 0);
      if (existing) {
        existing.qty += m.quantity;
        existing.revenue += rev;
      } else {
        medMap.set(key, { name: m.item?.name || "Unknown", category: m.item?.category || "", qty: m.quantity, revenue: rev });
      }
    }
    const topMedicines = Array.from(medMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    return successResponse({
      todayRxCount,
      todayDispensed,
      pendingCount,
      lowStockCount,
      expiringCount,
      totalItems,
      todayRevenue,
      totalRevenue,
      chartData,
      topMedicines,
    }, "Pharmacy stats fetched");
  } catch (error: any) {
    console.error("[pharmacy/stats] Error:", error);
    return errorResponse(error.message || "Failed to fetch pharmacy stats", 500);
  }
}
