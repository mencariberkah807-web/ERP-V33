import { paymentRepository } from "../repositories/payments/paymentRepository.js";

export const paymentStore = {
  getPayments() {
    return paymentRepository.getAll();
  },

  getPaymentsBySO(soNumber) {
    return paymentRepository
      .getAll()
      .filter((payment) => payment.soNumber === soNumber);
  },

  addPayment(payment) {
    return paymentRepository.append(payment);
  },

  replacePayments(payments) {
    return paymentRepository.replaceAll(payments);
  },

  clearPayments() {
    paymentRepository.clear();
  },
};
