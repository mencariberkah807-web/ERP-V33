export const PRODUCT_STATUSES = Object.freeze(["Active", "Inactive"]);

export function validateProductRecord(product) {
  if (!product || typeof product !== "object") {
    return "Product must be an object.";
  }

  if (!String(product.productId ?? "").trim()) {
    return "Product ID is required.";
  }

  if (!String(product.sku ?? "").trim()) {
    return "SKU is required.";
  }

  if (!String(product.productName ?? "").trim()) {
    return "Product Name is required.";
  }

  if (!String(product.categoryId ?? "").trim()) {
    return "Category is required.";
  }

  if (!String(product.unit ?? "").trim()) {
    return "Unit is required.";
  }

  if (Number(product.costPrice ?? 0) < 0) {
    return "Cost Price cannot be negative.";
  }

  if (Number(product.sellingPrice ?? 0) < 0) {
    return "Selling Price cannot be negative.";
  }

  if (!PRODUCT_STATUSES.includes(product.status)) {
    return "Product status must be Active or Inactive.";
  }

  return "";
}

export function assertProductRecord(product) {
  const error = validateProductRecord(product);

  if (error) {
    throw new TypeError(error);
  }

  return product;
}

export function validateProductCollection(products) {
  if (!Array.isArray(products)) {
    return "Products must be an array.";
  }

  const ids = new Set();
  const skus = new Set();
  const names = new Set();

  for (const product of products) {
    const error = validateProductRecord(product);

    if (error) {
      return error;
    }

    const productId = String(product.productId).trim();
    const sku = String(product.sku).trim().toLowerCase();
    const name = String(product.productName).trim().toLowerCase();

    if (ids.has(productId)) {
      return `Duplicate Product ID: ${productId}.`;
    }

    if (skus.has(sku)) {
      return `Duplicate SKU: ${product.sku}.`;
    }

    if (names.has(name)) {
      return `Duplicate Product Name: ${product.productName}.`;
    }

    ids.add(productId);
    skus.add(sku);
    names.add(name);
  }

  return "";
}

export function assertProductCollection(products) {
  const error = validateProductCollection(products);

  if (error) {
    throw new TypeError(error);
  }

  return products;
}
