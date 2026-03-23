import * as repo from "../repositories/inventory.repo";

export class InventoryServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryServiceError";
  }
}

// --- Items ---
export const addItem = async (hospitalId: string, data: any) => {
  return repo.createInventoryItem({ ...data, hospitalId });
};

export const updateItem = async (id: string, hospitalId: string, data: any) => {
  return repo.updateInventoryItem(id, hospitalId, data);
};

export const deleteItem = async (id: string, hospitalId: string) => {
  return repo.deleteInventoryItem(id, hospitalId);
};

export const getItems = async (params: any) => {
  return repo.findAllInventoryItems(params);
};

export const getItemDetails = async (id: string, hospitalId: string) => {
  return repo.findInventoryItemById(id, hospitalId);
};

// --- Suppliers ---
export const addSupplier = async (hospitalId: string, data: any) => {
  return repo.createSupplier({ ...data, hospitalId });
};

export const updateSupplier = async (id: string, hospitalId: string, data: any) => {
  return repo.updateSupplier(id, hospitalId, data);
};

export const getSuppliers = async (hospitalId: string) => {
  return repo.findAllSuppliers(hospitalId);
};

export const getSupplierById = async (id: string, hospitalId: string) => {
  return repo.findSupplierById(id, hospitalId);
};

export const deleteSupplier = async (id: string, hospitalId: string) => {
  return repo.softDeleteSupplier(id, hospitalId);
};

// --- Purchases ---
export const createPurchaseOrder = async (hospitalId: string, data: any) => {
  const { supplierId, items, purchaseNo, notes } = data;
  
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

  const purchaseData = {
    hospitalId,
    supplierId,
    purchaseNo,
    totalAmount,
    status: "COMPLETED", // Assuming immediate completion for now
    notes
  };

  return repo.createPurchase(purchaseData, items);
};

export const getPurchases = async (hospitalId: string) => {
  return repo.findAllPurchases(hospitalId);
};

export const getPurchaseById = async (id: string, hospitalId: string) => {
  return repo.findPurchaseById(id, hospitalId);
};

export const updatePurchase = async (id: string, hospitalId: string, data: any) => {
  return repo.updatePurchase(id, hospitalId, data);
};

export const cancelPurchase = async (id: string, hospitalId: string) => {
  return repo.updatePurchase(id, hospitalId, { status: "CANCELLED" });
};

// --- Stock Movements ---
export const recordConsumption = async (hospitalId: string, data: any) => {
  const { itemId, quantity, source, referenceId, performedBy } = data;
  return repo.deductStockFIFO({
    hospitalId,
    itemId,
    quantity,
    source,
    referenceId,
    performedBy
  });
};

export const getMovements = async (hospitalId: string, itemId?: string) => {
  return repo.getStockMovements(hospitalId, itemId);
};

export const getAlerts = async (hospitalId: string) => {
  return repo.getInventoryAlerts(hospitalId);
};
