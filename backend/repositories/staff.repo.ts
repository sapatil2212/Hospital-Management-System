import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createStaff = async (data: Prisma.StaffUncheckedCreateInput) => {
  return prisma.staff.create({ data, include: { department: { select: { name: true } } } });
};

export const findAllStaff = async (hospitalId: string, search?: string) => {
  return prisma.staff.findMany({
    where: {
      hospitalId,
      ...(search ? { name: { contains: search } } : {}),
    },
    include: { department: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
};

export const findStaffById = async (id: string, hospitalId: string) => {
  return prisma.staff.findFirst({ where: { id, hospitalId }, include: { department: true } });
};

export const updateStaff = async (id: string, hospitalId: string, data: Prisma.StaffUpdateInput) => {
  return prisma.staff.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteStaff = async (id: string, hospitalId: string) => {
  return prisma.staff.deleteMany({ where: { id, hospitalId } });
};
