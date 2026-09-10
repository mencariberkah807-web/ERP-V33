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
    throw new Error(payload?.error?.message || payload?.detail || `Product API request failed (${response.status}).`);
  }

  return payload;
}

function unwrap(payload) {
  return payload?.data ?? payload;
}

export const apiProductRepository = Object.freeze({
  async getAll() {
    const payload = await request("/products");
    return unwrap(payload) || [];
  },

  async getById(productId) {
    const payload = await request(`/products/${encodeURIComponent(productId)}`);
    return unwrap(payload);
  },

  async create(product) {
    const payload = await request("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    return unwrap(payload);
  },

  async update(productId, product) {
    const payload = await request(`/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      body: JSON.stringify(product),
    });
    return unwrap(payload);
  },
});
