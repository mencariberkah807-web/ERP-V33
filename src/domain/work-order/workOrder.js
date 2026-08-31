export function createWorkOrderFromSalesItem({ salesOrder, item }) {
  return {
    id: null,

    woNumber: null,

    source: {
      soNumber: salesOrder.soNumber,

      customerId: salesOrder.customer.id,

      customerName: salesOrder.customer.name,
    },

    product: {
      productId: item.productId,

      productName: item.productName,

      qty: item.qty,
    },

    specification: item.specification,

    artwork: item.artwork,

    attachment: item.attachment,

    productionNotes: item.productionNotes,

    status: "PENDING",

    createdAt: new Date().toISOString(),
  };
}
