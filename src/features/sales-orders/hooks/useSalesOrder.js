import { useState } from "react";

const initialSalesOrder = {
  orderType: "Direct Order",

  customer: null,

  items: [],

  payment: {
    method: "",
    amount: 0,
  },

  attachments: [],

  notes: "",

  summary: {
    subtotal: 0,
    discount: 0,
    grandTotal: 0,
  },
};

const initialSalesOrders = [
  {
    id: 1,

    soNumber: "SO-00021",

    orderDate: "12/08/2026",

    customer: {
      name: "Budi - ITB",
      phone: "08123456789",
      email: "budi@email.com",
      address: "Bandung",
    },

    orderType: "Direct Order",

    items: [
      {
        product: "Acrylic Display",
        qty: 10,
        price: 250000,
      },
    ],

    paymentStatus: "Paid",

    orderStatus: "READY WO",

    summary: {
      grandTotal: 2500000,
    },
  },
];

export function useSalesOrder() {
  const [salesOrder, setSalesOrder] = useState(initialSalesOrder);

  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);

  const [selectedOrder, setSelectedOrder] = useState(null);

  function updateSalesOrder(field, value) {
    setSalesOrder((previous) => ({
      ...previous,

      [field]: value,
    }));
  }

  function selectOrder(order) {
    setSelectedOrder(order);
  }

  function createSalesOrder(order) {
    setSalesOrders((previous) => [...previous, order]);
  }

  function resetSalesOrder() {
    setSalesOrder(initialSalesOrder);
  }

  return {
    // New Order Form

    salesOrder,

    updateSalesOrder,

    resetSalesOrder,

    // Sales Order List

    salesOrders,

    createSalesOrder,

    // Detail Panel

    selectedOrder,

    selectOrder,
  };
}
