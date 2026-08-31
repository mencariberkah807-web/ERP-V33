function normalizeNumber(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(number, 0);
}

export function calculateItemSubtotal(item) {
  const quantity = normalizeNumber(item.quantity);

  const unitPrice = normalizeNumber(item.unitPrice);

  return quantity * unitPrice;
}

export function calculateItemDiscount(item) {
  const subtotal = calculateItemSubtotal(item);

  const discountValue = normalizeNumber(item.discountValue);

  if (item.discountType === "percentage") {
    const percentage = Math.min(discountValue, 100);

    return subtotal * (percentage / 100);
  }

  return Math.min(discountValue, subtotal);
}

export function calculateItemTotal(item) {
  const subtotal = calculateItemSubtotal(item);

  const discount = calculateItemDiscount(item);

  return Math.max(subtotal - discount, 0);
}

export function calculateSalesOrderTotal(items = []) {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
}
