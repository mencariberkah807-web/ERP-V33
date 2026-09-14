import { workOrderRepository } from "../../repositories/workOrders/workOrderRepository.js";

export async function startProduction({ woNumber, idempotencyKey } = {}) {
  if (!woNumber) throw new Error("Work Order wajib diisi.");
  return workOrderRepository.start(woNumber, idempotencyKey);
}
