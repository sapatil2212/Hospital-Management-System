import prisma from "../config/db";

export const getSettings = async (hospitalId: string) => {
  return prisma.hospitalSettings.findUnique({ where: { hospitalId } });
};

export const upsertSettings = async (hospitalId: string, data: {
  hospitalName: string; logo?: string; address?: string; phone?: string;
  email?: string; website?: string; timezone?: string; currency?: string;
  gstNumber?: string; registrationNo?: string;
}) => {
  return prisma.hospitalSettings.upsert({
    where: { hospitalId },
    update: { ...data },
    create: { hospitalId, ...data },
  });
};

/** Calculate setup completion % for the onboarding wizard */
export const getSetupProgress = async (hospitalId: string) => {
  const [settings, deptCount, doctorCount, staffCount, wardCount, bedCount, pricingCount] =
    await Promise.all([
      prisma.hospitalSettings.findUnique({ where: { hospitalId } }),
      prisma.department.count({ where: { hospitalId } }),
      prisma.doctor.count({ where: { hospitalId } }),
      prisma.staff.count({ where: { hospitalId } }),
      prisma.ward.count({ where: { hospitalId } }),
      prisma.bed.count({ where: { hospitalId } }),
      prisma.pricing.count({ where: { hospitalId } }),
    ]);

  const steps = [
    { name: "Basic Info", done: !!settings },
    { name: "Departments", done: deptCount > 0 },
    { name: "Doctors", done: doctorCount > 0 },
    { name: "Staff", done: staffCount > 0 },
    { name: "Wards & Beds", done: wardCount > 0 && bedCount > 0 },
    { name: "Pricing", done: pricingCount > 0 },
  ];

  const completed = steps.filter(s => s.done).length;
  return {
    steps,
    completed,
    total: steps.length,
    percentage: Math.round((completed / steps.length) * 100),
    isComplete: completed === steps.length,
  };
};
