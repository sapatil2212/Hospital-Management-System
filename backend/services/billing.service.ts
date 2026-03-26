import prisma from "../config/db";

// ── Add workflow charges to bill ───────────────────────────────────────────
export async function addWorkflowChargesToBill(
  billId: string,
  hospitalId: string
): Promise<void> {
  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    select: { prescriptionId: true, visitId: true },
  });

  if (!bill) return;

  let prescriptionId = bill.prescriptionId;

  // If prescriptionId is missing but visitId exists, try to find the prescription
  if (!prescriptionId && bill.visitId) {
    const rx = await (prisma as any).prescription.findFirst({
      where: { appointmentId: bill.visitId, hospitalId },
      select: { id: true },
    });
    if (rx) {
      prescriptionId = rx.id;
      // Link the bill to the prescription for future syncs
      await (prisma as any).bill.update({
        where: { id: billId },
        data: { prescriptionId },
      });
    }
  }

  if (!prescriptionId) return;

  // 1. Check for Consultation Fee from Prescription/Appointment
  const prescription = await (prisma as any).prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      appointment: {
        include: { doctor: { select: { name: true, consultationFee: true } } },
      },
      doctor: { select: { name: true, consultationFee: true } },
    },
  });

  if (prescription) {
    const consultationFee =
      prescription.consultationFee ??
      prescription.appointment?.consultationFee ??
      prescription.appointment?.doctor?.consultationFee ??
      prescription.doctor?.consultationFee ??
      0;

    if (consultationFee > 0) {
      const existingConsultation = await (prisma as any).billItem.findFirst({
        where: { billId, type: "CONSULTATION" },
      });

      if (!existingConsultation) {
        await (prisma as any).billItem.create({
          data: {
            hospitalId,
            billId,
            type: "CONSULTATION",
            referenceId: prescription.doctorId,
            name: `Consultation — Dr. ${prescription.doctor?.name || "Doctor"}`,
            quantity: 1,
            unitPrice: consultationFee,
            amount: consultationFee,
          },
        });
      } else if (existingConsultation.unitPrice !== consultationFee) {
        // Update if fee changed (e.g. doctor modified it in prescription)
        await (prisma as any).billItem.update({
          where: { id: existingConsultation.id },
          data: {
            unitPrice: consultationFee,
            amount: consultationFee,
          },
        });
      }
    }
  }

  // 2. Add Workflow Charges
  const workflows = await (prisma as any).prescriptionWorkflow.findMany({
    where: { prescriptionId: prescriptionId, totalCharge: { gt: 0 } },
    include: { subDepartment: { select: { name: true, type: true } } },
  });

  for (const wf of workflows) {
    // Avoid adding duplicate charges, but update if amount changed
    const existing = await (prisma as any).billItem.findFirst({
      where: { billId, referenceId: wf.id },
    });

    if (existing) {
      if (existing.unitPrice !== wf.totalCharge) {
        await (prisma as any).billItem.update({
          where: { id: existing.id },
          data: {
            unitPrice: wf.totalCharge,
            amount: wf.totalCharge,
          },
        });
      }
      continue;
    }

    await (prisma as any).billItem.create({
      data: {
        hospitalId,
        billId,
        type: wf.subDepartment?.type || "OTHER",
        referenceId: wf.id,
        name: `Service: ${wf.subDepartment?.name || "Sub-department"}`,
        quantity: 1,
        unitPrice: wf.totalCharge,
        amount: wf.totalCharge,
      },
    });
  }

  await recalculateBill(billId, hospitalId);
}


export class BillingServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ── Sequential bill number ──────────────────────────────────────────────────
async function generateBillNo(hospitalId: string): Promise<string> {
  const last = await (prisma as any).bill.findFirst({
    where: { hospitalId },
    orderBy: { billNo: "desc" },
    select: { billNo: true },
  });
  let next = 1;
  if (last?.billNo) {
    const m = last.billNo.match(/(\d+)$/);
    if (m) next = parseInt(m[1], 10) + 1;
  }
  return `BILL-${String(next).padStart(4, "0")}`;
}

// ── Log revenue automatically ───────────────────────────────────────────────
export async function logRevenue(
  hospitalId: string,
  sourceType: string,
  amount: number,
  referenceId?: string,
  referenceType?: string,
  description?: string
) {
  try {
    await (prisma as any).revenue.create({
      data: { hospitalId, sourceType, amount, referenceId, referenceType, description },
    });
  } catch { /* fire and forget */ }
}

// ── Generate bill from appointment (consultation) ──────────────────────────
export async function generateBillFromAppointment(
  appointmentId: string,
  hospitalId: string
): Promise<any> {
  const appt = await (prisma as any).appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      patient: { select: { id: true, name: true, patientId: true } },
      doctor:  { select: { id: true, name: true, consultationFee: true } },
    },
  });
  if (!appt) throw new BillingServiceError("Appointment not found", 404);

  // Check if bill already exists for this appointment
  const existing = await (prisma as any).bill.findFirst({
    where: { visitId: appointmentId, hospitalId },
  });
  if (existing) return existing;

  // Look up prescription's consultationFee (doctor may have modified it)
  const prescription = await (prisma as any).prescription.findFirst({
    where: { appointmentId, hospitalId },
    select: { id: true, consultationFee: true },
  });

  // Priority: prescription fee > appointment fee > doctor default fee
  const fee = prescription?.consultationFee ?? appt.consultationFee ?? appt.doctor?.consultationFee ?? 0;
  const billNo = await generateBillNo(hospitalId);

  const bill = await (prisma as any).bill.create({
    data: {
      hospitalId,
      billNo,
      patientId: appt.patientId,
      visitId: appointmentId,
      prescriptionId: prescription?.id || null,
      items: JSON.stringify([]),
      subtotal: fee,
      discount: 0,
      tax: 0,
      total: fee,
      paidAmount: 0,
      status: "PENDING",
      billItems: {
        create: fee > 0 ? [{
          hospitalId,
          type: "CONSULTATION",
          referenceId: appt.doctorId,
          name: `Consultation — Dr. ${appt.doctor?.name || "Doctor"}`,
          quantity: 1,
          unitPrice: fee,
          amount: fee,
        }] : [],
      },
    },
    include: { billItems: true },
  });

  // Mark appointment as billing-transferred so it shows in billing queue
  await (prisma as any).appointment.update({
    where: { id: appointmentId },
    data: { billingTransferred: true },
  }).catch(() => {});

  // Log revenue
  if (fee > 0) {
    logRevenue(hospitalId, "CONSULTATION", fee, bill.id, "Bill", `Consultation — ${appt.patient?.name}`);
  }

  return bill;
}

// ── Add procedure charge to the SAME bill for this appointment ──────────────
export async function addProcedureChargeToBill(
  procedureRecordId: string,
  hospitalId: string
): Promise<any> {
  const rec = await (prisma as any).procedureRecord.findFirst({
    where: { id: procedureRecordId, hospitalId },
    include: {
      procedure: { select: { name: true, type: true } },
      patient:   { select: { id: true } },
    },
  });
  if (!rec) return null;

  // Find existing bill for this appointment — never create a separate bill
  let bill = rec.appointmentId
    ? await (prisma as any).bill.findFirst({ where: { visitId: rec.appointmentId, hospitalId } })
    : null;

  // If no bill exists yet, generate one from the appointment (creates with consultation fee)
  if (!bill && rec.appointmentId) {
    try {
      bill = await generateBillFromAppointment(rec.appointmentId, hospitalId);
    } catch { /* appointment may not exist */ }
  }

  // Last resort: no appointment linked — should not happen in normal flow, skip billing
  if (!bill) return null;

  // Avoid duplicate: check if this procedure record is already on the bill
  const existingItem = await (prisma as any).billItem.findFirst({
    where: { billId: bill.id, type: "PROCEDURE", referenceId: rec.procedureId },
  });

  if (existingItem) {
    // Update amount if it changed
    if (existingItem.unitPrice !== rec.amount) {
      await (prisma as any).billItem.update({
        where: { id: existingItem.id },
        data: { unitPrice: rec.amount, amount: rec.amount },
      });
      await recalculateBill(bill.id, hospitalId);
    }
    return bill;
  }

  // Add new BillItem for this procedure
  await (prisma as any).billItem.create({
    data: {
      hospitalId,
      billId: bill.id,
      type: "PROCEDURE",
      referenceId: rec.procedureId,
      name: rec.procedure?.name || "Procedure",
      quantity: 1,
      unitPrice: rec.amount,
      amount: rec.amount,
    },
  });

  // Recalculate bill total
  await recalculateBill(bill.id, hospitalId);

  // Log revenue
  logRevenue(hospitalId, "PROCEDURE", rec.amount, procedureRecordId, "ProcedureRecord", rec.procedure?.name);

  return bill;
}

// ── Recalculate bill total from BillItems ──────────────────────────────────
export async function recalculateBill(billId: string, hospitalId: string): Promise<void> {
  const items = await (prisma as any).billItem.findMany({ where: { billId, hospitalId } });
  const subtotal: number = items.reduce((s: number, i: any) => s + i.amount, 0);
  const bill = await (prisma as any).bill.findUnique({ where: { id: billId } });
  if (!bill) return;
  const tax = bill.tax || 0;
  const discount = bill.discount || 0;
  const total = subtotal + tax - discount;
  await (prisma as any).bill.update({
    where: { id: billId },
    data: { subtotal, total: Math.max(0, total) },
  });
}

// ── Replace bill items ──────────────────────────────────────────────────────
export async function updateBillItems(
  billId: string,
  hospitalId: string,
  items: { type: string; name: string; quantity: number; unitPrice: number; referenceId?: string }[]
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if (bill.status === "PAID" || Number(bill.paidAmount || 0) > 0) {
    throw new BillingServiceError("Cannot edit bill items after payments. Create an adjustment bill instead.", 400);
  }

  // Remove existing items
  await (prisma as any).billItem.deleteMany({ where: { billId } });

  // Create new items
  if (items.length > 0) {
    await (prisma as any).billItem.createMany({
      data: items.map((i: any) => ({
        hospitalId,
        billId,
        type: i.type || "OTHER",
        referenceId: i.referenceId || null,
        name: i.name,
        quantity: Number(i.quantity || 0),
        unitPrice: Number(i.unitPrice || 0),
        amount: Number(i.quantity || 0) * Number(i.unitPrice || 0),
      })),
    });
  }

  // Store items JSON snapshot too
  await (prisma as any).bill.update({
    where: { id: billId },
    data: { items: JSON.stringify(items) },
  });

  await recalculateBill(billId, hospitalId);

  return (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: { billItems: true, payments: true, patient: { select: { id: true, name: true, patientId: true, phone: true } } },
  });
}

// ── Create a full bill manually ────────────────────────────────────────────
export async function createBill(
  hospitalId: string,
  data: {
    patientId: string;
    visitId?: string;
    items: { type: string; name: string; quantity: number; unitPrice: number; referenceId?: string }[];
    discount?: number;
    tax?: number;
    notes?: string;
  }
): Promise<any> {
  const patient = await (prisma as any).patient.findFirst({
    where: { id: data.patientId, hospitalId },
  });
  if (!patient) throw new BillingServiceError("Patient not found", 404);

  if (data.visitId) {
    const existing = await (prisma as any).bill.findFirst({ where: { visitId: data.visitId, hospitalId } });
    if (existing) throw new BillingServiceError("A bill already exists for this visit", 409);
  }

  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discount = data.discount ?? 0;
  const tax = data.tax ?? 0;
  const total = Math.max(0, subtotal + tax - discount);
  const billNo = await generateBillNo(hospitalId);

  const bill = await (prisma as any).bill.create({
    data: {
      hospitalId,
      billNo,
      patientId: data.patientId,
      visitId: data.visitId || null,
      items: JSON.stringify(data.items),
      subtotal,
      discount,
      tax,
      total,
      paidAmount: 0,
      status: "PENDING",
      notes: data.notes || null,
      billItems: {
        create: data.items.map(i => ({
          hospitalId,
          type: i.type || "OTHER",
          referenceId: i.referenceId || null,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.quantity * i.unitPrice,
        })),
      },
    },
    include: {
      billItems: true,
      patient: { select: { id: true, name: true, patientId: true, phone: true } },
    },
  });

  // Sync with workflow charges (consultation fee + procedures)
  await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});

  return bill;
}

// ── Record a payment ───────────────────────────────────────────────────────
export async function recordPayment(
  billId: string,
  hospitalId: string,
  data: { amount: number; method: string; transactionId?: string; notes?: string }
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if (bill.status === "PAID") throw new BillingServiceError("Bill is already fully paid", 400);

  const paymentAmount = parseFloat(String(data.amount));
  if (paymentAmount <= 0) throw new BillingServiceError("Payment amount must be positive", 400);

  const remaining = bill.total - bill.paidAmount;
  if (paymentAmount > remaining + 0.01) {
    throw new BillingServiceError(`Payment (₹${paymentAmount}) exceeds remaining balance (₹${remaining.toFixed(2)})`, 400);
  }

  const payment = await (prisma as any).payment.create({
    data: {
      hospitalId,
      billId,
      amount: paymentAmount,
      method: data.method || "CASH",
      transactionId: data.transactionId || null,
      status: "SUCCESS",
      notes: data.notes || null,
    },
  });

  const newPaid = bill.paidAmount + paymentAmount;
  const newStatus = newPaid >= bill.total - 0.01 ? "PAID" : "PARTIALLY_PAID";
  await (prisma as any).bill.update({
    where: { id: billId },
    data: {
      paidAmount: newPaid,
      status: newStatus,
      paidAt: newStatus === "PAID" ? new Date() : bill.paidAt,
      paymentMethod: data.method,
    },
  });

  // Log revenue
  logRevenue(hospitalId, "OTHER", paymentAmount, billId, "Bill", `Payment received — ${data.method}`);

  return payment;
}

// ── Get bills list ─────────────────────────────────────────────────────────
export async function getBills(
  hospitalId: string,
  opts: { page?: number; limit?: number; search?: string; status?: string; dateFrom?: string; dateTo?: string; patientId?: string }
) {
  const page  = Math.max(1, opts.page  || 1);
  const limit = Math.min(50, opts.limit || 20);
  const where: any = { hospitalId };

  if (opts.patientId) where.patientId = opts.patientId;
  if (opts.status) where.status = opts.status;
  if (opts.dateFrom || opts.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
    if (opts.dateTo)   where.createdAt.lte = new Date(opts.dateTo + "T23:59:59");
  }
  if (opts.search) {
    where.OR = [
      { billNo: { contains: opts.search } },
      { patient: { OR: [{ name: { contains: opts.search } }, { patientId: { contains: opts.search } }] } },
    ];
  }

  const [bills, total] = await Promise.all([
    (prisma as any).bill.findMany({
      where,
      include: {
        patient:   { select: { id: true, name: true, patientId: true, phone: true } },
        billItems: true,
        payments:  { orderBy: { paidAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).bill.count({ where }),
  ]);

  // Stats
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayRevenue, monthRevenue, pendingCount] = await Promise.all([
    (prisma as any).bill.aggregate({
      where: { hospitalId, status: "PAID", paidAt: { gte: today } },
      _sum: { total: true },
    }),
    (prisma as any).bill.aggregate({
      where: { hospitalId, status: "PAID", paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { total: true },
    }),
    (prisma as any).bill.count({ where: { hospitalId, status: "PENDING" } }),
  ]);

  return {
    bills,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: {
      todayRevenue:  todayRevenue._sum.total  || 0,
      monthRevenue:  monthRevenue._sum.total  || 0,
      pendingCount,
    },
  };
}

// ── Get single bill ────────────────────────────────────────────────────────
export async function getBillById(billId: string, hospitalId: string): Promise<any> {
  // Sync with workflow charges before returning
  await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});

  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: {
      patient:  { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true } },
      billItems: { orderBy: { createdAt: "asc" } },
      payments:  { orderBy: { paidAt: "desc" } },
      prescription: { select: { prescriptionNo: true, doctorId: true, doctor: { select: { name: true } } } },
    },
  });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  return bill;
}

// ── Update bill (discount / tax / notes) ──────────────────────────────────
export async function updateBill(
  billId: string,
  hospitalId: string,
  data: { discount?: number; tax?: number; notes?: string; status?: string }
): Promise<any> {
  const bill = await (prisma as any).bill.findFirst({ where: { id: billId, hospitalId } });
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  if ((bill.status === "PAID" || Number(bill.paidAmount || 0) > 0) && (data.discount !== undefined || data.tax !== undefined)) {
    throw new BillingServiceError("Cannot change tax/discount after payments. Create an adjustment bill instead.", 400);
  }

  // Sync with workflow charges
  await addWorkflowChargesToBill(billId, hospitalId).catch(() => {});

  const discount = data.discount ?? bill.discount;
  const tax      = data.tax      ?? bill.tax;
  const total    = Math.max(0, bill.subtotal + tax - discount);

  // Recalculate status based on new total and existing paid amount
  let newStatus = bill.status;
  if (total <= bill.paidAmount + 0.01) {
    newStatus = "PAID";
  } else if (bill.paidAmount > 0) {
    newStatus = "PARTIALLY_PAID";
  } else {
    newStatus = "PENDING";
  }

  const finalStatus = data.status ?? newStatus;
  const paidAt = (finalStatus === "PAID" && bill.status !== "PAID") ? new Date() : bill.paidAt;

  return (prisma as any).bill.update({
    where: { id: billId },
    data: {
      discount,
      tax,
      total,
      notes: data.notes ?? bill.notes,
      status: finalStatus,
      paidAt,
    },
    include: { billItems: true, payments: true },
  });
}

// ── Transfer appointment to billing queue ─────────────────────────────────
export async function transferToBilling(
  appointmentId: string,
  hospitalId: string,
  note?: string
): Promise<any> {
  const appt = await (prisma as any).appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      patient: { select: { id: true, name: true, patientId: true } },
      doctor: { select: { id: true, name: true, consultationFee: true } },
    },
  });
  if (!appt) throw new BillingServiceError("Appointment not found", 404);

  // Mark as billing transferred
  await (prisma as any).appointment.update({
    where: { id: appointmentId },
    data: {
      billingTransferred: true,
      ...(note ? { billingNote: note } : {}),
    },
  });

  // Create bill if it doesn't exist yet
  let bill = await (prisma as any).bill.findFirst({
    where: { visitId: appointmentId, hospitalId },
  });

  if (!bill) {
    bill = await generateBillFromAppointment(appointmentId, hospitalId);
  } else {
    // Sync charges (consultation + workflow) on the existing bill
    await addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
  }

  return bill;
}

// ── Get billing queue (transferred appointments) ──────────────────────────
export async function getBillingQueue(
  hospitalId: string,
  opts: { search?: string; date?: string }
): Promise<any[]> {
  const where: any = {
    hospitalId,
    billingTransferred: true,
  };

  if (opts.date) {
    const d = new Date(opts.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.appointmentDate = { gte: d, lt: nextDay };
  }

  if (opts.search) {
    where.OR = [
      { patient: { name: { contains: opts.search } } },
      { patient: { patientId: { contains: opts.search } } },
      { patient: { phone: { contains: opts.search } } },
      { doctor: { name: { contains: opts.search } } },
    ];
  }

  const appointments = await (prisma as any).appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, patientId: true, phone: true } },
      doctor: { select: { id: true, name: true, specialization: true, consultationFee: true } },
      department: { select: { name: true } },
      subDepartment: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Attach bill info for each appointment
  const apptIds = appointments.map((a: any) => a.id);
  const bills = apptIds.length > 0
    ? await (prisma as any).bill.findMany({
        where: { visitId: { in: apptIds }, hospitalId },
        include: { billItems: true, payments: true },
      })
    : [];

  const billMap = new Map(bills.map((b: any) => [b.visitId, b]));

  return appointments.map((a: any) => ({
    ...a,
    bill: billMap.get(a.id) || null,
  }));
}

// ── Delete bill ────────────────────────────────────────────────────────────
export async function deleteBill(billId: string, hospitalId: string): Promise<void> {
  const bill = await (prisma as any).bill.findFirst({
    where: { id: billId, hospitalId },
    include: { payments: true },
  });
  
  if (!bill) throw new BillingServiceError("Bill not found", 404);
  
  // Prevent deletion of paid bills
  if (bill.status === "PAID" || bill.paidAmount > 0) {
    throw new BillingServiceError("Cannot delete a bill with payments. Please void/cancel instead.", 400);
  }

  // Delete bill items first (cascade should handle this, but explicit is safer)
  await (prisma as any).billItem.deleteMany({ where: { billId } });
  
  // Delete the bill
  await (prisma as any).bill.delete({ where: { id: billId } });
}

// ── Finance Dept service ───────────────────────────────────────────────────
export async function getFinanceDept(hospitalId: string): Promise<any> {
  return (prisma as any).financeDepartment.findUnique({ where: { hospitalId } });
}

export async function upsertFinanceDept(
  hospitalId: string,
  data: { name?: string; hodName?: string; hodEmail?: string; hodPhone?: string; isActive?: boolean }
): Promise<any> {
  const existing = await (prisma as any).financeDepartment.findUnique({ where: { hospitalId } });
  if (existing) {
    return (prisma as any).financeDepartment.update({ where: { hospitalId }, data });
  }
  return (prisma as any).financeDepartment.create({ data: { hospitalId, ...data } });
}

// Note: getFinanceDashboardStats moved to backend/services/finance.service.ts
// to include inventory purchase expenses alongside operational expenses
