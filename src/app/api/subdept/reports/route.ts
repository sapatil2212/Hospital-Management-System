import { NextRequest } from "next/server";
import { authMiddleware } from "../../../../../backend/middlewares/auth.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { getSubDeptProfile, SubDeptServiceError } from "../../../../../backend/services/subdepartment.service";
import prisma from "../../../../../backend/config/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, error } = await authMiddleware(req);
  if (error) return error;
  if (user!.role !== "SUB_DEPT_HEAD") return errorResponse("Forbidden", 403);

  try {
    const profile = await getSubDeptProfile(user!.userId);
    const subDeptId = (profile as any).id;
    const hospitalId = (profile as any).hospitalId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // --- Aggregate stats ---
    const [allStats, todayStats, procedureCount, activeProcedureCount] = await Promise.all([
      (prisma as any).procedureRecord.aggregate({
        where: { hospitalId, subDepartmentId: subDeptId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).procedureRecord.aggregate({
        where: { hospitalId, subDepartmentId: subDeptId, performedAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      (prisma as any).procedure.count({ where: { hospitalId, subDepartmentId: subDeptId } }),
      (prisma as any).procedure.count({ where: { hospitalId, subDepartmentId: subDeptId, isActive: true } }),
    ]);

    // --- Procedures by type (pie chart) ---
    const allRecords = await (prisma as any).procedureRecord.findMany({
      where: { hospitalId, subDepartmentId: subDeptId },
      include: { procedure: { select: { name: true, type: true } } },
      orderBy: { performedAt: "desc" },
      take: 500,
    });

    const byType: Record<string, { count: number; revenue: number }> = {};
    const byProcedure: Record<string, { count: number; revenue: number; type: string }> = {};
    const byStatus: Record<string, number> = {};
    const byPerformer: Record<string, { count: number; revenue: number }> = {};
    const dailyMap: Record<string, { count: number; revenue: number }> = {};
    const monthlyMap: Record<string, { count: number; revenue: number }> = {};

    for (const r of allRecords) {
      const type = r.procedure?.type || "UNKNOWN";
      const name = r.procedure?.name || "Unknown";
      const status = r.status || "COMPLETED";
      const performer = r.performedBy || "Unknown";
      const amt = r.amount || 0;

      // By type
      if (!byType[type]) byType[type] = { count: 0, revenue: 0 };
      byType[type].count++;
      byType[type].revenue += amt;

      // By procedure name
      if (!byProcedure[name]) byProcedure[name] = { count: 0, revenue: 0, type };
      byProcedure[name].count++;
      byProcedure[name].revenue += amt;

      // By status
      byStatus[status] = (byStatus[status] || 0) + 1;

      // By performer
      if (!byPerformer[performer]) byPerformer[performer] = { count: 0, revenue: 0 };
      byPerformer[performer].count++;
      byPerformer[performer].revenue += amt;

      // Daily (last 30 days)
      const day = new Date(r.performedAt).toISOString().slice(0, 10);
      if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 };
      dailyMap[day].count++;
      dailyMap[day].revenue += amt;

      // Monthly
      const month = new Date(r.performedAt).toISOString().slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, revenue: 0 };
      monthlyMap[month].count++;
      monthlyMap[month].revenue += amt;
    }

    // Fill last 30 days for daily trend
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyTrend.push({
        date: key,
        label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        count: dailyMap[key]?.count || 0,
        revenue: dailyMap[key]?.revenue || 0,
      });
    }

    // Fill last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      monthlyTrend.push({
        month: key,
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        count: monthlyMap[key]?.count || 0,
        revenue: monthlyMap[key]?.revenue || 0,
      });
    }

    // Queue stats
    const totalReferred = await (prisma as any).appointment.count({
      where: { hospitalId, subDepartmentId: subDeptId },
    });
    const todayReferred = await (prisma as any).appointment.count({
      where: { hospitalId, subDepartmentId: subDeptId, appointmentDate: { gte: todayStart } },
    });

    // Procedure records for "recent" table (last 10)
    const recentRecords = allRecords.slice(0, 10).map((r: any) => ({
      id: r.id,
      patientName: r.patient?.name || "—",
      procedureName: r.procedure?.name || "—",
      procedureType: r.procedure?.type || "—",
      amount: r.amount,
      status: r.status,
      performedBy: r.performedBy || "—",
      performedAt: r.performedAt,
    }));

    // Top procedures by count
    const topProcedures = Object.entries(byProcedure)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performers leaderboard
    const performers = Object.entries(byPerformer)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return successResponse({
      summary: {
        totalRecords: allStats._count.id || 0,
        totalRevenue: allStats._sum.amount || 0,
        todayRecords: todayStats._count.id || 0,
        todayRevenue: todayStats._sum.amount || 0,
        totalProcedures: procedureCount,
        activeProcedures: activeProcedureCount,
        totalReferred: totalReferred,
        todayReferred: todayReferred,
        avgRevenuePerRecord: allStats._count.id ? Math.round((allStats._sum.amount || 0) / allStats._count.id) : 0,
      },
      byType: Object.entries(byType).map(([type, d]) => ({ type, ...d })),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      dailyTrend,
      monthlyTrend,
      topProcedures,
      performers,
      recentRecords,
    }, "Reports data fetched");
  } catch (err: any) {
    if (err instanceof SubDeptServiceError) return errorResponse(err.message, err.status);
    return errorResponse(err.message || "Failed to fetch reports", 500);
  }
}
