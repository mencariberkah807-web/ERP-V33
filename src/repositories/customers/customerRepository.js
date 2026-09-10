import { apiCustomerRepository } from "./apiCustomerRepository.js";

const CUSTOMER_STORAGE_KEY = "artkrilik-erp-v3.customers";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readCustomers() {
  if (!storageIsAvailable()) return [];
  const storedValue = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
  if (!storedValue) return [];
  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

async function syncCustomer(customer) {
  try {
    await apiCustomerRepository.create(customer);
  } catch (error) {
    if (!String(error?.message || "").includes("already exists")) {
      console.error("Customer API sync failed:", error);
      return;
    }
    try {
      await apiCustomerRepository.update(customer.customerId, customer);
    } catch (updateError) {
      console.error("Customer API update sync failed:", updateError);
    }
  }
}

function writeCustomers(customers) {
  if (!Array.isArray(customers)) throw new TypeError("Customer repository expects an array.");
  if (storageIsAvailable()) window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  for (const customer of customers) void syncCustomer(customer);
  return customers;
}

export const customerRepository = {
  getAll() { return readCustomers(); },
  replaceAll(customers) { return writeCustomers(customers); },
  clear() {
    if (storageIsAvailable()) window.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  },
  storageKey: CUSTOMER_STORAGE_KEY,
};
