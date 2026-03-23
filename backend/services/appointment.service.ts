import {
  createAppointment as createAppointmentRepo,
  findAllAppointments,
  findAppointmentById,
  updateAppointment as updateAppointmentRepo,
  deleteAppointment as deleteAppointmentRepo,
  checkSlotConflict,
  getNextToken,
  getBookedSlots,
  getAppointmentStats,
} from "../repositories/appointment.repo";
import { findPatientById } from "../repositories/patient.repo";
import { findDoctorById } from "../repositories/doctor.repo";
import { CreateAppointmentInput, UpdateAppointmentInput } from "../validations/appointment.validation";
import { sendAppointmentConfirmation } from "../utils/mailer";
import { generateBillFromAppointment, addWorkflowChargesToBill } from "./billing.service";
import prisma from "../config/db";

const px = prisma as any;

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class AppointmentServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AppointmentServiceError";
  }
}

/**
 * Book a new appointment with full validation.
 */
export const bookAppointment = async (
  hospitalId: string,
  hospitalName: string,
  input: CreateAppointmentInput
) => {
  const appointmentDate = new Date(input.appointmentDate);

  // Prevent past date bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new AppointmentServiceError(
      "Cannot book appointments for past dates",
      "PAST_DATE",
      400
    );
  }

  // Verify patient exists
  const patient = await findPatientById(input.patientId, hospitalId);
  if (!patient) {
    throw new AppointmentServiceError("Patient not found", "PATIENT_NOT_FOUND", 404);
  }

  // Verify doctor exists and is active
  const doctor = await findDoctorById(input.doctorId, hospitalId);
  if (!doctor) {
    throw new AppointmentServiceError("Doctor not found", "DOCTOR_NOT_FOUND", 404);
  }
  if (!doctor.isActive) {
    throw new AppointmentServiceError("Doctor is not currently active", "DOCTOR_INACTIVE", 400);
  }

  // Check slot conflict
  const hasConflict = await checkSlotConflict(
    hospitalId,
    input.doctorId,
    appointmentDate,
    input.timeSlot
  );
  if (hasConflict) {
    throw new AppointmentServiceError(
      "This time slot is already booked for the selected doctor",
      "SLOT_CONFLICT",
      409
    );
  }

  // Generate token number for this doctor on this date
  const tokenNumber = await getNextToken(hospitalId, input.doctorId, appointmentDate);

  // Use consultation fee from input, then doctor, then department
  const consultationFee =
    input.consultationFee ??
    doctor.consultationFee ??
    (doctor as any).department?.consultationFee;

  const appointment = await createAppointmentRepo({
    hospitalId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    departmentId: input.departmentId || doctor.departmentId || null,
    appointmentDate,
    timeSlot: input.timeSlot,
    type: input.type || "OPD",
    status: "SCHEDULED",
    consultationFee,
    tokenNumber,
    notes: input.notes || null,
  });

  // Send confirmation email asynchronously
  if (patient.email) {
    const deptName = (appointment as any).department?.name || "General";
    sendAppointmentConfirmation({
      to: patient.email,
      patientName: patient.name,
      patientId: patient.patientId,
      doctorName: doctor.name,
      departmentName: deptName,
      appointmentDate: appointmentDate.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeSlot: input.timeSlot,
      tokenNumber,
      type: input.type || "OPD",
      hospitalName,
    }).catch(() => {});
  }

  return appointment;
};

/**
 * Get appointments with pagination and filters.
 */
export const getAppointments = async (options: Parameters<typeof findAllAppointments>[0]) => {
  return findAllAppointments(options);
};

/**
 * Get a single appointment by ID.
 */
export const getAppointmentById = async (id: string, hospitalId: string) => {
  const appointment = await findAppointmentById(id, hospitalId);
  if (!appointment) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }
  return appointment;
};

/**
 * Update appointment status / details with conflict re-check on reschedule.
 */
export const updateAppointment = async (
  id: string,
  hospitalId: string,
  input: UpdateAppointmentInput
) => {
  const existing = await findAppointmentById(id, hospitalId);
  if (!existing) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }

  // If rescheduling (date or time changes), validate no conflict
  if (input.appointmentDate || input.timeSlot) {
    const newDate = input.appointmentDate ? new Date(input.appointmentDate) : existing.appointmentDate;
    const newSlot = input.timeSlot || existing.timeSlot;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      throw new AppointmentServiceError("Cannot reschedule to a past date", "PAST_DATE", 400);
    }

    const hasConflict = await checkSlotConflict(
      hospitalId,
      existing.doctorId,
      newDate,
      newSlot,
      id
    );
    if (hasConflict) {
      throw new AppointmentServiceError(
        "This time slot is already booked for the selected doctor",
        "SLOT_CONFLICT",
        409
      );
    }
  }

  const updateData: any = {};
  if (input.appointmentDate !== undefined) updateData.appointmentDate = new Date(input.appointmentDate);
  if (input.timeSlot !== undefined) updateData.timeSlot = input.timeSlot;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.consultationFee !== undefined) updateData.consultationFee = input.consultationFee;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.tokenNumber !== undefined) updateData.tokenNumber = input.tokenNumber;
  if (input.subDepartmentId !== undefined) updateData.subDepartmentId = input.subDepartmentId;
  if (input.subDeptNote !== undefined) updateData.subDeptNote = input.subDeptNote;

  const updated = await updateAppointmentRepo(id, hospitalId, updateData);

  if (input.status !== undefined && input.status !== existing.status) {
    try {
      const rx = await px.prescription.findFirst({
        where: { hospitalId, appointmentId: id },
        select: { id: true, status: true, referrals: true },
      });

      if (rx) {
        if (input.status === "CANCELLED" || input.status === "NO_SHOW") {
          await px.prescription.update({
            where: { id: rx.id },
            data: { status: "CLOSED", currentDeptId: null },
          });
          await px.prescriptionWorkflow.updateMany({
            where: { prescriptionId: rx.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
            data: { status: "SKIPPED" },
          });
        }

        if (input.status === "SCHEDULED" || input.status === "CONFIRMED" || input.status === "IN_PROGRESS") {
          if (rx.status === "CLOSED") {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "DRAFT" },
            });
          }
        }

        if (input.status === "COMPLETED") {
          let referrals: any[] = [];
          if (rx.referrals) {
            try { referrals = JSON.parse(rx.referrals); } catch { referrals = []; }
          }

          if (referrals.length > 0) {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "IN_WORKFLOW", currentDeptId: referrals[0].subDeptId || null },
            });

            const stepCount = await px.prescriptionWorkflow.count({ where: { prescriptionId: rx.id } });
            if (stepCount === 0) {
              await px.prescriptionWorkflow.createMany({
                data: referrals.map((ref: any, idx: number) => ({
                  hospitalId,
                  prescriptionId: rx.id,
                  subDepartmentId: ref.subDeptId,
                  sequence: idx,
                  status: idx === 0 ? "IN_PROGRESS" : "PENDING",
                })),
              });
            }
          } else {
            await px.prescription.update({
              where: { id: rx.id },
              data: { status: "COMPLETED", currentDeptId: null },
            });
          }
        }
      }
    } catch {}
  }

  // Event: appointment COMPLETED → auto-generate consultation bill
  if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
    generateBillFromAppointment(id, hospitalId).catch(() => {});
  } else if (input.consultationFee !== undefined) {
    // If fee updated after completion, sync with existing bill if any
    const bill = await (prisma as any).bill.findFirst({ where: { visitId: id, hospitalId } });
    if (bill) {
      addWorkflowChargesToBill(bill.id, hospitalId).catch(() => {});
    }
  }

  return updated;
};

/**
 * Cancel an appointment.
 */
export const cancelAppointment = async (id: string, hospitalId: string) => {
  const existing = await findAppointmentById(id, hospitalId);
  if (!existing) {
    throw new AppointmentServiceError("Appointment not found", "NOT_FOUND", 404);
  }
  if (existing.status === "COMPLETED") {
    throw new AppointmentServiceError(
      "Cannot cancel a completed appointment",
      "ALREADY_COMPLETED",
      400
    );
  }
  return updateAppointmentRepo(id, hospitalId, { status: "CANCELLED" });
};

/**
 * Get available time slots for a doctor on a specific date.
 * Generates slots from availability and removes already-booked ones.
 */
export const getAvailableSlots = async (
  hospitalId: string,
  doctorId: string,
  date: string
) => {
  const doctor = await findDoctorById(doctorId, hospitalId);
  if (!doctor) {
    throw new AppointmentServiceError("Doctor not found", "NOT_FOUND", 404);
  }

  const targetDate = new Date(date);
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayName = dayNames[targetDate.getDay()];

  // Find availability for this day
  const dayAvailability = doctor.availability?.find(
    (a: any) => a.day === dayName && a.isActive
  );

  if (!dayAvailability) {
    return { slots: [], bookedSlots: [], message: "Doctor is not available on this day" };
  }

  // Generate time slots
  const slots = generateSlots(
    dayAvailability.startTime,
    dayAvailability.endTime,
    dayAvailability.slotDuration || 30
  );

  // Get already-booked slots
  const bookedSlots = await getBookedSlots(hospitalId, doctorId, targetDate);

  const availableSlots = slots.filter((s) => !bookedSlots.includes(s));

  return {
    slots: availableSlots,
    bookedSlots,
    allSlots: slots,
    availability: {
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
      slotDuration: dayAvailability.slotDuration || 30,
    },
  };
};

/**
 * Get appointment statistics.
 */
export const getStats = async (hospitalId: string) => {
  return getAppointmentStats(hospitalId);
};

// ─── Helpers ───

function generateSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + duration <= end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    cur += duration;
  }
  return slots;
}
