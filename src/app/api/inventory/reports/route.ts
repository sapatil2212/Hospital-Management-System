import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import * as service from "../../../../../backend/services/central-inventory.service";

export async function GET(req: NextRequest) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const data = await service.getInventoryReport(auth.hospitalId);
    return successResponse(data, "Report generated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
