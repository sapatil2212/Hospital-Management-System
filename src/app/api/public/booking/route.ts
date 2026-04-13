import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { notify } from "../../../../../backend/services/notification.service";

export const dynamic = "force-dynamic";

/* ── GET /api/public/booking?hid=HOSPITAL_ID ─────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hid = searchParams.get("hid");
  if (!hid) return errorResponse("Missing hospital ID", 400);

  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hid },
      select: { id: true, name: true },
    });
    if (!hospital) return errorResponse("Hospital not found", 404);

    // Fetch hospital settings for logo/phone
    const settings = await (prisma as any).hospitalSettings.findUnique({
      where: { hospitalId: hid },
      select: { hospitalName: true, logo: true, phone: true, address: true },
    }).catch(() => null);

    const departments = await prisma.department.findMany({
      where: { hospitalId: hid, isActive: true },
      select: { id: true, name: true, type: true },
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
      departments,
    }, "Public booking info");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

/* ── POST /api/public/booking ─────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, name, phone, email, departmentId, departmentName, preferredDate, preferredTime, notes } = body;

    if (!hospitalId || !name || !phone) {
      return errorResponse("Hospital ID, name and phone are required", 400);
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) return errorResponse("Hospital not found", 404);

    // Create or find patient by phone
    let patient = await (prisma as any).patient.findFirst({
      where: { hospitalId, phone },
    });

    if (!patient) {
      // Generate sequential patient ID
      const count = await (prisma as any).patient.count({ where: { hospitalId } });
      const patientId = `PT-${String(count + 1).padStart(4, "0")}`;
      patient = await (prisma as any).patient.create({
        data: {
          hospitalId,
          patientId,
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
        },
      });
    }

    // Fire booking request notification so staff sees it in their bell
    await notify({
      hospitalId,
      type: "BOOKING_REQUEST",
      title: `New Booking Request — ${name}`,
      message: `${name} (${phone}) has requested an appointment${departmentName ? ` for ${departmentName}` : ""}${preferredDate ? ` on ${preferredDate}` : ""}.`,
      metadata: {
        patientId: patient.id,
        patientName: name,
        phone,
        email: email || null,
        departmentId: departmentId || null,
        departmentName: departmentName || null,
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        notes: notes || null,
        source: "QR_BOOKING",
      },
    });

    return successResponse({
      patientId: patient.patientId,
      name: patient.name,
    }, "Booking request submitted successfully", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
