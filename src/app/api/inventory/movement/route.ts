import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/inventory.service";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || undefined;
    const data = await service.getMovements(auth.hospitalId, itemId);
    return successResponse(data, "Movements fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
