import { paymentStore } from "../../../state/paymentStore.js";
import { salesOrderStore } from "../../../state/salesOrderStore.js";

const ORDER_TYPE_LABELS = {
  DIRECT: "Direct Order",
  MARKETPLACE: "Marketplace",
};

const EDITABLE_STATUSES = new Set(["NEW ORDER", "READY PRODUCTION"]);

function nextNumber(records, field, prefix, width = 5) {
  const numbers = records
    .map((record) => String(record?.[field] ?? "").match(new RegExp(`^${prefix}-(\\d+)$`)))
    .map((match) => (match ? Number(match[1]) : 0))
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
  const discount = Math.min(Math.max(Number(item.discount) || 0, 0), quantity * unitPrice);
  return Math.max(quantity * unitPrice - discount, 0);
}

function buildItems(soNumber, items) {
  return items.map((item, index) => ({
    soItemId: item.soItemId || `${soNumber}-ITEM-${String(index + 1).padStart(3, "0")}`,
    productId: item.productId,
    quantity: Math.max(Number(item.quantity) || 0, 0),
    unitPrice: Math.max(Number(item.unitPrice) || 0, 0),
    discount: Math.max(Number(item.discount) || 0, 0),
    itemTotal: itemTotal(item),
    customRequest: Boolean(item.customRequest),
    productionNotes: item.productionNotes ?? item.notes ?? "",
    artwork: item.attachment ? normalizeAttachment(item.attachment) : item.artwork ?? null,
    status: item.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  }));
}

function totalForActiveItems(items) {
  return items
    .filter((item) => item.status !== "INACTIVE")
    .reduce((total, item) => total + item.itemTotal, 0);
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
  const normalizedItems = buildItems(soNumber, items);
  const grandTotal = totalForActiveItems(normalizedItems);
  const paid = Math.max(Number(amountPaid) || 0, 0);
  const isMarketplace = orderType === "MARKETPLACE";
  const effectivePaid = isMarketplace ? grandTotal : paid;

  if (!ORDER_TYPE_LABELS[orderType]) throw new Error("Order Type tidak valid.");
  if (!normalizedItems.length) throw new Error("Minimal 1 Order Item.");

  const order = {
    id: crypto.randomUUID?.() ?? `${soNumber}-${Date.now()}`,
    soNumber,
    orderType,
    orderTypeLabel: ORDER_TYPE_LABELS[orderType],
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
    grandTotal,
    createdAt: now,
    updatedAt: now,
  };

  salesOrderStore.addSalesOrder(order);

  if (isMarketplace || paid > 0) {
    const paymentNumber = nextNumber(existingPayments, "paymentNumber", "PAY");

    paymentStore.addPayment({
      paymentNumber,
      paymentDate: orderDate,
      soNumber,
      customer: customer?.displayName ?? marketplaceCustomer ?? "",
      customerDisplayName: customer?.displayName ?? marketplaceCustomer ?? "",
      amount: effectivePaid,
      paymentMethod: isMarketplace ? "Transfer" : paymentMethod,
      referenceNumber: isMarketplace ? trackingNumber || paymentReference : paymentReference,
      source: isMarketplace ? "MARKETPLACE_AUTO" : "MANUAL",
      createdAt: now,
    });
  }

  return order;
}

export function updateSalesOrderFromForm(orderId, { orderDate, deadline, priority, customer, marketplace, marketplaceCustomer, trackingNumber, items }) {
  const orders = salesOrderStore.getSalesOrders();
  const existing = orders.find((order) => order.id === orderId);

  if (!existing) throw new Error("Sales Order tidak ditemukan.");
  if (!EDITABLE_STATUSES.has(existing.status)) {
    throw new Error("Sales Order hanya dapat diedit sebelum Production dimulai.");
  }

  const normalizedItems = buildItems(existing.soNumber, items);
  if (!normalizedItems.length) throw new Error("Minimal 1 Order Item.");

  const grandTotal = totalForActiveItems(normalizedItems);
  const totalPaid = paymentStore
    .getPaymentsBySO(existing.soNumber)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  if (totalPaid > grandTotal) {
    throw new Error("Sales Order tidak dapat diedit karena Total Paid melebihi Grand Total baru.");
  }

  const updated = {
    ...existing,
    orderDate,
    deadline,
    priority,
    customer: existing.orderType === "DIRECT"
      ? (customer
          ? {
              customerId: customer.customerId ?? "",
              displayName: customer.displayName ?? customer.customerName ?? "",
              mobile: customer.mobile ?? "",
              email: customer.email ?? "",
              address: customer.address ?? "",
            }
          : null)
      : null,
    marketplace: existing.orderType === "MARKETPLACE"
      ? {
          channel: marketplace ?? existing.marketplace?.channel ?? "",
          customer: marketplaceCustomer ?? existing.marketplace?.customer ?? "",
          trackingNumber: trackingNumber ?? existing.marketplace?.trackingNumber ?? "",
        }
      : null,
    items: normalizedItems,
    grandTotal,
    updatedAt: new Date().toISOString(),
  };

  salesOrderStore.replaceSalesOrders(orders.map((order) => (order.id === orderId ? updated : order)));
  return updated;
}

export function cancelSalesOrder(orderId) {
  const orders = salesOrderStore.getSalesOrders();
  const existing = orders.find((order) => order.id === orderId);

  if (!existing) throw new Error("Sales Order tidak ditemukan.");
  if (!EDITABLE_STATUSES.has(existing.status)) {
    throw new Error("Sales Order hanya dapat dibatalkan sebelum Production dimulai.");
  }

  const updated = {
    ...existing,
    status: "INACTIVE",
    items: existing.items.map((item) => ({ ...item, status: "INACTIVE" })),
    updatedAt: new Date().toISOString(),
  };

  salesOrderStore.replaceSalesOrders(orders.map((order) => (order.id === orderId ? updated : order)));
  return updated;
}
