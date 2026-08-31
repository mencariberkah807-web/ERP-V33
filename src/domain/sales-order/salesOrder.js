function generateTimestamp() {
  return new Date().toISOString();
}

export function createSalesOrder({
  orderType = "DIRECT",
  customer = null,
  items = [],
  notes = "",
}) {
  return {
    id: null,

    soNumber: null,

    orderType,

    customer: customer
      ? {
          id: customer.id ?? null,
          name: customer.name ?? "",
          phone: customer.phone ?? "",
        }
      : null,

    items,

    notes,

    status: "NEW",

    createdAt: generateTimestamp(),

    updatedAt: generateTimestamp(),
  };
}
