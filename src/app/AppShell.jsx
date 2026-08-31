import { useState } from "react";

import Sidebar from "../components/layout/Sidebar/Sidebar.jsx";
import Header from "../components/layout/Header/Header.jsx";
import PageContainer from "../components/layout/PageContainer/PageContainer.jsx";
import PageHeader from "../components/layout/PageHeader/PageHeader.jsx";

import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import SalesOrderPage from "../features/sales-orders/SalesOrderPage.jsx";
import CustomerPage from "../features/customers/CustomerPage.jsx";
import ProductPage from "../features/products/ProductPage.jsx";
import PaymentPage from "../features/payments/PaymentPage.jsx";

export default function AppShell() {
  const [activePage, setActivePage] =
    useState("dashboard");

  const isDashboard =
    activePage === "dashboard";

  const isSalesOrder =
    activePage === "sales-order";

  const isPayment =
    activePage === "payment";

  const isCustomer =
    activePage === "customer";

  const isProduct =
    activePage === "product";

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="app-main">
        <Header />

        <PageContainer>
          {isDashboard && (
            <>
              <PageHeader
                title="Dashboard"
                description="ARTKRILIK ERP V3"
              />

              <DashboardPage />
            </>
          )}

          {isSalesOrder && (
            <SalesOrderPage
              onNavigate={
                setActivePage
              }
            />
          )}

          {isPayment && (
            <PaymentPage />
          )}

          {isCustomer && (
            <CustomerPage />
          )}

          {isProduct && (
            <ProductPage />
          )}
        </PageContainer>
      </div>
    </div>
  );
}