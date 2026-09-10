const API_BASE = "/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.detail || `Customer API request failed (${response.status}).`);
  }

  return payload;
}

function unwrap(payload) {
  return payload?.data ?? payload;
}

export const apiCustomerRepository = Object.freeze({
  async getAll() {
    const payload = await request("/customers");
    return unwrap(payload) || [];
  },

  async getById(customerId) {
    const payload = await request(`/customers/${encodeURIComponent(customerId)}`);
    return unwrap(payload);
  },

  async create(customer) {
    const payload = await request("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    });
    return unwrap(payload);
  },

  async update(customerId, customer) {
    const payload = await request(`/customers/${encodeURIComponent(customerId)}`, {
      method: "PATCH",
      body: JSON.stringify(customer),
    });
    return unwrap(payload);
  },
});
