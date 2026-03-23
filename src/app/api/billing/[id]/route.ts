import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getBillById, updateBill, recordPayment, deleteBill, BillingServiceError } from "../../../../../backend/services/billing.service";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD", "RECEPTIONIST"];
export const dynamic = "force-dynamic";

// GET /api/billing/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const bill = await getBillById(params.id, auth.hospitalId);
    return successResponse(bill, "Bill fetched");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/billing/[id] — update discount/tax/notes/status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const bill = await updateBill(params.id, auth.hospitalId, body);
    return successResponse(bill, "Bill updated");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// PATCH /api/billing/[id] — record a payment
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body.amount) return errorResponse("amount is required", 400);
    const payment = await recordPayment(params.id, auth.hospitalId, body);
    return successResponse(payment, "Payment recorded");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/billing/[id] — delete a bill
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    await deleteBill(params.id, auth.hospitalId);
    return successResponse(null, "Bill deleted successfully");
  } catch (e: any) {
    if (e instanceof BillingServiceError) return errorResponse(e.message, e.status);
    return errorResponse(e.message, 500);
  }
}
