import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

// GET /api/subdept/records — list procedure records for this sub-dept
export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;
    const hospitalId = (profile as any).hospitalId;

    const url = new URL(req.url);
    const page   = Math.max(1, parseInt(url.searchParams.get("page")  || "1"));
    const limit  = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
    const search = url.searchParams.get("search") || "";
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo   = url.searchParams.get("dateTo");

    const where: any = { subDepartmentId: subDeptId, hospitalId };
    if (search) {
      where.patient = {
        OR: [
          { name: { contains: search } },
          { patientId: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }
    if (dateFrom || dateTo) {
      where.performedAt = {};
      if (dateFrom) where.performedAt.gte = new Date(dateFrom);
      if (dateTo)   where.performedAt.lte = new Date(dateTo + "T23:59:59");
    }

    const [records, total] = await Promise.all([
      (prisma as any).procedureRecord.findMany({
        where,
        include: {
          patient:   { select: { id: true, name: true, patientId: true, phone: true, gender: true } },
          procedure: { select: { id: true, name: true, type: true, fee: true } },
          appointment: {
            select: { id: true, timeSlot: true, doctor: { select: { name: true, specialization: true } } },
          },
        },
        orderBy: { performedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).procedureRecord.count({ where }),
    ]);

    // Revenue stats
    const stats = await (prisma as any).procedureRecord.aggregate({
      where: { subDepartmentId: subDeptId, hospitalId },
      _sum: { amount: true },
      _count: { id: true },
    });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayStats = await (prisma as any).procedureRecord.aggregate({
      where: { subDepartmentId: subDeptId, hospitalId, performedAt: { gte: todayStart } },
      _sum: { amount: true },
      _count: { id: true },
    });

    return successResponse({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        totalRevenue: stats._sum.amount || 0,
        totalRecords: stats._count.id || 0,
        todayRevenue: todayStats._sum.amount || 0,
        todayRecords: todayStats._count.id || 0,
      },
    }, "Records fetched");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}

// POST /api/subdept/records — record a procedure performed on a patient
export async function POST(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId  = (profile as any).id;
    const hospitalId = (profile as any).hospitalId;
    const hodName    = (profile as any).hodName || (user as any).name || "HOD";

    const body = await req.json();
    const { patientId, procedureId, appointmentId, amount, notes, performedBy, performedAt, status } = body;

    if (!patientId || !procedureId || amount == null)
      return errorResponse("patientId, procedureId, and amount are required", 400);

    // Verify procedure belongs to this sub-dept
    const proc = await (prisma as any).procedure.findFirst({
      where: { id: procedureId, subDepartmentId: subDeptId },
    });
    if (!proc) return errorResponse("Procedure not found", 404);

    // Verify patient exists in this hospital
    const patient = await (prisma as any).patient.findFirst({
      where: { id: patientId, hospitalId },
    });
    if (!patient) return errorResponse("Patient not found", 404);

    const record = await (prisma as any).procedureRecord.create({
      data: {
        hospitalId,
        subDepartmentId: subDeptId,
        procedureId,
        patientId,
        appointmentId: appointmentId || null,
        amount: parseFloat(amount),
        notes: notes || null,
        performedBy: performedBy || hodName,
        performedAt: performedAt ? new Date(performedAt) : new Date(),
        status: status || "COMPLETED",
      },
      include: {
        patient:   { select: { id: true, name: true, patientId: true, phone: true } },
        procedure: { select: { id: true, name: true, type: true } },
      },
    });

    return successResponse(record, "Procedure record saved", 201);
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed", 500);
  }
}
