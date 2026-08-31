import { createSalesOrder as buildSalesOrder } from "../../domain/sales-order/salesOrder.js";

import { salesOrderRepository } from "../../repositories/salesOrders/salesOrderRepository.js";

import { createPayment } from "../payments/createPayment.js";

function generateSONumber(existingOrders = []) {
  const lastNumber = existingOrders.reduce((max, order) => {
    const current = Number(String(order.soNumber || "").replace("SO-", ""));

    return Number.isFinite(current) ? Math.max(max, current) : max;
  }, 0);

  return `SO-${String(lastNumber + 1).padStart(5, "0")}`;
}

export function createSalesOrder(payload) {
  const existingOrders = salesOrderRepository.getAll();

  const salesOrder = buildSalesOrder(payload);

  salesOrder.soNumber = generateSONumber(existingOrders);

  salesOrderRepository.append(salesOrder);

  let paymentRecord = null;

  if (payload.payment && Number(payload.payment.amount || 0) > 0) {
    paymentRecord = createPayment({
      soNumber: salesOrder.soNumber,

      customer: salesOrder.customer,

      total: salesOrder.grandTotal || 0,

      amount: Number(payload.payment.amount || 0),

      paymentMethod: payload.payment.paymentMethod,
    });
  }

  return {
    salesOrder,

    payment: paymentRecord,
  };
}
