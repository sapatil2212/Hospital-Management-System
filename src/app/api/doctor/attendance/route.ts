import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";

// GET /api/doctor/attendance - Get attendance history
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") return errorResponse("Forbidden: Doctor access required", 403);

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    const whereClause: any = { doctorId: doctor.id };
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      whereClause.date = {
        gte: new Date(year, monthNum - 1, 1),
        lte: new Date(year, monthNum, 0),
      };
    }

    if (!(prisma as any).doctorAttendance) {
      return successResponse([], "Attendance tracking not yet available - run npx prisma generate");
    }

    const attendance = await (prisma as any).doctorAttendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: 31,
    });

    return successResponse(attendance, "Attendance history fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch attendance", 500);
  }
}

// POST /api/doctor/attendance - Mark attendance (auto-called on login)
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;

  if (user!.role !== "DOCTOR") return errorResponse("Forbidden: Doctor access required", 403);

  try {
    const prisma = (await import("../../../../../backend/config/db")).default;

    const doctor = await (prisma as any).doctor.findFirst({
      where: { userId: user!.userId },
    });
    if (!doctor) return errorResponse("Doctor profile not found", 404);

    if (!(prisma as any).doctorAttendance) {
      return successResponse({ status: "SKIPPED" }, "Attendance tracking not yet available");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const loginHour = now.getHours();
    const loginMinute = now.getMinutes();

    let status: "PRESENT" | "LATE" | "HALF_DAY" = "PRESENT";
    if (loginHour > 9 || (loginHour === 9 && loginMinute > 30)) status = "LATE";
    if (loginHour >= 12) status = "HALF_DAY";

    // Check if attendance record already exists for today
    const existingAttendance = await (prisma as any).doctorAttendance.findFirst({
      where: {
        doctorId: doctor.id,
        date: today,
      },
    });

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await (prisma as any).doctorAttendance.update({
        where: { id: existingAttendance.id },
        data: { loginTime: now, status },
      });
    } else {
      // Create new record
      try {
        attendance = await (prisma as any).doctorAttendance.create({
          data: {
            doctorId: doctor.id,
            hospitalId: doctor.hospitalId,
            date: today,
            loginTime: now,
            status,
          },
        });
      } catch (createErr: any) {
        // Handle race condition: if record was created between findFirst and create
        if (createErr?.code === "P2002") {
          const retry = await (prisma as any).doctorAttendance.findFirst({
            where: { doctorId: doctor.id, date: today },
          });
          if (retry) {
            attendance = await (prisma as any).doctorAttendance.update({
              where: { id: retry.id },
              data: { loginTime: now, status },
            });
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    return successResponse(attendance, "Attendance marked successfully");
  } catch (e: any) {
    console.error("Attendance marking error:", e);
    return errorResponse(e.message || "Failed to mark attendance", 500);
  }
}
