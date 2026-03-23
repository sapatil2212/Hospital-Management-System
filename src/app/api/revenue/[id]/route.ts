import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

const ALLOWED = ["HOSPITAL_ADMIN", "FINANCE_HEAD"];
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ALLOWED);
  if (auth.error) return auth.error;
  try {
    await (prisma as any).revenue.delete({ where: { id: params.id } });
    return successResponse(null, "Revenue deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
