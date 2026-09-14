import { salesOrderStore } from "../../state/salesOrderStore.js";
import { workOrderStore } from "../../state/workOrderStore.js";
import { apiSalesOrderRepository } from "../../repositories/salesOrders/apiSalesOrderRepository.js";
import { apiWorkOrderRepository } from "../../repositories/workOrders/apiWorkOrderRepository.js";

const ELIGIBLE_SO_STATUSES = new Set(["NEW ORDER", "READY PRODUCTION"]);

function syncSalesOrder(orderId, updater) {
  const orders = salesOrderStore.getSalesOrders();
  const existing = orders.find((order) => order.id === orderId);
  if (!existing) return null;
  const updated = updater(existing);
  salesOrderStore.replaceSalesOrders(orders.map((order) => order.id === orderId ? updated : order));
  return updated;
}

function mergeWorkOrders(records) {
  workOrderStore.replaceWorkOrders(records);
  return records;
}

async function resolveApiItems(order) {
  const apiOrder = await apiSalesOrderRepository.getById(order.soNumber);
  const apiItems = Array.isArray(apiOrder?.items) ? apiOrder.items : [];
  if (!apiItems.length) throw new Error("Sales Order belum tersedia di API.");
  return (order.items || []).map((item, index) => {
    const direct = apiItems.find((candidate) => String(candidate.soItemId) === String(item.soItemId));
    return direct || apiItems[index];
  }).filter(Boolean);
}

export async function getWorkOrders() {
  const records = await apiWorkOrderRepository.getAll({ active: true });
  return mergeWorkOrders(records);
}

export async function createWorkOrdersForSalesOrder(orderId) {
  const orders = salesOrderStore.getSalesOrders();
  const order = orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error("Sales Order tidak ditemukan.");
  if (!ELIGIBLE_SO_STATUSES.has(order.status)) throw new Error("WO hanya dapat dibuat sebelum Production dimulai.");

  const activeItems = (order.items || []).filter((item) => item.status !== "INACTIVE");
  if (!activeItems.length) throw new Error("Sales Order tidak memiliki Active SO Item.");

  const existing = await apiWorkOrderRepository.getAll({ soNumber: order.soNumber, active: true });
  const apiItems = await resolveApiItems(order);
  const created = [];

  for (let index = 0; index < activeItems.length; index += 1) {
    const item = activeItems[index];
    if (existing.some((wo) => String(wo.soItemId) === String(item.soItemId))) continue;
    const apiItem = apiItems[index];
    if (!apiItem?.soItemId) throw new Error(`SO Item ${item.soItemId} belum memiliki ID API.`);
    created.push(await apiWorkOrderRepository.createForSalesOrder(order.soNumber, apiItem.soItemId));
  }

  if (!created.length) throw new Error("Active SO Item sudah memiliki Active WO.");
  const refreshed = await apiWorkOrderRepository.getAll({ soNumber: order.soNumber, active: true });
  mergeWorkOrders(refreshed);
  syncSalesOrder(orderId, (current) => ({ ...current, status: "READY PRODUCTION", updatedAt: new Date().toISOString() }));
  return created;
}

export async function startWorkOrder(woId) {
  const records = workOrderStore.getWorkOrders();
  const existing = records.find((wo) => String(wo.id) === String(woId));
  if (!existing) throw new Error("Work Order tidak ditemukan.");
  if (existing.status !== "READY") throw new Error(`Transisi WO ${existing.status} → IN PRODUCTION tidak diizinkan.`);
  const updated = await apiWorkOrderRepository.start(existing.woNumber);
  const next = records.map((wo) => String(wo.id) === String(woId) ? updated : wo);
  mergeWorkOrders(next);
  const orders = salesOrderStore.getSalesOrders();
  const so = orders.find((order) => order.soNumber === existing.soNumber);
  if (so) syncSalesOrder(so.id, (current) => ({ ...current, status: "IN PRODUCTION", updatedAt: new Date().toISOString() }));
  return updated;
}

export async function completeWorkOrder(woId) {
  const records = workOrderStore.getWorkOrders();
  const existing = records.find((wo) => String(wo.id) === String(woId));
  if (!existing) throw new Error("Work Order tidak ditemukan.");
  if (existing.status !== "IN PRODUCTION") throw new Error(`Transisi WO ${existing.status} → COMPLETED PRODUCTION tidak diizinkan.`);
  const updated = await apiWorkOrderRepository.complete(existing.woNumber);
  const refreshed = await apiWorkOrderRepository.getAll({ soNumber: existing.soNumber, active: true });
  mergeWorkOrders(refreshed);
  if (updated.status === "COMPLETED PRODUCTION" && refreshed.length && refreshed.every((wo) => wo.status === "COMPLETED PRODUCTION")) {
    const orders = salesOrderStore.getSalesOrders();
    const so = orders.find((order) => order.soNumber === existing.soNumber);
    if (so) syncSalesOrder(so.id, (current) => ({ ...current, status: "PACKING", updatedAt: new Date().toISOString() }));
  }
  return updated;
}

export async function cancelWorkOrder(woId) {
  const records = workOrderStore.getWorkOrders();
  const existing = records.find((wo) => String(wo.id) === String(woId));
  if (!existing) throw new Error("Work Order tidak ditemukan.");
  const updated = await apiWorkOrderRepository.cancel(existing.woNumber);
  mergeWorkOrders(records.map((wo) => String(wo.id) === String(woId) ? updated : wo));
  return updated;
}
