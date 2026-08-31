import { paymentStore } from "../../state/paymentStore.js";

import { getNextPaymentNumber } from "../../domain/payments/paymentEngine.js";

export function createPayment({
  soNumber,
  customer,
  total,
  amount,
  paymentMethod,
  referenceNumber = "",
  notes = "",
}) {
  const existingPayments = paymentStore.getPayments();

  const payment = {
    paymentNumber: getNextPaymentNumber(existingPayments),

    paymentDate: new Date().toISOString().split("T")[0],

    soNumber,

    customer,

    total: Number(total || 0),

    amount: Number(amount || 0),

    paymentMethod,

    referenceNumber,

    notes,

    active: "Active",
  };

  return paymentStore.addPayment(payment);
}
