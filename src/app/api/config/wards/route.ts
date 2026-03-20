import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { createWard, findAllWards, updateWard, deleteWard, createBed, findAllBeds, updateBed, deleteBed } from "../../../../../backend/repositories/ward.repo";
import { z } from "zod";

const wardSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["GENERAL","PRIVATE","SEMI_PRIVATE","ICU","NICU","PICU","EMERGENCY","MATERNITY","ISOLATION"]),
  floor: z.string().optional(),
  capacity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const bedSchema = z.object({
  wardId: z.string(),
  bedNumber: z.string().min(1),
  status: z.enum(["AVAILABLE","OCCUPIED","MAINTENANCE","RESERVED"]).optional(),
  pricePerDay: z.number().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("beds") === "true") {
      const wardId = searchParams.get("wardId") || undefined;
      const data = await findAllBeds(auth.hospitalId, wardId);
      return successResponse(data, "Beds fetched");
    }
    const data = await findAllWards(auth.hospitalId);
    return successResponse(data, "Wards fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    if (searchParams.get("beds") === "true") {
      const result = bedSchema.safeParse(body);
      if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
      const data = await createBed({ hospitalId: auth.hospitalId, ...result.data });
      return successResponse(data, "Bed created", 201);
    }

    const result = wardSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createWard({ hospitalId: auth.hospitalId, ...result.data });
    return successResponse(data, "Ward created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Ward/Bed already exists with this name/number", 409);
    return errorResponse(e.message, 500);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { id, isBed, ...updateData } = body;
    if (!id) return errorResponse("ID is required", 400);
    if (isBed) { await updateBed(id, auth.hospitalId, updateData); return successResponse(null, "Bed updated"); }
    await updateWard(id, auth.hospitalId, updateData);
    return successResponse(null, "Ward updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    if (searchParams.get("beds") === "true") { await deleteBed(id, auth.hospitalId); return successResponse(null, "Bed deleted"); }
    await deleteWard(id, auth.hospitalId);
    return successResponse(null, "Ward deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
