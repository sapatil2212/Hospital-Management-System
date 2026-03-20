import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { createDoctor, findAllDoctors, updateDoctor, deleteDoctor, upsertAvailability, findAllDoctorsSimple } from "../../../../../backend/repositories/doctor.repo";
import { z } from "zod";

const doctorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  departmentId: z.string().optional(),
  consultationFee: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

const availabilitySchema = z.object({
  doctorId: z.string(),
  day: z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]),
  startTime: z.string(),
  endTime: z.string(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const simple = searchParams.get("simple");

    // Simple list for dropdowns (HOD selection, etc.)
    if (simple === "true") {
      const data = await findAllDoctorsSimple(auth.hospitalId);
      return successResponse(data, "Doctors fetched");
    }

    const data = await findAllDoctors(auth.hospitalId, search);
    return successResponse(data, "Doctors fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    // Availability upsert
    if (searchParams.get("availability") === "true") {
      const result = availabilitySchema.safeParse(body);
      if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
      const data = await upsertAvailability(result.data.doctorId, result.data.day, result.data.startTime, result.data.endTime);
      return successResponse(data, "Availability set", 201);
    }

    const result = doctorSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createDoctor({ hospitalId: auth.hospitalId, ...result.data });
    return successResponse(data, "Doctor created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Doctor with this email already exists in your hospital", 409);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    await updateDoctor(id, auth.hospitalId, updateData);
    return successResponse(null, "Doctor updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await deleteDoctor(id, auth.hospitalId);
    return successResponse(null, "Doctor deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
