import { customerRepository } from "../repositories/customers/customerRepository.js";

export const customerStore = {
  getCustomers() {
    return customerRepository.getAll();
  },

  getActiveCustomers() {
    return customerRepository
      .getAll()
      .filter((customer) => customer.status === "Active");
  },

  replaceCustomers(customers) {
    return customerRepository.replaceAll(customers);
  },

  clearCustomers() {
    customerRepository.clear();
  },
};
