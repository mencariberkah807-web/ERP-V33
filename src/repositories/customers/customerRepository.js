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

async function syncCustomer(customer, remoteCustomers = []) {
  const customerId = customer.customerId;
  const exists = remoteCustomers.some((remote) => String(remote.customerId) === String(customerId));

  try {
    if (exists) {
      await apiCustomerRepository.update(customerId, customer);
    } else {
      await apiCustomerRepository.create(customer);
    }
  } catch (error) {
    console.error("Customer API sync failed:", error);
  }
}

function writeCustomers(customers) {
  if (!Array.isArray(customers)) throw new TypeError("Customer repository expects an array.");
  if (storageIsAvailable()) window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  void syncAll();
  return customers;
}

async function syncAll() {
  const customers = readCustomers();
  if (!customers.length) return;

  try {
    const remoteCustomers = await apiCustomerRepository.getAll();
    await Promise.all(customers.map((customer) => syncCustomer(customer, remoteCustomers)));
  } catch (error) {
    console.error("Customer API sync failed:", error);
  }
}

export const customerRepository = {
  getAll() { return readCustomers(); },
  replaceAll(customers) { return writeCustomers(customers); },
  syncAll,
  clear() {
    if (storageIsAvailable()) window.localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  },
  storageKey: CUSTOMER_STORAGE_KEY,
};
