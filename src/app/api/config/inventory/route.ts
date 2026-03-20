import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { createInventoryItem, findAllInventory, updateInventoryItem, deleteInventoryItem } from "../../../../../backend/repositories/inventory.repo";
import { z } from "zod";

const inventorySchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  description: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  pricePerUnit: z.number().min(0).optional(),
  supplier: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const data = await findAllInventory(auth.hospitalId, searchParams.get("category") || undefined, searchParams.get("search") || undefined);
    return successResponse(data, "Inventory fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = inventorySchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const data = await createInventoryItem({ hospitalId: auth.hospitalId, ...result.data });
    return successResponse(data, "Inventory item created", 201);
  } catch (e: any) {
    if (e.code === "P2002") return errorResponse("Item with same name & category already exists", 409);
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
    await updateInventoryItem(id, auth.hospitalId, updateData);
    return successResponse(null, "Inventory item updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("ID is required", 400);
    await deleteInventoryItem(id, auth.hospitalId);
    return successResponse(null, "Inventory item deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
