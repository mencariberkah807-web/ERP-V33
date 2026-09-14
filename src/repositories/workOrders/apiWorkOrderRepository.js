import { apiRequest } from "../../infrastructure/api/apiClient.js";

function unwrap(response) {
  return response?.data ?? response;
}

function normalizeStatus(status) {
  return String(status || "").toUpperCase().replaceAll("_", " ");
}

function normalizeWorkOrder(workOrder) {
  const data = workOrder || {};
  const status = normalizeStatus(data.status);
  return {
    ...data,
    id: data.workOrderId ?? data.id,
    woNumber: data.workOrderNumber ?? data.woNumber,
    soNumber: data.soNumber,
    soItemId: data.soItemId != null ? String(data.soItemId) : data.soItemId,
    productId: data.productId,
    quantity: Number(data.quantity ?? 0),
    unitPrice: Number(data.unitPrice ?? 0),
    status,
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    process: data.process || {
      laserCutting: "PENDING",
      uvPrinting: "PENDING",
      assembly: "PENDING",
      laserMarking: "PENDING",
      finishing: "PENDING",
    },
  };
}

function idempotencyKey(prefix) {
  return `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
}

export const apiWorkOrderRepository = Object.freeze({
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.soNumber) query.set("soNumber", params.soNumber);
    if (params.status) query.set("status", params.status);
    if (params.active != null) query.set("active", String(params.active));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const payload = await apiRequest(`/api/v1/work-orders${suffix}`);
    const data = unwrap(payload);
    return Array.isArray(data) ? data.map(normalizeWorkOrder) : [];
  },

  async getByNumber(woNumber) {
    const payload = await apiRequest(`/api/v1/work-orders/${encodeURIComponent(woNumber)}`);
    return normalizeWorkOrder(unwrap(payload));
  },

  async createForSalesOrder(soNumber, soItemId, key = idempotencyKey("wo-create")) {
    const payload = await apiRequest(`/api/v1/work-orders/sales-orders/${encodeURIComponent(soNumber)}`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ soItemId: String(soItemId) }),
    });
    return normalizeWorkOrder(unwrap(payload));
  },

  async start(woNumber, key = idempotencyKey("wo-start")) {
    const payload = await apiRequest(`/api/v1/work-orders/${encodeURIComponent(woNumber)}/start`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    return normalizeWorkOrder(unwrap(payload));
  },

  async complete(woNumber, key = idempotencyKey("wo-complete")) {
    const payload = await apiRequest(`/api/v1/work-orders/${encodeURIComponent(woNumber)}/complete`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    return normalizeWorkOrder(unwrap(payload));
  },

  async cancel(woNumber, key = idempotencyKey("wo-cancel")) {
    const payload = await apiRequest(`/api/v1/work-orders/${encodeURIComponent(woNumber)}/cancel`, {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    return normalizeWorkOrder(unwrap(payload));
  },
});
