import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createWard = async (data: Prisma.WardUncheckedCreateInput) => {
  return prisma.ward.create({ data, include: { _count: { select: { beds: true } } } });
};

export const findAllWards = async (hospitalId: string) => {
  return prisma.ward.findMany({
    where: { hospitalId },
    include: { _count: { select: { beds: true } }, beds: { take: 50, orderBy: { bedNumber: "asc" } } },
    orderBy: { name: "asc" },
  });
};

export const findWardById = async (id: string, hospitalId: string) => {
  return prisma.ward.findFirst({ where: { id, hospitalId }, include: { beds: true } });
};

export const updateWard = async (id: string, hospitalId: string, data: Prisma.WardUpdateInput) => {
  return prisma.ward.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteWard = async (id: string, hospitalId: string) => {
  return prisma.ward.deleteMany({ where: { id, hospitalId } });
};

// Beds
export const createBed = async (data: Prisma.BedUncheckedCreateInput) => {
  return prisma.bed.create({ data, include: { ward: { select: { name: true } } } });
};

export const findAllBeds = async (hospitalId: string, wardId?: string) => {
  return prisma.bed.findMany({
    where: { hospitalId, ...(wardId ? { wardId } : {}) },
    include: { ward: { select: { name: true, type: true } } },
    orderBy: { bedNumber: "asc" },
  });
};

export const updateBed = async (id: string, hospitalId: string, data: Prisma.BedUpdateInput) => {
  return prisma.bed.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteBed = async (id: string, hospitalId: string) => {
  return prisma.bed.deleteMany({ where: { id, hospitalId } });
};
