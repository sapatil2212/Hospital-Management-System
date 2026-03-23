import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  try {
    if (user?.role !== "DOCTOR") {
      return errorResponse("Unauthorized: Only doctors can access this endpoint", 403);
    }

    const doctor = await prisma.doctor.findFirst({
      where: { userId: user.userId },
      include: {
        department: {
          select: { id: true, name: true },
        },
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!doctor) {
      return errorResponse("Doctor profile not found", 404);
    }

    return successResponse({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email || doctor.user?.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      profileImage: doctor.profileImage,
      department: doctor.department,
      user: doctor.user,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch doctor profile", 500);
  }
}
