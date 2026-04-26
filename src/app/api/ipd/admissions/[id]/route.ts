import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { dischargeBed, AllocationServiceError } from "../../../../../../backend/services/allocation.service";
import { findAllocationById, updateAllocation } from "../../../../../../backend/repositories/allocation.repo";
import { z } from "zod";

const updateSchema = z.object({
  diagnosis: z.string().optional(),
  admittingDoctorName: z.string().optional(),
  expectedDischargeDate: z.string().optional(),
  attendantName: z.string().optional(),
  attendantPhone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const data = await findAllocationById(params.id, auth.hospitalId);
    if (!data) return errorResponse("Admission not found", 404);
    return successResponse(data, "Admission fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Server error", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);
    const updateData: any = { ...result.data };
    if (updateData.expectedDischargeDate) {
      updateData.expectedDischargeDate = new Date(updateData.expectedDischargeDate);
    }
    await updateAllocation(params.id, auth.hospitalId, updateData);
    const updated = await findAllocationById(params.id, auth.hospitalId);
    return successResponse(updated, "Admission updated");
  } catch (e: any) {
    return errorResponse(e.message || "Server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json().catch(() => ({}));
    const data = await dischargeBed(auth.hospitalId, params.id, body);
    return successResponse(data, "Patient discharged successfully");
  } catch (e: any) {
    if (e instanceof AllocationServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message || "Server error", 500);
  }
}
