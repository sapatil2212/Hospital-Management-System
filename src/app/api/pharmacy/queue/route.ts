import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/queue
 * Fetch prescription queue for pharmacy (prescriptions with medications that need dispensing)
 * - Prescriptions with status IN_WORKFLOW where current dept = this pharmacy sub-dept
 * - OR prescriptions with PHARMACY workflow steps that are PENDING/IN_PROGRESS
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || ""; // PENDING, IN_PROGRESS, COMPLETED, all
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    // Get the pharmacy sub-department for this user
    let pharmacySubDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    }

    // Build date range
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Query 1: Prescription workflows assigned to this pharmacy
    const workflowWhere: any = {
      hospitalId: auth.hospitalId,
      ...(pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {}),
      createdAt: { gte: startDate, lte: endDate },
    };

    if (status === "all") {
      // No status filter — show everything
    } else if (status) {
      workflowWhere.status = status;
    } else {
      workflowWhere.status = { in: ["PENDING", "IN_PROGRESS", "HOLD"] };
    }

    const workflows = await px.prescriptionWorkflow.findMany({
      where: workflowWhere,
      include: {
        prescription: {
          include: {
            patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
            doctor: { select: { id: true, name: true, specialization: true } },
            appointment: { select: { id: true, appointmentDate: true, timeSlot: true, type: true, tokenNumber: true } },
          },
        },
        subDepartment: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Query 2: Also fetch prescriptions with medications that haven't been dispensed
    // (prescriptions completed today with medications field populated)
    const rxWhere: any = {
      hospitalId: auth.hospitalId,
      medications: { not: null },
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "IN_WORKFLOW", "BILLING_PENDING"] },
    };

    if (search) {
      rxWhere.OR = [
        { prescriptionNo: { contains: search } },
        { patient: { name: { contains: search } } },
        { patient: { patientId: { contains: search } } },
        { doctor: { name: { contains: search } } },
      ];
    }

    const prescriptions = await px.prescription.findMany({
      where: rxWhere,
      include: {
        patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
        doctor: { select: { id: true, name: true, specialization: true } },
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true, type: true, tokenNumber: true } },
        workflows: {
          where: pharmacySubDeptId ? { subDepartmentId: pharmacySubDeptId } : {},
          include: { subDepartment: { select: { id: true, name: true, type: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Filter out prescriptions that have been removed from pharmacy queue
    // (prescriptions with no active pharmacy workflow and status COMPLETED without pending workflows)
    const activePrescriptionIds = new Set(workflows.map((w: any) => w.prescriptionId));
    const filteredPrescriptions = prescriptions.filter((rx: any) => {
      // Keep if it has an active workflow
      if (activePrescriptionIds.has(rx.id)) return true;
      // Keep if it has a pharmacy workflow entry (even if not in our initial query due to date filter)
      if (rx.workflows && rx.workflows.length > 0) return true;
      // Exclude if status is COMPLETED and no pharmacy workflow (was removed from queue)
      return false;
    });

    // Merge: workflow-based queue + direct prescriptions with meds
    const queueMap = new Map<string, any>();

    // Add workflow items
    for (const wf of workflows) {
      if (!wf.prescription) continue;
      const rx = wf.prescription;
      if (!queueMap.has(rx.id)) {
        queueMap.set(rx.id, {
          id: rx.id,
          prescriptionNo: rx.prescriptionNo,
          patient: rx.patient,
          doctor: rx.doctor,
          appointment: rx.appointment,
          medications: rx.medications ? safeJsonParse(rx.medications) : [],
          diagnosis: rx.diagnosis,
          chiefComplaint: rx.chiefComplaint,
          status: rx.status,
          workflowStatus: wf.status,
          workflowId: wf.id,
          workflowNotes: wf.notes,
          workflowCharges: wf.charges ? safeJsonParse(wf.charges) : [],
          totalCharge: wf.totalCharge || 0,
          dispensed: wf.status === "COMPLETED",
          createdAt: rx.createdAt,
        });
      }
    }

    // Add direct prescriptions (not already in queue via workflows)
    for (const rx of filteredPrescriptions) {
      if (queueMap.has(rx.id)) continue;
      const pharmacyWf = rx.workflows?.[0];
      queueMap.set(rx.id, {
        id: rx.id,
        prescriptionNo: rx.prescriptionNo,
        patient: rx.patient,
        doctor: rx.doctor,
        appointment: rx.appointment,
        medications: rx.medications ? safeJsonParse(rx.medications) : [],
        diagnosis: rx.diagnosis,
        chiefComplaint: rx.chiefComplaint,
        status: rx.status,
        workflowStatus: pharmacyWf?.status || null,
        workflowId: pharmacyWf?.id || null,
        workflowNotes: pharmacyWf?.notes || null,
        workflowCharges: pharmacyWf?.charges ? safeJsonParse(pharmacyWf.charges) : [],
        totalCharge: pharmacyWf?.totalCharge || 0,
        dispensed: pharmacyWf?.status === "COMPLETED",
        createdAt: rx.createdAt,
      });
    }

    const queue = Array.from(queueMap.values());

    // Stats
    const pending = queue.filter(q => !q.dispensed).length;
    const dispensed = queue.filter(q => q.dispensed).length;
    const total = queue.length;

    return successResponse({
      queue,
      stats: { pending, dispensed, total },
    }, "Pharmacy queue fetched");
  } catch (error: any) {
    console.error("[pharmacy/queue] Error:", error);
    return errorResponse(error.message || "Failed to fetch pharmacy queue", 500);
  }
}

/**
 * POST /api/pharmacy/queue
 * Manually add a walk-in prescription to the pharmacy queue.
 * Supports:
 *  - Manual or existing patient
 *  - Manual medicine entry with pricing
 *  - Optional doctor
 *  - Bill creation with items
 *  - Payment collection at pharmacy OR send-to-billing
 *  - Revenue logging when paid at pharmacy
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF, Role.RECEPTIONIST]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      patientId, doctorId, diagnosis, medications, notes, appointmentId,
      // billing fields
      paymentAction,     // "collect" | "send_to_billing" | "none"
      paymentMethod,     // CASH, UPI, CARD etc (when paymentAction=collect)
      transactionId,     // optional txn ID
      discount,          // optional discount amount
      billingNote,       // remark for billing
    } = body;

    if (!patientId) return errorResponse("patientId is required", 400);
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return errorResponse("At least one medication is required", 400);
    }

    // Get pharmacy sub-dept for this user
    let pharmacySubDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    } else {
      const subDept = await px.subDepartment.findFirst({
        where: { hospitalId: auth.hospitalId, type: "PHARMACY" },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    }

    // Generate prescription number
    const count = await px.prescription.count({ where: { hospitalId: auth.hospitalId } });
    const prescriptionNo = `RX-${String(count + 1).padStart(5, "0")}`;

    // Create the prescription (appointmentId and doctorId are now optional)
    const prescription = await px.prescription.create({
      data: {
        hospitalId: auth.hospitalId,
        patientId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        prescriptionNo,
        diagnosis: diagnosis || null,
        medications: JSON.stringify(medications),
        doctorNotes: notes || null,
        status: paymentAction === "collect" ? "BILLED" : paymentAction === "send_to_billing" ? "BILLING_PENDING" : "IN_WORKFLOW",
        currentDeptId: pharmacySubDeptId,
      },
    });

    // Create workflow entry for pharmacy
    const medsTotal = medications.reduce((sum: number, m: any) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);
    const wfStatus = paymentAction === "collect" ? "COMPLETED" : "PENDING";
    await px.prescriptionWorkflow.create({
      data: {
        hospitalId: auth.hospitalId,
        prescriptionId: prescription.id,
        subDepartmentId: pharmacySubDeptId,
        sequence: 1,
        status: wfStatus,
        notes: notes || null,
        charges: JSON.stringify(medications.map((m: any) => ({
          name: m.name, qty: parseInt(m.quantity) || 1, price: parseFloat(m.price) || 0,
          amount: (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1),
        }))),
        totalCharge: medsTotal,
        ...(wfStatus === "COMPLETED" ? { completedAt: new Date(), completedBy: auth.user.userId } : {}),
      },
    });

    // ── Create Bill ──
    let bill = null;
    const discountAmt = parseFloat(discount) || 0;
    const subtotal = medsTotal;
    const total = Math.max(0, subtotal - discountAmt);

    if (paymentAction === "collect" || paymentAction === "send_to_billing") {
      // Generate bill number
      const billCount = await px.bill.count({ where: { hospitalId: auth.hospitalId } });
      const billNo = `BILL-${String(billCount + 1).padStart(4, "0")}`;

      const isPaid = paymentAction === "collect";
      bill = await px.bill.create({
        data: {
          hospitalId: auth.hospitalId,
          billNo,
          prescriptionId: prescription.id,
          patientId,
          items: JSON.stringify(medications.map((m: any) => ({
            name: m.name, qty: parseInt(m.quantity) || 1, price: parseFloat(m.price) || 0,
            amount: (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1),
          }))),
          subtotal,
          discount: discountAmt,
          tax: 0,
          total,
          paidAmount: isPaid ? total : 0,
          status: isPaid ? "PAID" : "PENDING",
          paidAt: isPaid ? new Date() : null,
          paymentMethod: isPaid ? (paymentMethod || "CASH") : null,
          notes: billingNote || `Walk-in Rx ${prescriptionNo}`,
        },
      });

      // Create BillItems
      for (const m of medications) {
        const qty = parseInt(m.quantity) || 1;
        const unitPrice = parseFloat(m.price) || 0;
        await px.billItem.create({
          data: {
            hospitalId: auth.hospitalId,
            billId: bill.id,
            type: "PHARMACY",
            name: m.name,
            quantity: qty,
            unitPrice,
            amount: qty * unitPrice,
          },
        });
      }

      // If paid at pharmacy, create Payment + Revenue records
      if (isPaid && total > 0) {
        await px.payment.create({
          data: {
            hospitalId: auth.hospitalId,
            billId: bill.id,
            amount: total,
            method: paymentMethod || "CASH",
            transactionId: transactionId || null,
            status: "SUCCESS",
            notes: `Walk-in pharmacy payment for ${prescriptionNo}`,
            paidAt: new Date(),
          },
        });

        // Log revenue
        try {
          await px.revenue.create({
            data: {
              hospitalId: auth.hospitalId,
              sourceType: "PHARMACY",
              referenceId: bill.id,
              referenceType: "Bill",
              amount: total,
              description: `Walk-in Rx ${prescriptionNo} — ${medications.length} medicine(s)${billingNote ? ` — ${billingNote}` : ""}`,
            },
          });
        } catch (_) { /* revenue logging is fire-and-forget */ }
      }
    }

    return successResponse(
      { prescription, bill },
      paymentAction === "collect"
        ? `Prescription ${prescriptionNo} added & payment collected`
        : paymentAction === "send_to_billing"
          ? `Prescription ${prescriptionNo} added & sent to billing`
          : `Prescription ${prescriptionNo} added to queue`,
      201
    );
  } catch (error: any) {
    console.error("[pharmacy/queue POST] Error:", error);
    return errorResponse(error.message || "Failed to add prescription to queue", 500);
  }
}

/**
 * PATCH /api/pharmacy/queue
 * Dispense medication — marks a prescription workflow step as completed
 * Also supports action: "skip" | "hold" | "resume" for queue management
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { prescriptionId, dispensedItems, notes, totalCharge, action } = body;
    let { workflowId } = body;

    // ── Skip / Hold / Resume actions ──
    if (action === "skip" || action === "hold" || action === "resume") {
      if (!workflowId && prescriptionId) {
        const wf = await px.prescriptionWorkflow.findFirst({
          where: { prescriptionId, hospitalId: auth.hospitalId },
          orderBy: { sequence: "asc" },
        });
        if (wf) workflowId = wf.id;
      }

      const newStatus = action === "skip" ? "SKIPPED" : action === "hold" ? "HOLD" : "PENDING";

      if (workflowId) {
        await px.prescriptionWorkflow.update({
          where: { id: workflowId },
          data: { status: newStatus, notes: notes || null },
        });
      }

      // Update prescription status accordingly
      if (action === "skip") {
        await px.prescription.update({
          where: { id: prescriptionId },
          data: { status: "COMPLETED" },
        });
      } else if (action === "resume") {
        await px.prescription.update({
          where: { id: prescriptionId },
          data: { status: "IN_WORKFLOW" },
        });
      }

      return successResponse({ updated: true }, `Prescription ${action}ped successfully`);
    }

    if (!prescriptionId) {
      return errorResponse("prescriptionId is required", 400);
    }

    // If there's a workflow step, update it, otherwise create one if there's a charge
    if (workflowId) {
      await px.prescriptionWorkflow.update({
        where: { id: workflowId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          completedBy: auth.user.userId || "Pharmacy",
          notes: notes || null,
          charges: dispensedItems ? JSON.stringify(dispensedItems) : null,
          totalCharge: totalCharge || 0,
        },
      });
    } else {
      // Create retroactive workflow step to ensure charges are synced to bill
      const pharmacyDept = await px.subDepartment.findFirst({
        where: { hospitalId: auth.hospitalId, type: "PHARMACY" }
      });
      const wf = await px.prescriptionWorkflow.create({
        data: {
          hospitalId: auth.hospitalId,
          prescriptionId,
          subDepartmentId: pharmacyDept ? pharmacyDept.id : null,
          sequence: 999,
          status: "COMPLETED",
          completedAt: new Date(),
          completedBy: auth.user.userId || "Pharmacy",
          notes: notes || null,
          charges: dispensedItems ? JSON.stringify(dispensedItems) : null,
          totalCharge: totalCharge || 0,
        }
      });
      // Set workflowId for advancement logic
      workflowId = wf.id;
    }

    if (workflowId) {

      // Check if all workflow steps are done — advance prescription
      const allSteps = await px.prescriptionWorkflow.findMany({
        where: { prescriptionId },
        orderBy: { sequence: "asc" },
      });

      const currentIdx = allSteps.findIndex((s: any) => s.id === workflowId);
      const nextStep = allSteps.find((s: any, idx: number) => idx > currentIdx && s.status === "PENDING");

      if (nextStep) {
        await px.prescriptionWorkflow.update({
          where: { id: nextStep.id },
          data: { status: "IN_PROGRESS" },
        });
        await px.prescription.update({
          where: { id: prescriptionId },
          data: { currentDeptId: nextStep.subDepartmentId },
        });
      } else {
        // All steps done
        const anyPending = allSteps.some((s: any) => s.id !== workflowId && s.status !== "COMPLETED" && s.status !== "SKIPPED");
        if (!anyPending) {
          await px.prescription.update({
            where: { id: prescriptionId },
            data: { status: "BILLING_PENDING", currentDeptId: null },
          });
        }
      }
    }

    // Deduct stock for dispensed items (FIFO)
    if (dispensedItems && Array.isArray(dispensedItems)) {
      for (const item of dispensedItems) {
        if (item.inventoryItemId && item.quantity > 0) {
          try {
            // Find batches for FIFO deduction
            const batches = await px.stockBatch.findMany({
              where: { hospitalId: auth.hospitalId, itemId: item.inventoryItemId, remainingQty: { gt: 0 } },
              orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
            });

            let remainingToDeduct = item.quantity;
            for (const batch of batches) {
              if (remainingToDeduct <= 0) break;
              const deductQty = Math.min(batch.remainingQty, remainingToDeduct);

              await px.stockBatch.update({
                where: { id: batch.id },
                data: { remainingQty: { decrement: deductQty } },
              });

              await px.stockMovement.create({
                data: {
                  hospitalId: auth.hospitalId,
                  itemId: item.inventoryItemId,
                  batchId: batch.id,
                  type: "OUT",
                  quantity: deductQty,
                  source: "PHARMACY_DISPENSE",
                  referenceId: prescriptionId,
                  performedBy: auth.user.userId || "pharmacy",
                },
              });

              remainingToDeduct -= deductQty;
            }
          } catch (stockErr: any) {
            console.warn(`[pharmacy/dispense] Stock deduction failed for item ${item.inventoryItemId}:`, stockErr.message);
          }
        }
      }
    }

    return successResponse({ dispensed: true }, "Medication dispensed successfully");
  } catch (error: any) {
    console.error("[pharmacy/queue PATCH] Error:", error);
    return errorResponse(error.message || "Failed to dispense medication", 500);
  }
}

/**
 * DELETE /api/pharmacy/queue?id=<prescriptionId>&workflowId=<workflowId>&remark=<remark>
 * Remove a prescription from the pharmacy queue
 * - Deletes the pharmacy workflow entry (prescription can be re-assigned to pharmacy later)
 * - If the prescription was manually created (no appointmentId), deletes the prescription too
 * - For doctor-issued prescriptions: removes from pharmacy queue but allows doctor to prescribe again
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const prescriptionId = searchParams.get("id");
    const workflowId = searchParams.get("workflowId");
    const remark = searchParams.get("remark") || "Removed from pharmacy queue";

    if (!prescriptionId) return errorResponse("id (prescriptionId) is required", 400);

    // Get pharmacy sub-dept for this user
    let pharmacySubDeptId: string | null = null;
    if (auth.user.role === "SUB_DEPT_HEAD") {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    } else {
      const subDept = await px.subDepartment.findFirst({
        where: { hospitalId: auth.hospitalId, type: "PHARMACY" },
      });
      if (subDept) pharmacySubDeptId = subDept.id;
    }

    // Delete the pharmacy workflow entry
    if (workflowId) {
      await px.prescriptionWorkflow.deleteMany({
        where: { id: workflowId, hospitalId: auth.hospitalId, subDepartmentId: pharmacySubDeptId || undefined },
      });
    } else {
      // Delete pharmacy workflow entries for this prescription
      await px.prescriptionWorkflow.deleteMany({
        where: { 
          prescriptionId, 
          hospitalId: auth.hospitalId,
          subDepartmentId: pharmacySubDeptId || undefined,
        },
      });
    }

    // Check if this was a manually-created prescription (no appointmentId, manually added via pharmacy)
    const rx = await px.prescription.findFirst({
      where: { id: prescriptionId, hospitalId: auth.hospitalId },
      select: { id: true, appointmentId: true, prescriptionNo: true, status: true },
    });

    if (rx && !rx.appointmentId && rx.prescriptionNo?.startsWith("RX-")) {
      // Manual walk-in Rx — check if any workflow entries remain
      const remaining = await px.prescriptionWorkflow.count({ where: { prescriptionId, hospitalId: auth.hospitalId } });
      if (remaining === 0) {
        await px.prescription.deleteMany({ where: { id: prescriptionId, hospitalId: auth.hospitalId } });
      }
    } else if (rx && rx.appointmentId) {
      // Doctor-issued Rx — reset status to COMPLETED so doctor can prescribe again
      // This removes it from pharmacy queue but keeps the prescription record
      // The doctor can create a new prescription for the patient if needed
      await px.prescription.update({
        where: { id: prescriptionId },
        data: { 
          status: "COMPLETED",
          currentDeptId: null,
          doctorNotes: `${rx.doctorNotes || ""}\n[${new Date().toISOString()}] Removed from pharmacy queue. Reason: ${remark}`.trim(),
        },
      });
      
      // Also update the appointment to allow new prescriptions
      await px.appointment.update({
        where: { id: rx.appointmentId },
        data: {
          subDepartmentId: null,
          subDeptNote: null,
        },
      });
    }

    return successResponse({ deleted: true }, "Prescription removed from pharmacy queue");
  } catch (error: any) {
    console.error("[pharmacy/queue DELETE] Error:", error);
    return errorResponse(error.message || "Failed to remove prescription", 500);
  }
}

function safeJsonParse(str: string) {
  try { return JSON.parse(str); } catch { return []; }
}
