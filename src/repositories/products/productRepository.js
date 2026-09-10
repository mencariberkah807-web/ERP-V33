import { apiProductRepository } from "./apiProductRepository.js";

const PRODUCT_STORAGE_KEY = "artkrilik-erp-v3.products";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readProducts() {
  if (!storageIsAvailable()) return [];
  const storedValue = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
  if (!storedValue) return [];
  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

async function syncProduct(product) {
  try {
    await apiProductRepository.create(product);
  } catch (error) {
    if (!String(error?.message || "").includes("already exists")) {
      console.error("Product API sync failed:", error);
      return;
    }
    try {
      await apiProductRepository.update(product.productId, product);
    } catch (updateError) {
      console.error("Product API update sync failed:", updateError);
    }
  }
}

function writeProducts(products) {
  if (!Array.isArray(products)) throw new TypeError("Product repository expects an array.");
  if (storageIsAvailable()) window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(products));
  for (const product of products) void syncProduct(product);
  return products;
}

export const productRepository = {
  getAll() { return readProducts(); },
  replaceAll(products) { return writeProducts(products); },
  clear() {
    if (storageIsAvailable()) window.localStorage.removeItem(PRODUCT_STORAGE_KEY);
  },
  storageKey: PRODUCT_STORAGE_KEY,
};
