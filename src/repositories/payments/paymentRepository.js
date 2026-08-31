const PAYMENT_STORAGE_KEY = "artkrilik-erp-v3.payments";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readPayments() {
  if (!storageIsAvailable()) {
    return [];
  }

  const storedValue = window.localStorage.getItem(PAYMENT_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

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

  if (!storageIsAvailable()) {
    return payments;
  }

  window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));

  return payments;
}

export const paymentRepository = {
  getAll() {
    return readPayments();
  },

  append(payment) {
    const currentPayments = readPayments();

    const nextPayments = [...currentPayments, payment];

    writePayments(nextPayments);

    return payment;
  },

  replaceAll(payments) {
    return writePayments(payments);
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(PAYMENT_STORAGE_KEY);
    }
  },

  storageKey: PAYMENT_STORAGE_KEY,
};
