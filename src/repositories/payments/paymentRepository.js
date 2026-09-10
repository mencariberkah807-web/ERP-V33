import { apiPaymentRepository } from "./apiPaymentRepository.js";

const PAYMENT_STORAGE_KEY = "artkrilik-erp-v3.payments";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readPayments() {
  if (!storageIsAvailable()) return [];

  const storedValue = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
  if (!storedValue) return [];

  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writePayments(payments) {
  if (!Array.isArray(payments)) {
    throw new TypeError("Payment repository expects an array.");
  }

  if (storageIsAvailable()) {
    window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
  }

  return payments;
}

export const paymentRepository = {
  getAll() {
    return readPayments();
  },

  getAllFromAPI(salesOrders) {
    return syncFromAPI(salesOrders);
  },

  getBySO(soNumber) {
    return readPayments().filter((payment) => payment.soNumber === soNumber);
  },

  append(payment) {
    const currentPayments = readPayments();
    return writePayments([...currentPayments, payment]).at(-1);
  },

  replaceAll(payments) {
    return writePayments(payments);
  },

  async syncFromAPI(salesOrders) {
    const orders = Array.isArray(salesOrders) ? salesOrders : [];
    const results = await Promise.all(
      orders
        .filter((order) => order?.soNumber)
        .map(async (order) => {
          try {
            return await apiPaymentRepository.getBySO(order.soNumber);
          } catch (error) {
            console.error(`Payment API sync failed for ${order.soNumber}:`, error);
            return null;
          }
        })
    );

    const apiPayments = results
      .filter(Array.isArray)
      .flat();

    if (apiPayments.length > 0) {
      const localPayments = readPayments();
      const localOnly = localPayments.filter(
        (payment) => !apiPayments.some(
          (apiPayment) =>
            String(apiPayment.paymentId || "") === String(payment.paymentId || "") &&
            apiPayment.paymentId
        )
      );
      return writePayments([...localOnly, ...apiPayments]);
    }

    return readPayments();
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(PAYMENT_STORAGE_KEY);
    }
  },

  storageKey: PAYMENT_STORAGE_KEY,
};

async function syncFromAPI(salesOrders) {
  return paymentRepository.syncFromAPI(salesOrders);
}
