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

    const where: any = {
      hospitalId,
      appointmentDate: { gte: today, lt: tomorrow },
    };

    // Filter by parent department if sub-dept has one
    if (departmentId) where.departmentId = departmentId;

    const appointments = await prisma.appointment.findMany({
      where,
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
      take: 50,
    });

    // Attach sub-dept procedure suggestions from sub-dept's procedure list
    const procedures = (profile as any).procedures || [];

    const queue = appointments.map((a: any) => {
      const age = a.patient?.dateOfBirth
        ? Math.floor((Date.now() - new Date(a.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      // Match any procedure keywords in the doctor's notes
      const matchedProcs = procedures.filter((p: any) =>
        a.notes && a.notes.toLowerCase().includes(p.name.toLowerCase().split(" ")[0].toLowerCase())
      );

      return {
        id: a.id,
        tokenNumber: a.tokenNumber,
        timeSlot: a.timeSlot,
        type: a.type,
        status: a.status,
        consultationFee: a.consultationFee,
        doctorNotes: a.notes,
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
        suggestedProcedures: matchedProcs.slice(0, 3),
      };
    });

    return successResponse(
      {
        queue,
        date: today.toISOString(),
        subDeptName: (profile as any).name,
        flow: (profile as any).flow,
        total: queue.length,
        waiting: queue.filter((q: any) => q.status === "SCHEDULED" || q.status === "CONFIRMED").length,
        inProgress: queue.filter((q: any) => q.status === "IN_PROGRESS" || (q.status as string) === "IN_PROGRESS").length,
        completed: queue.filter((q: any) => q.status === "COMPLETED").length,
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

    const appt = await prisma.appointment.findFirst({ where: { id: appointmentId, hospitalId } });
    if (!appt) return errorResponse("Appointment not found", 404);

    const updated = await prisma.appointment.update({
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
