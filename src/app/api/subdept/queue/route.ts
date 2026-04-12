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

    // Get IDs of appointments that already have a procedure record in this sub-dept
    const doneRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { not: null } },
      select: { appointmentId: true },
    });
    const doneAppointmentIds = new Set(doneRecords.map((r: any) => r.appointmentId));

    // Show appointments referred to THIS sub-department that don't yet have a procedure recorded
    const appointments = await (prisma as any).appointment.findMany({
      where: {
        hospitalId,
        subDepartmentId: subDeptId,
        status: "COMPLETED",
        ...(doneAppointmentIds.size > 0 ? { id: { notIn: Array.from(doneAppointmentIds) } } : {}),
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
      orderBy: [{ appointmentDate: "desc" }, { timeSlot: "desc" }],
      take: 200,
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
        appointmentDate: a.appointmentDate,
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

    // Count today's referrals for stats
    const todayReferrals = queue.filter((q: any) => {
      const apptDate = new Date(q.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    }).length;

    // Fetch completed appointments (ones that have a procedure record in this sub-dept)
    let completedList: any[] = [];
    if (doneAppointmentIds.size > 0) {
      const completedAppts = await (prisma as any).appointment.findMany({
        where: {
          hospitalId,
          subDepartmentId: subDeptId,
          id: { in: Array.from(doneAppointmentIds) },
        },
        include: {
          patient: { select: { id: true, name: true, patientId: true, phone: true, gender: true, dateOfBirth: true, bloodGroup: true } },
          doctor: { select: { id: true, name: true, specialization: true, department: { select: { name: true } } } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });

      // Also fetch the procedure records for these appointments to show what was done
      const procRecords = await (prisma as any).procedureRecord.findMany({
        where: { hospitalId, subDepartmentId: subDeptId, appointmentId: { in: Array.from(doneAppointmentIds) } },
        include: { procedure: { select: { name: true, type: true } } },
        orderBy: { performedAt: "desc" },
      });
      const recordsByAppt: Record<string, any[]> = {};
      for (const r of procRecords) {
        if (!recordsByAppt[r.appointmentId]) recordsByAppt[r.appointmentId] = [];
        recordsByAppt[r.appointmentId].push(r);
      }

      completedList = completedAppts.map((a: any) => {
        const age = a.patient?.dateOfBirth
          ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          : null;
        const records = recordsByAppt[a.id] || [];
        return {
          id: a.id,
          appointmentDate: a.appointmentDate,
          tokenNumber: a.tokenNumber,
          timeSlot: a.timeSlot,
          type: a.type,
          consultationFee: a.consultationFee,
          subDeptNote: a.subDeptNote,
          patient: { id: a.patient?.id, name: a.patient?.name || "Unknown", patientId: a.patient?.patientId, phone: a.patient?.phone, gender: a.patient?.gender, age },
          doctor: { name: a.doctor?.name || "Unknown", specialization: a.doctor?.specialization, department: a.doctor?.department?.name },
          procedureRecords: records.map((r: any) => ({
            id: r.id, procedureName: r.procedure?.name, procedureType: r.procedure?.type,
            amount: r.amount, status: r.status, performedBy: r.performedBy,
            performedAt: r.performedAt, notes: r.notes,
          })),
        };
      });
    }

    // Also fetch historical referrals (last 30 days) for context
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
        completedList,
        date: today.toISOString(),
        subDeptName: (profile as any).name,
        subDeptId,
        flow: (profile as any).flow,
        total: queue.length,
        todayReferrals,
        completedCount: completedList.length,
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
