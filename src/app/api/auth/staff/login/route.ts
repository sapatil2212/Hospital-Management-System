import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import { staffLogin, StaffServiceError } from "../../../../../../backend/services/staff.service";
import { staffLoginSchema } from "../../../../../../backend/validations/staff.validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = staffLoginSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("Validation failed", 400, validated.error.issues);
    }

    const { email, password } = validated.data;
    const result = await staffLogin(email, password);

    const response = successResponse(result, "Login successful");
    
    response.cookies.set("hms_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    if (error instanceof StaffServiceError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse(error.message || "Login failed", 500);
  }
}
