import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";

const px = prisma as any;

/**
 * GET /api/pharmacy/inventory
 * List inventory items — SUB_DEPT_HEAD, HOSPITAL_ADMIN
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "200");

    const where: any = { hospitalId: auth.hospitalId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const items = await px.inventoryItem.findMany({
      where,
      select: {
        id: true, name: true, genericName: true, category: true,
        unit: true, purchasePrice: true, mrp: true, sellingPrice: true,
        minStock: true, isActive: true,
        batches: { select: { remainingQty: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    const result = items.map((i: any) => ({
      ...i,
      totalStock: i.batches.reduce((s: number, b: any) => s + b.remainingQty, 0),
    }));

    return successResponse(result, "Items fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch items", 500);
  }
}

/**
 * POST /api/pharmacy/inventory
 * Create a new inventory item — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      name, category, unit, purchasePrice, mrp, sellingPrice, gst, minStock, openingStock,
      genericName, brandName, subCategory, description, hsnCode, barcode, supplierName,
      isActive,
    } = body;

    if (!name || !category) return errorResponse("name and category are required", 400);

    const item = await px.inventoryItem.create({
      data: {
        hospitalId: auth.hospitalId,
        name,
        category: category || "Medicine",
        unit: unit || "pcs",
        purchasePrice: purchasePrice || 0,
        mrp: mrp || purchasePrice || 0,
        sellingPrice: sellingPrice || purchasePrice || 0,
        gst: gst || 0,
        minStock: minStock ?? 5,
        isActive: isActive !== undefined ? isActive : true,
        genericName: genericName || null,
        brandName: brandName || null,
        subCategory: subCategory || null,
        description: description || null,
        hsnCode: hsnCode || null,
        barcode: barcode || null,
        supplierName: supplierName || null,
      },
    });

    // Create opening stock batch if provided
    if (openingStock && openingStock > 0) {
      const batch = await px.stockBatch.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: item.id,
          batchNumber: "OPENING",
          quantity: openingStock,
          remainingQty: openingStock,
          purchasePrice: purchasePrice || 0,
          sellingPrice: sellingPrice || purchasePrice || 0,
        },
      });
      await px.stockMovement.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: item.id,
          batchId: batch.id,
          type: "IN",
          quantity: openingStock,
          source: "OpeningStock",
          notes: `Opening stock for ${name}`,
          performedBy: auth.user.userId,
        },
      });
    }

    return successResponse(item, "Item created", 201);
  } catch (error: any) {
    if (error.code === "P2002") return errorResponse("Item with same name & category already exists", 409);
    return errorResponse(error.message || "Failed to create item", 500);
  }
}
