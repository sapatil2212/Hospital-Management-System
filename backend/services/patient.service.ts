import {
  createPatient as createPatientRepo,
  findAllPatients,
  findPatientById,
  findPatientByPhone,
  updatePatient as updatePatientRepo,
  deletePatient as deletePatinetRepo,
  generatePatientId,
  searchPatientsQuick,
  countPatients,
} from "../repositories/patient.repo";
import { CreatePatientInput, UpdatePatientInput } from "../validations/patient.validation";
import { sendPatientWelcome } from "../utils/mailer";
import { getSettings } from "./config.service";

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export class PatientServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "PatientServiceError";
  }
}

/**
 * Register a patient — deduplicates by phone per hospital.
 * Returns existing patient if phone already registered.
 */
export const registerPatient = async (
  hospitalId: string,
  hospitalName: string,
  input: CreatePatientInput
): Promise<{ patient: any; isNew: boolean }> => {
  // Check for existing patient by phone
  const existing = await findPatientByPhone(hospitalId, input.phone);
  if (existing) {
    return { patient: existing, isNew: false };
  }

  // Generate unique sequential patient ID
  const patientId = await generatePatientId(hospitalId);

  const patient = await createPatientRepo({
    hospitalId,
    patientId,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    gender: input.gender || null,
    dateOfBirth: input.dateOfBirth || null,
    bloodGroup: input.bloodGroup || null,
    address: input.address || null,
  });

  // Send welcome email asynchronously (fire-and-forget)
  if (input.email) {
    // Fetch hospital settings to get logo
    const settings = await getSettings(hospitalId);
    const hospitalLogo = settings?.logo || null;

    sendPatientWelcome({
      to: input.email,
      name: input.name,
      patientId: patient.patientId,
      hospitalName,
      hospitalLogo,
    }).catch(() => {
      // Email failure must not block registration
    });
  }

  return { patient, isNew: true };
};

/**
 * Get paginated list of patients.
 */
export const getPatients = async (options: Parameters<typeof findAllPatients>[0]) => {
  return findAllPatients(options);
};

/**
 * Get single patient by DB ID.
 */
export const getPatientById = async (id: string, hospitalId: string) => {
  const patient = await findPatientById(id, hospitalId);
  if (!patient) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }
  return patient;
};

/**
 * Quick search for autocomplete.
 */
export const searchPatients = async (hospitalId: string, query: string) => {
  return searchPatientsQuick(hospitalId, query);
};

/**
 * Update patient details.
 */
export const updatePatient = async (
  id: string,
  hospitalId: string,
  input: UpdatePatientInput
) => {
  const existing = await findPatientById(id, hospitalId);
  if (!existing) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.gender !== undefined) updateData.gender = input.gender;
  if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth;
  if (input.bloodGroup !== undefined) updateData.bloodGroup = input.bloodGroup;
  if (input.address !== undefined) updateData.address = input.address;

  return updatePatientRepo(id, hospitalId, updateData);
};

/**
 * Delete patient (hard delete — use with caution).
 */
export const deletePatient = async (id: string, hospitalId: string) => {
  const existing = await findPatientById(id, hospitalId);
  if (!existing) {
    throw new PatientServiceError("Patient not found", "NOT_FOUND", 404);
  }
  await deletePatinetRepo(id, hospitalId);
  return { id, deleted: true };
};

/**
 * Patient stats for dashboard.
 */
export const getPatientStats = async (hospitalId: string) => {
  const total = await countPatients(hospitalId);
  return { total };
};
