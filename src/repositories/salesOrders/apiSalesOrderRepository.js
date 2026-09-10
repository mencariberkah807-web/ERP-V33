import { apiRequest } from "../../infrastructure/api/apiClient.js";

function unwrap(response) {
  return response?.data ?? response;
}

export const apiSalesOrderRepository = {
  async getAll() {
    return unwrap(await apiRequest("/api/v1/sales-orders"));
  },

  async getById(id) {
    return unwrap(await apiRequest(`/api/v1/sales-orders/${encodeURIComponent(id)}`));
  },

  async create(salesOrder, idempotencyKey) {
    return unwrap(await apiRequest("/api/v1/sales-orders", {
      method: "POST",
      body: JSON.stringify(salesOrder),
      ...(idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}),
    }));
  },

  async update(id, salesOrder) {
    return unwrap(await apiRequest(`/api/v1/sales-orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(salesOrder),
    }));
  },
};
