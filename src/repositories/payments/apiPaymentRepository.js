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
    throw new Error(
      payload?.error?.message ||
        payload?.detail ||
        `Payment API request failed (${response.status}).`
    );
  }

  return payload;
}

function unwrap(payload) {
  return payload?.data ?? payload;
}

function normalizePayment(payment) {
  return {
    ...payment,
    paymentId: payment.paymentId,
    paymentNumber: payment.paymentNumber || `PAY-${String(payment.paymentId || "").padStart(5, "0")}`,
    paymentDate: payment.paymentDate,
    soNumber: payment.soNumber,
    customer: payment.customerId,
    customerDisplayName: payment.customerDisplayName || payment.customerId,
    amount: Number(payment.amount || 0),
    paymentMethod: payment.method,
    referenceNumber: payment.reference,
    source: payment.source === "MARKETPLACE" ? "MARKETPLACE_AUTO" : "MANUAL",
    paymentStatus: payment.status,
  };
}

export const apiPaymentRepository = Object.freeze({
  async getBySO(soNumber) {
    const payload = await request(
      `/sales-orders/${encodeURIComponent(soNumber)}/payments?page=1&pageSize=100`
    );
    const data = unwrap(payload);
    return Array.isArray(data) ? data.map(normalizePayment) : [];
  },

  async getById(paymentId) {
    const payload = await request(`/payments/${encodeURIComponent(paymentId)}`);
    return normalizePayment(unwrap(payload));
  },

  async create(soNumber, payment, idempotencyKey) {
    const payload = await request(
      `/sales-orders/${encodeURIComponent(soNumber)}/payments`,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payment),
      }
    );
    return normalizePayment(unwrap(payload));
  },
});
