const CUSTOMER_STORAGE_KEY = "artkrilik-erp-v3.customers";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readCustomers() {
  if (!storageIsAvailable()) {
    return [];
  }

  const storedValue = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);

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

function writeCustomers(customers) {
  if (!Array.isArray(customers)) {
    throw new TypeError("Customer repository expects an array.");
  }

  if (!storageIsAvailable()) {
    return customers;
  }

  window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));

  return customers;
}

export const customerRepository = {
  getAll() {
    return readCustomers();
  },

  replaceAll(customers) {
    return writeCustomers(customers);
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
  },

  storageKey: CUSTOMER_STORAGE_KEY,
};
