import prisma from "../config/db";
import { Prisma } from "@prisma/client";

export const createInventoryItem = async (data: Prisma.InventoryItemUncheckedCreateInput) => {
  return prisma.inventoryItem.create({ data });
};

export const findAllInventory = async (hospitalId: string, category?: string, search?: string) => {
  return prisma.inventoryItem.findMany({
    where: {
      hospitalId,
      ...(category ? { category } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: "asc" },
  });
};

export const findLowStockItems = async (hospitalId: string) => {
  return prisma.$queryRaw`
    SELECT * FROM InventoryItem 
    WHERE hospitalId = ${hospitalId} AND stock <= minStock AND isActive = true
    ORDER BY stock ASC
  `;
};

export const updateInventoryItem = async (id: string, hospitalId: string, data: Prisma.InventoryItemUpdateInput) => {
  return prisma.inventoryItem.updateMany({ where: { id, hospitalId }, data: data as any });
};

export const deleteInventoryItem = async (id: string, hospitalId: string) => {
  return prisma.inventoryItem.deleteMany({ where: { id, hospitalId } });
};
