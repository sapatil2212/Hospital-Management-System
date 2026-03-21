import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") {
    return errorResponse("Forbidden: Doctor access required", 403);
  }

  try {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: user!.userId },
      include: {
        department: { select: { id: true, name: true, code: true } },
        hospital: { select: { id: true, name: true } },
        availability: { where: { isActive: true }, orderBy: { day: "asc" } },
        _count: { select: { availability: true, leaves: true } },
      },
    });

    if (!doctor) return errorResponse("Doctor profile not found", 404);

    return successResponse(doctor, "Doctor profile fetched successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch profile", 500);
  }
}
