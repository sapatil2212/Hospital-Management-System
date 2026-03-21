import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;
    const departmentId = (profile as any).departmentId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const subDeptId = (profile as any).id;

    // Only show appointments that the doctor has explicitly referred to THIS sub-department
    // after completing the consultation (subDepartmentId set + status COMPLETED)
    const appointments = await (prisma as any).appointment.findMany({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        status: "COMPLETED",
        appointmentDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: {
          select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true },
        },
        doctor: {
          select: { id: true, name: true, specialization: true, department: { select: { name: true } } },
        },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ tokenNumber: "asc" }, { timeSlot: "asc" }],
      take: 100,
    });

    const procedures = (profile as any).procedures || [];

    const queue = appointments.map((a: any) => {
      const age = a.patient?.dateOfBirth
        ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      const matchedProcs = procedures.filter((p: any) =>
        (a.subDeptNote && a.subDeptNote.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])) ||
        (a.notes && a.notes.toLowerCase().includes(p.name.toLowerCase().split(" ")[0]))
      );

      return {
        id: a.id,
        tokenNumber: a.tokenNumber,
        timeSlot: a.timeSlot,
        type: a.type,
        status: a.status,
        consultationFee: a.consultationFee,
        doctorNotes: a.notes,
        subDeptNote: a.subDeptNote,
        patient: {
          id: a.patient?.id,
          name: a.patient?.name || "Unknown",
          patientId: a.patient?.patientId,
          phone: a.patient?.phone,
          gender: a.patient?.gender,
          age,
          bloodGroup: a.patient?.bloodGroup,
        },
        doctor: {
          name: a.doctor?.name || "Unknown",
          specialization: a.doctor?.specialization,
          department: a.doctor?.department?.name,
        },
        department: a.department?.name,
        suggestedProcedures: matchedProcs.slice(0, 5),
      };
    });

    // Also fetch historical referrals (last 30 days, not today) for context
    const recentTotal = await (prisma as any).appointment.count({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        appointmentDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return successResponse(
      {
        queue,
        date: today.toISOString(),
        subDeptName: (profile as any).name,
        subDeptId,
        flow: (profile as any).flow,
        total: queue.length,
        waiting: queue.filter((q: any) => !q.subDeptProcessed).length,
        inProgress: 0,
        completed: queue.length,
        recentTotal,
      },
      "Queue fetched"
    );
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed to fetch queue", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const { appointmentId, status, remarks } = await req.json();
    if (!appointmentId || !status) return errorResponse("appointmentId and status required", 400);

    const profile = await getSubDeptProfile(user!.userId);
    const hospitalId = (profile as any).hospitalId;

    const appt = await (prisma as any).appointment.findFirst({ where: { id: appointmentId, hospitalId } });
    if (!appt) return errorResponse("Appointment not found", 404);

    const updated = await (prisma as any).appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        ...(remarks ? { notes: remarks } : {}),
      },
    });

    return successResponse(updated, "Status updated");
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update", 500);
  }
}
