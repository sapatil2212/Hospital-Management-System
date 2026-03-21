import prisma from "../config/db";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT REPOSITORY
// ─────────────────────────────────────────────────────────────────────────────

export interface PatientQueryOptions {
  hospitalId: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "phone" | "createdAt" | "patientId";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Generate next sequential patient ID for hospital
export const generatePatientId = async (hospitalId: string): Promise<string> => {
  // Get the count of existing patients to derive the next number
  const count = await prisma.patient.count({ where: { hospitalId } });
  const seq = count + 1;
  // Pad to 4 digits; e.g., PT-0001
  return `PT-${seq.toString().padStart(4, "0")}`;
};

// Find patient by phone (for deduplication)
export const findPatientByPhone = async (hospitalId: string, phone: string) => {
  return prisma.patient.findFirst({
    where: { hospitalId, phone },
    include: {
      _count: { select: { appointments: true, followUps: true } },
    },
  });
};

// Create a new patient
export const createPatient = async (data: Prisma.PatientUncheckedCreateInput) => {
  return prisma.patient.create({
    data,
    include: {
      _count: { select: { appointments: true, followUps: true } },
    },
  });
};

// Find all patients with pagination and filters
export const findAllPatients = async (
  options: PatientQueryOptions
): Promise<PaginatedResult<any>> => {
  const {
    hospitalId,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = {
    hospitalId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { patientId: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      include: {
        _count: { select: { appointments: true, followUps: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

// Find patient by ID with full profile
export const findPatientById = async (id: string, hospitalId: string) => {
  return prisma.patient.findFirst({
    where: { id, hospitalId },
    include: {
      appointments: {
        include: {
          doctor: { select: { id: true, name: true, specialization: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { appointmentDate: "desc" },
        take: 20,
      },
      followUps: {
        orderBy: { followUpDate: "asc" },
        take: 20,
      },
      _count: { select: { appointments: true, followUps: true } },
    },
  });
};

// Find patient by patientId string (e.g., PT-0001)
export const findPatientByPatientId = async (hospitalId: string, patientId: string) => {
  return prisma.patient.findFirst({
    where: { hospitalId, patientId },
  });
};

// Update patient
export const updatePatient = async (
  id: string,
  hospitalId: string,
  data: Prisma.PatientUpdateInput
) => {
  return prisma.patient.update({
    where: { id },
    data,
    include: {
      _count: { select: { appointments: true, followUps: true } },
    },
  });
};

// Delete patient
export const deletePatient = async (id: string, hospitalId: string) => {
  return prisma.patient.deleteMany({ where: { id, hospitalId } });
};

// Count patients
export const countPatients = async (hospitalId: string) => {
  return prisma.patient.count({ where: { hospitalId } });
};

// Search patients for quick lookup (autocomplete)
export const searchPatientsQuick = async (hospitalId: string, query: string, limit = 10) => {
  return prisma.patient.findMany({
    where: {
      hospitalId,
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
        { patientId: { contains: query } },
      ],
    },
    select: {
      id: true,
      patientId: true,
      name: true,
      phone: true,
      email: true,
      gender: true,
      dateOfBirth: true,
      bloodGroup: true,
    },
    orderBy: { name: "asc" },
    take: limit,
  });
};
