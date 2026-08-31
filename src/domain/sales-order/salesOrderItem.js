export function createSalesOrderItem({
  product = null,
  quantity = 1,
  unitPrice = 0,
  discountType = "nominal",
  discountValue = 0,
  specification = {},
  artwork = null,
  attachments = [],
  productionNotes = "",
}) {
  return {
    id: null,

    productId: product?.id ?? null,

    productSnapshot: product
      ? {
          sku: product.sku ?? "",
          name: product.name ?? "",
          material: product.material ?? "",
          unit: product.unit ?? "",
        }
      : null,

    quantity: Number(quantity) || 0,

    pricing: {
      unitPrice: Number(unitPrice) || 0,

      discountType,

      discountValue: Number(discountValue) || 0,
    },

    specification: {
      material: specification.material ?? "",
      dimension: specification.dimension ?? "",
      finishing: specification.finishing ?? "",
    },

    artwork,

    attachments: Array.isArray(attachments) ? attachments : [],

    productionNotes,

    createdAt: new Date().toISOString(),
  };
}
