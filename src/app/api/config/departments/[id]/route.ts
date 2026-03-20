import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../../backend/utils/response";
import {
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  toggleStatus,
  DepartmentServiceError,
} from "../../../../../../backend/services/department.service";
import { updateDepartmentSchema, toggleStatusSchema } from "../../../../../../backend/validations/department.validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/config/departments/[id]
 * Fetch a single department by ID with full relations
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const department = await getDepartmentById(id, auth.hospitalId);
    return successResponse(department, "Department fetched");
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * PUT /api/config/departments/[id]
 * Update a department by ID
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = updateDepartmentSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Update department
    const department = await updateDepartment(id, auth.hospitalId, result.data);
    return successResponse(department, "Department updated");
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    if (e.code === "P2002") {
      return errorResponse("Department with this code already exists", 409);
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * PATCH /api/config/departments/[id]
 * Toggle department status (isActive)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = toggleStatusSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Validation failed", 400, result.error.issues);
    }

    // Toggle status
    const updated = await toggleStatus(id, auth.hospitalId, result.data.isActive);
    return successResponse(updated, `Department ${result.data.isActive ? "activated" : "deactivated"}`);
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}

/**
 * DELETE /api/config/departments/[id]
 * Delete a department by ID
 * Query params: ?force=true to force delete with dependencies
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const result = await deleteDepartment(id, auth.hospitalId, force);
    return successResponse(result, "Department deleted");
  } catch (e: any) {
    if (e instanceof DepartmentServiceError) {
      return errorResponse(e.message, e.status, { code: e.code });
    }
    return errorResponse(e.message, 500);
  }
}
