import { workOrderRepository } from "../../repositories/workOrders/workOrderRepository.js";

export async function createWorkOrder({ soNumber, soItemId, idempotencyKey } = {}) {
  if (!soNumber) throw new Error("Sales Order wajib diisi.");
  if (soItemId == null || soItemId === "") throw new Error("SO Item wajib diisi.");
  return workOrderRepository.createForSalesOrder(soNumber, String(soItemId), idempotencyKey);
}
