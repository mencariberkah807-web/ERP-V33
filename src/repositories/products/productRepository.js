const PRODUCT_STORAGE_KEY = "artkrilik-erp-v3.products";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readProducts() {
  if (!storageIsAvailable()) {
    return [];
  }

  const storedValue = window.localStorage.getItem(PRODUCT_STORAGE_KEY);

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

function writeProducts(products) {
  if (!Array.isArray(products)) {
    throw new TypeError("Product repository expects an array.");
  }

  if (!storageIsAvailable()) {
    return products;
  }

  window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));

  return products;
}

export const productRepository = {
  getAll() {
    return readProducts();
  },

  replaceAll(products) {
    return writeProducts(products);
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(PRODUCT_STORAGE_KEY);
    }
  },

  storageKey: PRODUCT_STORAGE_KEY,
};
