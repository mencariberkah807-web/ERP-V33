export const CUSTOMER_STATUSES = Object.freeze(["Active", "Inactive"]);

export function validateCustomerRecord(customer) {
  if (!customer || typeof customer !== "object") {
    return "Customer must be an object.";
  }

  if (!String(customer.customerId ?? "").trim()) {
    return "Customer ID is required.";
  }

  if (!String(customer.customerName ?? "").trim()) {
    return "Customer Name is required.";
  }

  if (!String(customer.customerType ?? "").trim()) {
    return "Customer Type is required.";
  }

  if (!CUSTOMER_STATUSES.includes(customer.status)) {
    return "Customer status must be Active or Inactive.";
  }

  return "";
}

export function assertCustomerRecord(customer) {
  const error = validateCustomerRecord(customer);

  if (error) {
    throw new TypeError(error);
  }

  return customer;
}

export function validateCustomerCollection(customers) {
  if (!Array.isArray(customers)) {
    return "Customers must be an array.";
  }

  const ids = new Set();
  const displayNames = new Set();

  for (const customer of customers) {
    const error = validateCustomerRecord(customer);

    if (error) {
      return error;
    }

    const customerId = String(customer.customerId).trim();
    const displayName = String(
      customer.displayName ?? customer.customerName
    )
      .trim()
      .toLowerCase();

    if (ids.has(customerId)) {
      return `Duplicate Customer ID: ${customerId}.`;
    }

    if (displayName && displayNames.has(displayName)) {
      return `Duplicate Customer Display Name: ${customer.displayName}.`;
    }

    ids.add(customerId);
    displayNames.add(displayName);
  }

  return "";
}

export function assertCustomerCollection(customers) {
  const error = validateCustomerCollection(customers);

  if (error) {
    throw new TypeError(error);
  }

  return customers;
}
