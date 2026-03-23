import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { updateUser } from "../../../../../backend/repositories/user.repo";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import prisma from "../../../../../backend/config/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profilePhoto: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await authMiddleware(req);
    if (authError) return authError;

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { profilePhoto, ...userFields } = result.data;

    // Update user fields (name, email)
    const updatedUser = await updateUser(user!.userId, userFields);

    // Handle profile photo for different roles
    if (profilePhoto) {
      if (user!.role === "DOCTOR") {
        // Update Doctor's profileImage
        await prisma.doctor.updateMany({
          where: { userId: user!.userId },
          data: { profileImage: profilePhoto },
        });
      }
      // For other roles, profilePhoto is currently not supported as their models don't have this field
    }

    // Filter out password
    const { password, ...userDisplay } = updatedUser;

    return successResponse(userDisplay, "Profile updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
