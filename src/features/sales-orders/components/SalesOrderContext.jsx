import { createContext, useContext, useState } from "react";

const SalesOrderContext = createContext();

export function SalesOrderProvider({ children }) {
  const [salesOrders, setSalesOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  function createSalesOrder(order) {
    setSalesOrders((previous) => [...previous, order]);
  }

  return (
    <SalesOrderContext.Provider
      value={{
        salesOrders,
        selectedOrder,
        setSelectedOrder,
        createSalesOrder,
      }}>
      {children}
    </SalesOrderContext.Provider>
  );
}

export function useSalesOrderContext() {
  return useContext(SalesOrderContext);
}
