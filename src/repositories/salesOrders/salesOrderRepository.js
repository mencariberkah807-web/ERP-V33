const SALES_ORDER_STORAGE_KEY = "artkrilik-erp-v3.sales-orders";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readSalesOrders() {
  if (!storageIsAvailable()) {
    return [];
  }

  const raw = window.localStorage.getItem(SALES_ORDER_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSalesOrders(salesOrders) {
  if (!Array.isArray(salesOrders)) {
    throw new TypeError("Sales Order repository expects an array.");
  }

  if (!storageIsAvailable()) {
    return salesOrders;
  }

  window.localStorage.setItem(
    SALES_ORDER_STORAGE_KEY,
    JSON.stringify(salesOrders)
  );

  return salesOrders;
}

export const salesOrderRepository = {
  getAll() {
    return readSalesOrders();
  },

  append(salesOrder) {
    const current = readSalesOrders();

    const next = [...current, salesOrder];

    writeSalesOrders(next);

    return salesOrder;
  },

  replaceAll(salesOrders) {
    return writeSalesOrders(salesOrders);
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(SALES_ORDER_STORAGE_KEY);
    }
  },

  storageKey: SALES_ORDER_STORAGE_KEY,
};
