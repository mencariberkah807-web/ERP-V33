import { paymentStore } from "../../../state/paymentStore.js";
import { salesOrderStore } from "../../../state/salesOrderStore.js";

const ORDER_TYPE_LABELS = {
  DIRECT: "Direct Order",
  MARKETPLACE: "Marketplace",
};

function nextNumber(records, field, prefix, width = 5) {
  const numbers = records
    .map((record) => {
      const match = String(record?.[field] ?? "").match(
        new RegExp(`^${prefix}-(\\d+)$`)
      );
      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return `${prefix}-${String(next).padStart(width, "0")}`;
}

function normalizeAttachment(file) {
  if (!file) return null;

  return {
    name: file.name ?? "",
    type: file.type ?? "",
    size: Number(file.size || 0),
  };
}

function itemTotal(item) {
  const quantity = Math.max(Number(item.quantity) || 0, 0);
  const unitPrice = Math.max(Number(item.unitPrice) || 0, 0);
  const discount = Math.min(
    Math.max(Number(item.discount) || 0, 0),
    quantity * unitPrice
  );

  return Math.max(quantity * unitPrice - discount, 0);
}

function paymentStatus(total, paid) {
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIALLY PAID";
}

export function createSalesOrderFromForm({
  orderType,
  orderDate,
  deadline,
  priority,
  customer,
  marketplace,
  marketplaceCustomer,
  trackingNumber,
  items,
  amountPaid = 0,
  paymentMethod = "",
  paymentReference = "",
}) {
  const existingOrders = salesOrderStore.getSalesOrders();
  const existingPayments = paymentStore.getPayments();
  const soNumber = nextNumber(existingOrders, "soNumber", "SO");
  const now = new Date().toISOString();

  const normalizedItems = items.map((item, index) => {
    const total = itemTotal(item);

    return {
      soItemId: `${soNumber}-ITEM-${String(index + 1).padStart(3, "0")}`,
      productId: item.productId,
      quantity: Math.max(Number(item.quantity) || 0, 0),
      unitPrice: Math.max(Number(item.unitPrice) || 0, 0),
      discount: Math.max(Number(item.discount) || 0, 0),
      itemTotal: total,
      customRequest: Boolean(item.customRequest),
      productionNotes: item.notes ?? "",
      artwork: normalizeAttachment(item.attachment),
      status: "ACTIVE",
    };
  });

  const grandTotal = normalizedItems.reduce(
    (total, item) => total + item.itemTotal,
    0
  );
  const paid = Math.max(Number(amountPaid) || 0, 0);
  const isMarketplace = orderType === "MARKETPLACE";
  const effectivePaid = isMarketplace ? grandTotal : paid;
  const effectivePaymentStatus = paymentStatus(grandTotal, effectivePaid);

  const order = {
    id: crypto.randomUUID?.() ?? `${soNumber}-${Date.now()}`,
    soNumber,
    orderType,
    orderTypeLabel: ORDER_TYPE_LABELS[orderType] ?? orderType,
    status: isMarketplace ? "READY PRODUCTION" : "NEW ORDER",
    orderDate,
    deadline,
    priority,
    customer: customer
      ? {
          customerId: customer.customerId ?? "",
          displayName: customer.displayName ?? customer.customerName ?? "",
          mobile: customer.mobile ?? "",
          email: customer.email ?? "",
          address: customer.address ?? "",
        }
      : null,
    marketplace: isMarketplace
      ? {
          channel: marketplace,
          customer: marketplaceCustomer ?? "",
          trackingNumber: trackingNumber ?? "",
        }
      : null,
    items: normalizedItems,
    paymentSummary: {
      totalPaid: effectivePaid,
      balance: Math.max(grandTotal - effectivePaid, 0),
      status: effectivePaymentStatus,
    },
    grandTotal,
    createdAt: now,
    updatedAt: now,
  };

  salesOrderStore.addSalesOrder(order);

  if (isMarketplace || paid > 0) {
    const paymentNumber = nextNumber(
      existingPayments,
      "paymentNumber",
      "PAY"
    );

    paymentStore.addPayment({
      paymentNumber,
      paymentDate: orderDate,
      soNumber,
      customer: customer?.displayName ?? marketplaceCustomer ?? "",
      customerDisplayName:
        customer?.displayName ?? marketplaceCustomer ?? "",
      amount: effectivePaid,
      paymentMethod: isMarketplace ? "Transfer" : paymentMethod,
      referenceNumber: isMarketplace
        ? trackingNumber || paymentReference
        : paymentReference,
      source: isMarketplace ? "MARKETPLACE_AUTO" : "MANUAL",
      status: effectivePaymentStatus,
      createdAt: now,
    });
  }

  return order;
}
