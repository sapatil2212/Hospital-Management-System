import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { createStaff, findAllStaff, updateStaff, deleteStaff } from "../../../../../backend/repositories/staff.repo";
import { z } from "zod";

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["NURSE","TECHNICIAN","PHARMACIST","RECEPTIONIST","LAB_TECHNICIAN","ACCOUNTANT","ADMIN","SUPPORT","OTHER"]),
  departmentId: z.string().optional(),
  salary: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const data = await findAllStaff(auth.hospitalId, searchParams.get("search") || undefined);
    return successResponse(data, "Staff fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = staffSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createStaff({ hospitalId: auth.hospitalId, ...result.data });
    return successResponse(data, "Staff created", 201);
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    await updateStaff(id, auth.hospitalId, updateData);
    return successResponse(null, "Staff updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await deleteStaff(id, auth.hospitalId);
    return successResponse(null, "Staff deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
