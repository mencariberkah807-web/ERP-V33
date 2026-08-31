import { salesOrderRepository } from "../repositories/salesOrders/salesOrderRepository.js";

export const salesOrderStore = {
  getSalesOrders() {
    return salesOrderRepository.getAll();
  },

  addSalesOrder(salesOrder) {
    return salesOrderRepository.append(salesOrder);
  },

  replaceSalesOrders(salesOrders) {
    return salesOrderRepository.replaceAll(salesOrders);
  },

  clearSalesOrders() {
    salesOrderRepository.clear();
  },
};
