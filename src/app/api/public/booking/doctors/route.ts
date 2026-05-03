import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import prisma from "../../../../../../backend/config/db";

export const dynamic = "force-dynamic";

/* ── GET /api/public/booking/doctors?hid=HOSPITAL_ID&departmentId=DEPT_ID ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let hid = searchParams.get("hid");

  try {
    if (!hid) {
      const first = await prisma.hospital.findFirst({ select: { id: true }, orderBy: { createdAt: "desc" } });
      if (!first) return errorResponse("No hospital found", 404);
      hid = first.id;
    }

    const where: any = { hospitalId: hid };
    const deptId = searchParams.get("departmentId");
    if (deptId) where.departmentId = deptId;

    const doctors = await prisma.doctor.findMany({
      where,
      select: {
        id: true,
        name: true,
        specialization: true,
        departmentId: true,
        consultationFee: true,
        department: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(doctors, "Doctors fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
