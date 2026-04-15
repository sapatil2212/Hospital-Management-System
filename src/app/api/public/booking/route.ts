import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { bookAppointment, AppointmentServiceError } from "../../../../../backend/services/appointment.service";
import { notify } from "../../../../../backend/services/notification.service";
import { findPatientByPhone, generatePatientId, createPatient } from "../../../../../backend/repositories/patient.repo";

export const dynamic = "force-dynamic";

// Single-tenant: Celeb Aesthecia
const DEFAULT_HOSPITAL_ID = "c61cb493-dcf1-4ac1-a82d-a2a81caf07ed";

const APPOINTMENT_DEPT_TYPES = ["CLINICAL", "DIAGNOSTIC", "PROCEDURE", "SUPPORT"];

/* ── GET /api/public/booking?hid=HOSPITAL_ID ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hid = searchParams.get("hid") || DEFAULT_HOSPITAL_ID;

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hid },
      select: { id: true, name: true },
    });
    if (!hospital) return errorResponse("Hospital not found", 404);

    const settings = await (prisma as any).hospitalSettings.findUnique({
      where: { hospitalId: hid },
      select: { hospitalName: true, logo: true, phone: true, address: true },
    }).catch(() => null);

    const departments = await prisma.department.findMany({
      where: { hospitalId: hid, isActive: true },
      select: { id: true, name: true, code: true, type: true },
      orderBy: { name: "asc" },
    });

    return successResponse({
      hospital: {
        id: hospital.id,
        name: settings?.hospitalName || hospital.name,
        logo: settings?.logo || null,
        phone: settings?.phone || null,
        address: settings?.address || null,
      },
      departments: departments.filter(d => d.type && APPOINTMENT_DEPT_TYPES.includes(d.type)),
    }, "Public booking info");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

/* ── POST /api/public/booking ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, doctorId, departmentId, appointmentDate, timeSlot, type, consultationFee, notes } = body;
    // Always use the default hospital — ignore any hospitalId from client
    const hospitalId = DEFAULT_HOSPITAL_ID;

    if (!name || !phone || !doctorId || !appointmentDate || !timeSlot) {
      return errorResponse("Missing required fields", 400);
    }

    // Parallel: hospital + patient lookup
    const [hospital, existingPatient] = await Promise.all([
      prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true } }),
      findPatientByPhone(hospitalId, phone.trim()),
    ]);
    if (!hospital) return errorResponse("Hospital not found", 404);

    let patient: any = existingPatient;

    if (!patient) {
      const patientId = await generatePatientId(hospitalId);
      patient = await createPatient({
        hospitalId,
        patientId,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
      });
    } else {
      // Update name/email if changed since last booking
      const trimmedName = name.trim();
      const trimmedEmail = email?.trim() || null;
      if (patient.name !== trimmedName || (trimmedEmail && patient.email !== trimmedEmail)) {
        patient = await prisma.patient.update({
          where: { id: patient.id },
          data: {
            name: trimmedName,
            ...(trimmedEmail ? { email: trimmedEmail } : {}),
          },
        });
      }
    }

    // Book via existing service (handles conflict checks, token generation, email)
    const appointment = await bookAppointment(hospitalId, hospital.name, {
      patientId: patient.id,
      doctorId,
      departmentId: departmentId || null,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      type: type || "OPD",
      consultationFee: consultationFee ? Number(consultationFee) : undefined,
      notes: notes || null,
    });

    // Fire notification
    notify({
      hospitalId,
      type: "BOOKING_REQUEST",
      title: `QR Booking — ${name}`,
      message: `${name} (${phone}) booked an appointment via QR code.`,
      metadata: { patientId: patient.id, source: "QR_BOOKING" },
    }).catch(() => {});

    return successResponse({ appointment }, "Appointment booked successfully", 201);
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
