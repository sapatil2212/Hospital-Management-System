import { NextRequest } from "next/server";
import { loginUserService } from "../../../../../backend/services/auth.service";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation Failed", 400, result.error.issues);
    }

    const { token, user } = await loginUserService(result.data.email, result.data.password);

    const response = successResponse({ user }, "Login Successful");

    // Extract env variable conditionally to handle type warnings
    const secureFlag = process.env.NODE_ENV === "production";
    
    // Set HTTP-only Cookie
    response.cookies.set({
      name: "hms_session",
      value: token,
      httpOnly: true,
      secure: secureFlag,
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    return errorResponse(error.message, 401);
  }
}
