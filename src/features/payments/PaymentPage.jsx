import {
  useMemo,
  useState,
} from "react";

import { paymentStore } from "../../state/paymentStore.js";

import "./payments.css";

function formatIDR(value) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(Number(value || 0));
}

function formatPaymentDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export default function PaymentPage() {
  const [payments] = useState(
    () => paymentStore.getPayments()
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("ALL");

  const filteredPayments =
    useMemo(() => {
      const keyword =
        searchQuery
          .trim()
          .toLowerCase();

      return payments
        .filter((payment) => {
          if (
            sourceFilter !==
              "ALL" &&
            String(
              payment.source ??
                "MANUAL"
            ) !== sourceFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const searchableValues = [
            payment.paymentNumber,
            payment.soNumber,
            payment.customer,
            payment.customerDisplayName,
            payment.paymentMethod,
            payment.referenceNumber,
          ];

          return searchableValues.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(keyword)
          );
        })
        .sort((a, b) => {
          const aNumber =
            Number(
              String(
                a.paymentNumber ?? ""
              ).replace(
                "PAY-",
                ""
              )
            ) || 0;

          const bNumber =
            Number(
              String(
                b.paymentNumber ?? ""
              ).replace(
                "PAY-",
                ""
              )
            ) || 0;

          return bNumber - aNumber;
        });
    }, [
      payments,
      searchQuery,
      sourceFilter,
    ]);

  return (
    <div className="payment-page">
      <div className="payment-page-header">
        <div>
          <h1 className="payment-page-title">
            Payments
          </h1>

          <p className="payment-page-description">
            Monitor payment records
            linked to Sales Orders.
          </p>
        </div>
      </div>

      <section className="payment-list-card">
        <div className="payment-toolbar">
          <div className="payment-search-wrap">
            <input
              type="search"
              className="payment-search-input"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search payment no., SO, customer..."
            />
          </div>

          <select
            className="payment-filter-select"
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Sources
            </option>

            <option value="MANUAL">
              Manual
            </option>

            <option value="MARKETPLACE_AUTO">
              Marketplace Auto
            </option>
          </select>
        </div>

        <div className="payment-table-wrap">
          <table className="payment-table">
            <thead>
              <tr>
                <th>
                  Payment Date
                </th>

                <th>
                  Payment No.
                </th>

                <th>
                  SO Number
                </th>

                <th>
                  Customer
                </th>

                <th className="payment-table-number">
                  Amount
                </th>

                <th>
                  Method
                </th>

                <th>
                  Reference
                </th>

                <th>
                  Source
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="payment-empty-state"
                  >
                    <div className="payment-empty-content">
                      <div className="payment-empty-icon">
                        $
                      </div>

                      <strong>
                        No payment records
                      </strong>

                      <span>
                        Payments created
                        from Sales Orders
                        will appear here.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(
                  (payment) => (
                    <tr
                      key={
                        payment.paymentNumber
                      }
                      className="payment-table-row"
                    >
                      <td>
                        {formatPaymentDate(
                          payment.paymentDate
                        )}
                      </td>

                      <td>
                        <strong className="payment-number">
                          {payment.paymentNumber ||
                            "—"}
                        </strong>
                      </td>

                      <td>
                        {payment.soNumber ||
                          "—"}
                      </td>

                      <td>
                        {payment.customerDisplayName ||
                          payment.customer ||
                          "—"}
                      </td>

                      <td className="payment-table-number payment-amount">
                        {formatIDR(
                          payment.amount
                        )}
                      </td>

                      <td>
                        {payment.paymentMethod ||
                          "—"}
                      </td>

                      <td>
                        {payment.referenceNumber ||
                          "—"}
                      </td>

                      <td>
                        <PaymentSourceBadge
                          source={
                            payment.source ||
                            "MANUAL"
                          }
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PaymentSourceBadge({
  source,
}) {
  const isMarketplace =
    source ===
    "MARKETPLACE_AUTO";

  return (
    <span
      className={
        isMarketplace
          ? "payment-source payment-source--marketplace"
          : "payment-source payment-source--manual"
      }
    >
      {isMarketplace
        ? "Marketplace"
        : "Manual"}
    </span>
  );
}