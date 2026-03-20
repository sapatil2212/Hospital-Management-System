import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createDoctor = async (data: Prisma.DoctorUncheckedCreateInput) => {
  return prisma.doctor.create({ data, include: { department: { select: { name: true } } } });
};

export const findAllDoctors = async (hospitalId: string, search?: string) => {
  return prisma.doctor.findMany({
    where: {
      hospitalId,
      ...(search ? { name: { contains: search } } : {}),
    },
    include: {
      department: { select: { name: true } },
      availability: true,
    },
    orderBy: { name: "asc" },
  });
};

// Simple doctor list for dropdowns (HOD selection, etc.)
export const findAllDoctorsSimple = async (hospitalId: string) => {
  return prisma.doctor.findMany({
    where: {
      hospitalId,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      specialization: true,
    },
    orderBy: { name: "asc" },
  });
};

export const findDoctorById = async (id: string, hospitalId: string) => {
  return prisma.doctor.findFirst({
    where: { id, hospitalId },
    include: { department: { select: { name: true } }, availability: true },
  });
};

export const updateDoctor = async (id: string, hospitalId: string, data: Prisma.DoctorUpdateInput) => {
  return prisma.doctor.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteDoctor = async (id: string, hospitalId: string) => {
  return prisma.doctor.deleteMany({ where: { id, hospitalId } });
};

// Availability
export const upsertAvailability = async (doctorId: string, day: string, startTime: string, endTime: string) => {
  return prisma.doctorAvailability.upsert({
    where: { doctorId_day: { doctorId, day: day as any } },
    update: { startTime, endTime },
    create: { doctorId, day: day as any, startTime, endTime },
  });
};

export const deleteAvailability = async (doctorId: string, day: string) => {
  return prisma.doctorAvailability.deleteMany({ where: { doctorId, day: day as any } });
};
