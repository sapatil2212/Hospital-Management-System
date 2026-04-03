import {
  createDepartment as createDepartmentRepo,
  findAllDepartments,
  findAllDepartmentsSimple,
  findDepartmentById,
  updateDepartment as updateDepartmentRepo,
  deleteDepartment as deleteDepartmentRepo,
  checkDuplicateCode,
  checkDepartmentDependencies,
  toggleDepartmentStatus,
  createManyDepartments,
  countDepartments,
  DepartmentQueryOptions,
} from "../repositories/department.repo";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  generateCodeFromName,
  DEFAULT_DEPARTMENTS,
} from "../validations/department.validation";

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT SERVICE - Business logic layer
// ─────────────────────────────────────────────────────────────────────────────

export class DepartmentServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "DepartmentServiceError";
  }
}

/**
 * Create a new department
 */
export const createDepartment = async (
  hospitalId: string,
  input: CreateDepartmentInput
) => {
  // Auto-generate code from name if not provided
  let code = input.code;
  if (!code && input.name) {
    code = generateCodeFromName(input.name);
  }

  // Check for duplicate code
  const isDuplicate = await checkDuplicateCode(hospitalId, code);
  if (isDuplicate) {
    throw new DepartmentServiceError(
      `Department with code "${code}" already exists`,
      "DUPLICATE_CODE",
      409
    );
  }

  // Create the department
  return createDepartmentRepo({
    hospitalId,
    name: input.name,
    code: code.toUpperCase(),
    description: input.description || null,
    type: input.type || "OPD",
    consultationFee: input.consultationFee || null,
    allowAppointments: input.allowAppointments ?? true,
    isIPD: input.isIPD ?? false,
    hodDoctorId: input.hodDoctorId || null,
    hodUserId: (input as any).hodUserId || null,
    customTypeName: (input as any).customTypeName || null,
    location: input.location || null,
    billingCode: input.billingCode || null,
    isActive: input.isActive ?? true,
  });
};

/**
 * Get departments with pagination and filters
 */
export const getDepartments = async (options: DepartmentQueryOptions) => {
  return findAllDepartments(options);
};

/**
 * Get all departments for dropdowns (simple list)
 */
export const getDepartmentsForDropdown = async (
  hospitalId: string,
  activeOnly = true
) => {
  return findAllDepartmentsSimple(hospitalId, activeOnly);
};

/**
 * Get a single department by ID
 */
export const getDepartmentById = async (id: string, hospitalId: string) => {
  const department = await findDepartmentById(id, hospitalId);
  if (!department) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }
  return department;
};

/**
 * Update a department
 */
export const updateDepartment = async (
  id: string,
  hospitalId: string,
  input: UpdateDepartmentInput
) => {
  // Check if department exists
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  // If code is being updated, check for duplicates
  if (input.code && input.code.toUpperCase() !== existing.code) {
    const isDuplicate = await checkDuplicateCode(
      hospitalId,
      input.code,
      id
    );
    if (isDuplicate) {
      throw new DepartmentServiceError(
        `Department with code "${input.code}" already exists`,
        "DUPLICATE_CODE",
        409
      );
    }
  }

  // Build update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code.toUpperCase();
  if (input.description !== undefined) updateData.description = input.description;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.consultationFee !== undefined) updateData.consultationFee = input.consultationFee;
  if (input.allowAppointments !== undefined) updateData.allowAppointments = input.allowAppointments;
  if (input.isIPD !== undefined) updateData.isIPD = input.isIPD;
  if (input.hodDoctorId !== undefined) updateData.hodDoctorId = input.hodDoctorId;
  if ((input as any).hodUserId !== undefined) updateData.hodUserId = (input as any).hodUserId;
  if ((input as any).customTypeName !== undefined) updateData.customTypeName = (input as any).customTypeName;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.billingCode !== undefined) updateData.billingCode = input.billingCode;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return updateDepartmentRepo(id, hospitalId, updateData);
};

/**
 * Toggle department active status
 */
export const toggleStatus = async (
  id: string,
  hospitalId: string,
  isActive: boolean
) => {
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  await toggleDepartmentStatus(id, hospitalId, isActive);
  return { id, isActive };
};

/**
 * Delete a department
 * @param force - If true, delete department only (unlink related items)
 * @param cascade - If true, delete department AND all related items
 */
export const deleteDepartment = async (
  id: string,
  hospitalId: string,
  force = false,
  cascade = false
) => {
  // Check if department exists
  const existing = await findDepartmentById(id, hospitalId);
  if (!existing) {
    throw new DepartmentServiceError(
      "Department not found",
      "NOT_FOUND",
      404
    );
  }

  // Check dependencies
  if (!force && !cascade) {
    const dependencies = await checkDepartmentDependencies(id, hospitalId);
    if (dependencies) {
      const { hasDoctor, hasStaff, hasSubDepartments, hasPricing, counts } = dependencies;
      if (hasDoctor || hasStaff || hasSubDepartments || hasPricing) {
        throw new DepartmentServiceError(
          `Cannot delete department: It has ${counts.doctors} doctors, ${counts.staff} staff, ${counts.subDepartments} sub-departments, and ${counts.pricing} pricing rules assigned. Remove these first or use force delete.`,
          "HAS_DEPENDENCIES",
          400
        );
      }
    }
  }

  await deleteDepartmentRepo(id, hospitalId, cascade);
  return { id, deleted: true, cascade };
};

/**
 * Seed default departments for a new hospital
 */
export const seedDefaultDepartments = async (
  hospitalId: string,
  overwrite = false
) => {
  // Check if hospital already has departments
  const existingCount = await countDepartments(hospitalId);
  if (existingCount > 0 && !overwrite) {
    return {
      seeded: false,
      message: "Hospital already has departments. Use overwrite=true to add defaults anyway.",
      existingCount,
    };
  }

  // Create default departments
  const result = await createManyDepartments(hospitalId, DEFAULT_DEPARTMENTS);

  return {
    seeded: true,
    count: result.count,
    departments: DEFAULT_DEPARTMENTS.map((d) => d.name),
  };
};

/**
 * Generate a unique department code
 */
export const generateUniqueCode = async (
  hospitalId: string,
  name: string
): Promise<string> => {
  let baseCode = generateCodeFromName(name);
  let code = baseCode;
  let counter = 1;

  // Keep checking until we find a unique code
  while (await checkDuplicateCode(hospitalId, code)) {
    code = `${baseCode.slice(0, 8)}${counter}`;
    counter++;
    if (counter > 99) {
      throw new DepartmentServiceError(
        "Unable to generate unique code. Please provide a custom code.",
        "CODE_GENERATION_FAILED",
        400
      );
    }
  }

  return code;
};

/**
 * Get department statistics
 */
export const getDepartmentStats = async (hospitalId: string) => {
  const [total, active, inactive] = await Promise.all([
    countDepartments(hospitalId),
    countDepartments(hospitalId, true),
    countDepartments(hospitalId, false),
  ]);

  return {
    total,
    active,
    inactive,
    activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
  };
};
