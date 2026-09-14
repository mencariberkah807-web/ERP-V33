import { workOrderRepository } from "../../repositories/workOrders/workOrderRepository.js";

export async function completeProduction({ woNumber, idempotencyKey } = {}) {
  if (!woNumber) throw new Error("Work Order wajib diisi.");
  return workOrderRepository.complete(woNumber, idempotencyKey);
}
