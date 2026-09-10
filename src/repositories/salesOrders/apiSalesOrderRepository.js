import { apiRequest } from "../../infrastructure/api/apiClient.js";

export const apiSalesOrderRepository = {
  getAll() {
    return apiRequest("/api/sales-orders");
  },

  getById(id) {
    return apiRequest(`/api/sales-orders/${encodeURIComponent(id)}`);
  },

  create(salesOrder) {
    return apiRequest("/api/sales-orders", {
      method: "POST",
      body: JSON.stringify(salesOrder),
    });
  },

  update(id, salesOrder) {
    return apiRequest(`/api/sales-orders/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(salesOrder),
    });
  },
};
