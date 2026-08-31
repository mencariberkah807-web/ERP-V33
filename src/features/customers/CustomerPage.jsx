import {
  useMemo,
  useState,
} from "react";

import { customerStore } from "../../state/customerStore.js";

import "./customers.css";

const CUSTOMER_TYPES = [
  "Regular",
  "Corporate",
  "Reseller",
];

const CUSTOMER_TABS = [
  "information",
  "photo",
];

function createEmptyCustomerForm() {
  return {
    customerName: "",
    company: "",
    customerType: "",
    mobile: "",
    email: "",
    address: "",
    status: "Active",
    notes: "",
    photo: "",
  };
}

function buildDisplayName(
  customerName,
  company
) {
  const cleanCustomerName =
    customerName.trim();

  const cleanCompany =
    company.trim();

  if (!cleanCustomerName) {
    return "";
  }

  if (!cleanCompany) {
    return cleanCustomerName;
  }

  return `${cleanCustomerName} - ${cleanCompany}`;
}

function generateCustomerId(customers) {
  const customerNumbers = customers
    .map((customer) => {
      const match = String(
        customer.customerId ?? ""
      ).match(/^CUST-(\d{5})$/);

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((number) => number > 0);

  const lastNumber =
    customerNumbers.length > 0
      ? Math.max(...customerNumbers)
      : 0;

  return `CUST-${String(
    lastNumber + 1
  ).padStart(5, "0")}`;
}

function customerToForm(customer) {
  return {
    customerName:
      customer.customerName ?? "",

    company:
      customer.company ?? "",

    customerType:
      customer.customerType ?? "",

    mobile:
      customer.mobile ?? "",

    email:
      customer.email ?? "",

    address:
      customer.address ?? "",

    status:
      customer.status ?? "Active",

    notes:
      customer.notes ?? "",

    photo:
      customer.photo ?? "",
  };
}

export default function CustomerPage() {
  const [customers, setCustomers] =
    useState(() =>
      customerStore.getCustomers()
    );

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState(null);

  const [drawerMode, setDrawerMode] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("information");

  const [formData, setFormData] =
    useState(createEmptyCustomerForm);

  const [editData, setEditData] =
    useState(createEmptyCustomerForm);

  const [formError, setFormError] =
    useState("");

  const [editError, setEditError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    customerTypeFilter,
    setCustomerTypeFilter,
  ] = useState("ALL");

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.customerId ===
        selectedCustomerId
    ) ?? null;

  const displayName =
    buildDisplayName(
      formData.customerName,
      formData.company
    );

  const editDisplayName =
    buildDisplayName(
      editData.customerName,
      editData.company
    );

  const filteredCustomers =
    useMemo(() => {
      const keyword =
        searchQuery
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          if (
            customerTypeFilter !==
              "ALL" &&
            customer.customerType !==
              customerTypeFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          return [
            customer.customerId,
            customer.customerName,
            customer.company,
            customer.displayName,
            customer.mobile,
            customer.email,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [
      customers,
      searchQuery,
      customerTypeFilter,
    ]);

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedCustomerId(null);
    setFormError("");
    setEditError("");
    setActiveTab("information");
  }

  function openNewCustomer() {
    setSelectedCustomerId(null);

    setFormData(
      createEmptyCustomerForm()
    );

    setFormError("");
    setActiveTab("information");
    setDrawerMode("new");
  }

  function openCustomerDetail(
    customer
  ) {
    setSelectedCustomerId(
      customer.customerId
    );

    setEditError("");
    setActiveTab("information");
    setDrawerMode("detail");
  }

  function startEdit() {
    if (!selectedCustomer) {
      return;
    }

    setEditData(
      customerToForm(
        selectedCustomer
      )
    );

    setEditError("");
    setActiveTab("information");
    setDrawerMode("edit");
  }

  function backToDetail() {
    if (!selectedCustomer) {
      return;
    }

    setEditData(
      customerToForm(
        selectedCustomer
      )
    );

    setEditError("");
    setActiveTab("information");
    setDrawerMode("detail");
  }

  function handleFieldChange(
    event,
    setter
  ) {
    const { name, value } =
      event.target;

    setter((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setEditError("");
  }

  function readPhoto(
    event,
    setter
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setter((current) => ({
        ...current,
        photo:
          typeof reader.result ===
          "string"
            ? reader.result
            : "",
      }));
    };

    reader.readAsDataURL(
      selectedFile
    );
  }

  function validateCustomer(
    data,
    excludedCustomerId = null
  ) {
    if (!data.customerName.trim()) {
      return "Customer Name is required.";
    }

    if (!data.customerType) {
      return "Please select Customer Type.";
    }

    const nextDisplayName =
      buildDisplayName(
        data.customerName,
        data.company
      );

    const duplicate =
      customers.find(
        (customer) =>
          customer.customerId !==
            excludedCustomerId &&
          String(
            customer.displayName ?? ""
          )
            .trim()
            .toLowerCase() ===
            nextDisplayName
              .toLowerCase()
      );

    if (duplicate) {
      return "Display Name already exists.";
    }

    return "";
  }

  function buildCustomerRecord(
    data,
    customerId,
    status = "Active"
  ) {
    return {
      customerId,

      customerName:
        data.customerName.trim(),

      company:
        data.company.trim(),

      displayName:
        buildDisplayName(
          data.customerName,
          data.company
        ),

      customerType:
        data.customerType,

      mobile:
        data.mobile.trim(),

      email:
        data.email.trim(),

      address:
        data.address.trim(),

      status,

      notes:
        data.notes.trim(),

      photo:
        data.photo,
    };
  }

  function handleCreateCustomer(
    event
  ) {
    event.preventDefault();

    const error =
      validateCustomer(formData);

    if (error) {
      setFormError(error);
      setActiveTab("information");
      return;
    }

    const newCustomer =
      buildCustomerRecord(
        formData,
        generateCustomerId(
          customers
        )
      );

    const nextCustomers = [
      ...customers,
      newCustomer,
    ];

    customerStore.replaceCustomers(
      nextCustomers
    );

    setCustomers(nextCustomers);
    closeDrawer();
  }

  function handleUpdateCustomer(
    event
  ) {
    event.preventDefault();

    if (!selectedCustomer) {
      return;
    }

    const error =
      validateCustomer(
        editData,
        selectedCustomer.customerId
      );

    if (error) {
      setEditError(error);
      setActiveTab("information");
      return;
    }

    const updatedCustomer =
      buildCustomerRecord(
        editData,
        selectedCustomer.customerId,
        selectedCustomer.status
      );

    const nextCustomers =
      customers.map(
        (customer) =>
          customer.customerId ===
          selectedCustomer.customerId
            ? updatedCustomer
            : customer
      );

    customerStore.replaceCustomers(
      nextCustomers
    );

    setCustomers(nextCustomers);
    setEditError("");
    setActiveTab("information");
    setDrawerMode("detail");
  }

  function handleToggleStatus() {
    if (!selectedCustomer) {
      return;
    }

    const nextStatus =
      selectedCustomer.status ===
      "Active"
        ? "Inactive"
        : "Active";

    const confirmed =
      window.confirm(
        `Set ${selectedCustomer.displayName} to ${nextStatus}?`
      );

    if (!confirmed) {
      return;
    }

    const nextCustomers =
      customers.map(
        (customer) =>
          customer.customerId ===
          selectedCustomer.customerId
            ? {
                ...customer,
                status: nextStatus,
              }
            : customer
      );

    customerStore.replaceCustomers(
      nextCustomers
    );

    setCustomers(nextCustomers);
  }

  const drawerData =
    drawerMode === "edit"
      ? editData
      : formData;

  const drawerDisplayName =
    drawerMode === "edit"
      ? editDisplayName
      : displayName;

  return (
    <div className="customer-page">
      <div className="customer-page-header">
        <div>
          <h1 className="customer-page-title">
            Customers
          </h1>

          <p className="customer-page-description">
            Manage customer master data
            used by Sales Orders.
          </p>
        </div>

        <button
          type="button"
          className="customer-primary-button"
          onClick={openNewCustomer}
        >
          + New Customer
        </button>
      </div>

      <section className="customer-list-card">
        <div className="customer-toolbar">
          <div className="customer-search-wrap">
            <input
              type="search"
              className="customer-search-input"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search customers..."
            />
          </div>

          <select
            className="customer-filter-select"
            value={customerTypeFilter}
            onChange={(event) =>
              setCustomerTypeFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Customer Types
            </option>

            {CUSTOMER_TYPES.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>
        </div>

        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Display Name</th>
                <th>Customer Type</th>
                <th>Mobile</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="customer-empty-state"
                  >
                    <strong>
                      No customers found
                    </strong>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={
                        customer.customerId
                      }
                      className="customer-table-row"
                      onClick={() =>
                        openCustomerDetail(
                          customer
                        )
                      }
                    >
                      <td>
                        {
                          customer.customerId
                        }
                      </td>

                      <td>
                        {
                          customer.customerName
                        }
                      </td>

                      <td>
                        {customer.company ||
                          "—"}
                      </td>

                      <td>
                        {
                          customer.displayName
                        }
                      </td>

                      <td>
                        {
                          customer.customerType
                        }
                      </td>

                      <td>
                        {customer.mobile ||
                          "—"}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            customer.status
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

      {drawerMode && (
        <>
          <button
            type="button"
            className="customer-drawer-backdrop"
            onClick={closeDrawer}
            aria-label="Close Customer Drawer"
          />

          <aside className="customer-detail-drawer">
            <div className="customer-detail-header customer-detail-header--corporate">
              <div>
                <span className="customer-detail-eyebrow">
                  {drawerMode === "new"
                    ? "New Customer"
                    : drawerMode === "edit"
                    ? "Edit Customer"
                    : "Customer Detail"}
                </span>

                <h2>
                  {drawerMode === "new"
                    ? "Create Customer"
                    : selectedCustomer?.displayName}
                </h2>

                <span className="customer-detail-id">
                  {drawerMode === "new"
                    ? "Customer ID generated automatically"
                    : selectedCustomer?.customerId}
                </span>
              </div>

              <button
                type="button"
                className="customer-detail-close customer-detail-close--corporate"
                onClick={closeDrawer}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {drawerMode === "detail" ? (
              <>
                <div className="customer-detail-body">
                  <CustomerDetail
                    customer={
                      selectedCustomer
                    }
                  />
                </div>

                <div className="customer-detail-footer">
                  <button
                    type="button"
                    className="customer-secondary-button"
                    onClick={closeDrawer}
                  >
                    Close
                  </button>

                  <div className="customer-footer-actions-right">
                    <button
                      type="button"
                      className="customer-light-action-button"
                      onClick={
                        handleToggleStatus
                      }
                    >
                      {selectedCustomer?.status ===
                      "Active"
                        ? "Set Inactive"
                        : "Set Active"}
                    </button>

                    <button
                      type="button"
                      className="customer-primary-button"
                      onClick={startEdit}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <form
                className="customer-drawer-form"
                onSubmit={
                  drawerMode === "new"
                    ? handleCreateCustomer
                    : handleUpdateCustomer
                }
              >
                <CustomerTabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />

                <div className="customer-detail-body">
                  {(formError ||
                    editError) && (
                    <div className="customer-form-error">
                      {drawerMode === "new"
                        ? formError
                        : editError}
                    </div>
                  )}

                  {activeTab ===
                  "information" ? (
                    <div className="customer-form-card-modern">
                      <CustomerInformationFields
                        data={drawerData}
                        displayName={
                          drawerDisplayName
                        }
                        customerId={
                          drawerMode === "edit"
                            ? selectedCustomer
                                ?.customerId
                            : null
                        }
                        onChange={(event) =>
                          handleFieldChange(
                            event,
                            drawerMode ===
                              "edit"
                              ? setEditData
                              : setFormData
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="customer-form-card-modern">
                      <CustomerPhotoField
                        photo={
                          drawerData.photo
                        }
                        onChange={(event) =>
                          readPhoto(
                            event,
                            drawerMode ===
                              "edit"
                              ? setEditData
                              : setFormData
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="customer-detail-footer">
                  <button
                    type="button"
                    className="customer-secondary-button"
                    onClick={closeDrawer}
                  >
                    Close
                  </button>

                  <div className="customer-footer-actions-right">
                    <button
                      type="button"
                      className="customer-secondary-button"
                      onClick={
                        drawerMode === "new"
                          ? closeDrawer
                          : backToDetail
                      }
                    >
                      {drawerMode === "new"
                        ? "Cancel"
                        : "Back"}
                    </button>

                    <button
                      type="submit"
                      className="customer-primary-button"
                    >
                      {drawerMode === "new"
                        ? "Create Customer"
                        : "Update Customer"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </aside>
        </>
      )}
    </div>
  );
}

function CustomerTabs({
  activeTab,
  onChange,
}) {
  return (
    <div className="customer-tabs">
      {CUSTOMER_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={
            activeTab === tab
              ? "customer-tab customer-tab--active"
              : "customer-tab"
          }
          onClick={() =>
            onChange(tab)
          }
        >
          {tab === "information"
            ? "Information"
            : "Photo"}
        </button>
      ))}
    </div>
  );
}

function CustomerInformationFields({
  data,
  displayName,
  customerId,
  onChange,
}) {
  return (
    <div className="customer-form-grid">
      {customerId && (
        <label className="customer-field">
          <span>Customer ID</span>

          <input
            value={customerId}
            readOnly
          />
        </label>
      )}

      <label className="customer-field">
        <span>
          Customer Name *
        </span>

        <input
          name="customerName"
          value={data.customerName}
          onChange={onChange}
          placeholder="Enter customer name"
        />
      </label>

      <label className="customer-field">
        <span>Company</span>

        <input
          name="company"
          value={data.company}
          onChange={onChange}
          placeholder="Enter company"
        />
      </label>

      <label className="customer-field">
        <span>
          Customer Type *
        </span>

        <select
          name="customerType"
          value={data.customerType}
          onChange={onChange}
        >
          <option value="">
            Select Customer Type
          </option>

          {CUSTOMER_TYPES.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            )
          )}
        </select>
      </label>

      <label className="customer-field customer-field--full">
        <span>Display Name</span>

        <input
          value={displayName}
          readOnly
          placeholder="Generated automatically"
        />
      </label>

      <label className="customer-field">
        <span>Mobile</span>

        <input
          name="mobile"
          value={data.mobile}
          onChange={onChange}
          placeholder="Mobile number"
        />
      </label>

      <label className="customer-field">
        <span>Email</span>

        <input
          type="email"
          name="email"
          value={data.email}
          onChange={onChange}
          placeholder="Email address"
        />
      </label>

      <label className="customer-field customer-field--full">
        <span>Address</span>

        <textarea
          rows="3"
          name="address"
          value={data.address}
          onChange={onChange}
          placeholder="Customer address"
        />
      </label>

      <label className="customer-field customer-field--full">
        <span>Notes</span>

        <textarea
          rows="3"
          name="notes"
          value={data.notes}
          onChange={onChange}
          placeholder="Optional notes"
        />
      </label>
    </div>
  );
}

function CustomerPhotoField({
  photo,
  onChange,
}) {
  return (
    <div className="customer-photo-tab-content">
      <div className="customer-photo-tab-copy">
        <h3>Customer Photo</h3>

        <p>
          Optional visual reference for
          this Customer Master record.
        </p>
      </div>

      {photo ? (
        <div className="customer-photo-preview customer-photo-preview--large">
          <img
            src={photo}
            alt="Customer preview"
          />
        </div>
      ) : (
        <div className="customer-photo-empty">
          No Photo
        </div>
      )}

      <label className="customer-file-input">
        <input
          type="file"
          accept="image/*"
          onChange={onChange}
        />

        <span>
          {photo
            ? "Change Customer Photo"
            : "Choose Customer Photo"}
        </span>
      </label>
    </div>
  );
}

function CustomerDetail({
  customer,
}) {
  if (!customer) {
    return null;
  }

  return (
    <>
      {customer.photo ? (
        <div className="customer-detail-photo">
          <img
            src={customer.photo}
            alt={
              customer.displayName
            }
          />
        </div>
      ) : (
        <div className="customer-detail-photo customer-detail-photo--empty">
          No Photo
        </div>
      )}

      <div className="customer-detail-card">
        <div className="customer-detail-grid">
          <DetailField
            label="Customer ID"
            value={
              customer.customerId
            }
          />

          <DetailField
            label="Status"
            value={customer.status}
            status
          />

          <DetailField
            full
            label="Display Name"
            value={
              customer.displayName
            }
          />

          <DetailField
            label="Customer Name"
            value={
              customer.customerName
            }
          />

          <DetailField
            label="Company"
            value={customer.company}
          />

          <DetailField
            label="Customer Type"
            value={
              customer.customerType
            }
          />

          <DetailField
            label="Mobile"
            value={customer.mobile}
          />

          <DetailField
            label="Email"
            value={customer.email}
          />

          <DetailField
            full
            label="Address"
            value={customer.address}
          />
        </div>
      </div>

      <div className="customer-detail-card">
        <div className="customer-detail-section-title">
          Notes
        </div>

        <div className="customer-detail-notes">
          {customer.notes ||
            "No notes."}
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={
        status === "Active"
          ? "customer-status customer-status--active"
          : "customer-status customer-status--inactive"
      }
    >
      {status || "—"}
    </span>
  );
}

function DetailField({
  label,
  value,
  full = false,
  status = false,
}) {
  return (
    <div
      className={
        full
          ? "customer-detail-field customer-detail-field--full"
          : "customer-detail-field"
      }
    >
      <span>{label}</span>

      <strong>
        {status ? (
          <StatusBadge
            status={value}
          />
        ) : (
          value || "—"
        )}
      </strong>
    </div>
  );
}