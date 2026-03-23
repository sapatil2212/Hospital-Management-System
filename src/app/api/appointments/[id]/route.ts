import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import {
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  AppointmentServiceError,
} from "../../../../../backend/services/appointment.service";
import { updateAppointmentSchema } from "../../../../../backend/validations/appointment.validation";

const ALLOWED_ROLES = ["HOSPITAL_ADMIN", "RECEPTIONIST", "STAFF", "DOCTOR", "SUB_DEPT_HEAD"];

export const dynamic = "force-dynamic";

// GET /api/appointments/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const appt = await getAppointmentById(params.id, auth.hospitalId);
    return successResponse(appt, "Appointment fetched");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/appointments/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const result = updateAppointmentSchema.safeParse(body);
    if (!result.success) return errorResponse("Validation failed", 400, result.error.issues);

    const appt = await updateAppointment(params.id, auth.hospitalId, result.data);
    return successResponse(appt, "Appointment updated");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status, { code: e.code });
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/appointments/[id]  (cancel)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED_ROLES);
  if (auth.error) return auth.error;
  try {
    const appt = await cancelAppointment(params.id, auth.hospitalId);
    return successResponse(appt, "Appointment cancelled");
  } catch (e: any) {
    if (e instanceof AppointmentServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
