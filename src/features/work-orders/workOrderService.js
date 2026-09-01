import { salesOrderStore } from "../../state/salesOrderStore.js";
import { workOrderStore } from "../../state/workOrderStore.js";

const ELIGIBLE_SO_STATUSES = new Set(["NEW ORDER", "READY PRODUCTION"]);

function nextNumber(records) {
  const numbers = records
    .map((record) => String(record?.woNumber ?? "").match(/^WO-(\d+)$/))
    .map((match) => (match ? Number(match[1]) : 0))
    .filter(Boolean);
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `WO-${String(next).padStart(5, "0")}`;
}

function syncSalesOrder(orderId, updater) {
  const orders = salesOrderStore.getSalesOrders();
  const existing = orders.find((order) => order.id === orderId);
  if (!existing) throw new Error("Sales Order tidak ditemukan.");
  const updated = updater(existing);
  salesOrderStore.replaceSalesOrders(orders.map((order) => order.id === orderId ? updated : order));
  return updated;
}

export function getWorkOrders() {
  return workOrderStore.getWorkOrders();
}

export function createWorkOrdersForSalesOrder(orderId) {
  const orders = salesOrderStore.getSalesOrders();
  const order = orders.find((entry) => entry.id === orderId);
  if (!order) throw new Error("Sales Order tidak ditemukan.");
  if (!ELIGIBLE_SO_STATUSES.has(order.status)) throw new Error("WO hanya dapat dibuat sebelum Production dimulai.");

  const activeItems = (order.items || []).filter((item) => item.status !== "INACTIVE");
  if (!activeItems.length) throw new Error("Sales Order tidak memiliki Active SO Item.");

  const existing = workOrderStore.getWorkOrders();
  const activeExisting = existing.filter((wo) => wo.soNumber === order.soNumber && wo.status !== "INACTIVE");
  const created = [];

  for (const item of activeItems) {
    if (activeExisting.some((wo) => wo.soItemId === item.soItemId)) continue;
    const now = new Date().toISOString();
    const wo = {
      id: crypto.randomUUID?.() ?? `wo-${Date.now()}-${item.soItemId}`,
      woNumber: nextNumber([...existing, ...created]),
      soNumber: order.soNumber,
      soItemId: item.soItemId,
      customer: order.customer,
      marketplace: order.marketplace,
      orderDate: order.orderDate,
      deadline: order.deadline,
      priority: order.priority,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      artwork: item.artwork,
      specification: item.specification ?? "",
      productionNotes: item.productionNotes ?? "",
      customRequest: Boolean(item.customRequest),
      process: {
        laserCutting: "PENDING",
        uvPrinting: "PENDING",
        assembly: "PENDING",
        laserMarking: "PENDING",
        finishing: "PENDING",
      },
      status: "READY",
      timeline: [{ status: "READY", at: now, actor: "system" }],
      createdAt: now,
      updatedAt: now,
    };
    created.push(wo);
  }

  if (!created.length) throw new Error("Active SO Item sudah memiliki Active WO.");
  workOrderStore.replaceWorkOrders([...existing, ...created]);
  syncSalesOrder(orderId, (current) => ({ ...current, status: "READY PRODUCTION", updatedAt: new Date().toISOString() }));
  return created;
}

function transition(woId, nextStatus) {
  const records = workOrderStore.getWorkOrders();
  const existing = records.find((wo) => wo.id === woId);
  if (!existing) throw new Error("Work Order tidak ditemukan.");
  if (existing.status === "INACTIVE") throw new Error("Work Order INACTIVE tidak dapat diproses.");
  const allowed = { READY: ["IN PRODUCTION"], "IN PRODUCTION": ["COMPLETED PRODUCTION"], "COMPLETED PRODUCTION": [] };
  if (!allowed[existing.status]?.includes(nextStatus)) throw new Error(`Transisi WO ${existing.status} → ${nextStatus} tidak diizinkan.`);

  const now = new Date().toISOString();
  const updated = { ...existing, status: nextStatus, timeline: [...(existing.timeline || []), { status: nextStatus, at: now, actor: "production" }], updatedAt: now };
  workOrderStore.replaceWorkOrders(records.map((wo) => wo.id === woId ? updated : wo));

  const allForSO = workOrderStore.getWorkOrders().filter((wo) => wo.soNumber === existing.soNumber && wo.status !== "INACTIVE");
  const soOrders = salesOrderStore.getSalesOrders();
  const so = soOrders.find((order) => order.soNumber === existing.soNumber);
  if (nextStatus === "IN PRODUCTION") {
    if (so) syncSalesOrder(so.id, (current) => ({ ...current, status: "IN PRODUCTION", updatedAt: now }));
  }
  if (nextStatus === "COMPLETED PRODUCTION" && allForSO.length && allForSO.every((wo) => wo.status === "COMPLETED PRODUCTION")) {
    if (so) syncSalesOrder(so.id, (current) => ({ ...current, status: "PACKING", updatedAt: now }));
  }
  return updated;
}

export function startWorkOrder(woId) {
  return transition(woId, "IN PRODUCTION");
}

export function completeWorkOrder(woId) {
  return transition(woId, "COMPLETED PRODUCTION");
}

export function cancelWorkOrder(woId) {
  const records = workOrderStore.getWorkOrders();
  const existing = records.find((wo) => wo.id === woId);
  if (!existing) throw new Error("Work Order tidak ditemukan.");
  const now = new Date().toISOString();
  const updated = { ...existing, status: "INACTIVE", timeline: [...(existing.timeline || []), { status: "INACTIVE", at: now, actor: "admin" }], updatedAt: now };
  workOrderStore.replaceWorkOrders(records.map((wo) => wo.id === woId ? updated : wo));
  return updated;
}
