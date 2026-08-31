const CUSTOMER_TYPES = ["Regular", "Corporate", "Reseller"];

export function createEmptyCustomerForm() {
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

export function buildCustomerDisplayName(customerName, company) {
  const cleanCustomerName = customerName.trim();

  const cleanCompany = company.trim();

  if (!cleanCustomerName) {
    return "";
  }

  if (!cleanCompany) {
    return cleanCustomerName;
  }

  return `${cleanCustomerName} - ${cleanCompany}`;
}

export default function CustomerForm({
  data,
  customerId = null,
  onChange,
  showStatus = false,
}) {
  const displayName = buildCustomerDisplayName(data.customerName, data.company);

  return (
    <div className="customer-form-grid">
      {customerId && (
        <label className="customer-field">
          <span>Customer ID</span>

          <input value={customerId} readOnly />
        </label>
      )}

      <label className="customer-field">
        <span>Customer Name *</span>

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
        <span>Customer Type *</span>

        <select
          name="customerType"
          value={data.customerType}
          onChange={onChange}>
          <option value="">Select Customer Type</option>

          {CUSTOMER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      {showStatus && (
        <label className="customer-field">
          <span>Status</span>

          <select
            name="status"
            value={data.status || "Active"}
            onChange={onChange}>
            <option value="Active">Active</option>

            <option value="Inactive">Inactive</option>
          </select>
        </label>
      )}

      <label className="customer-field">
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

      <label className="customer-field customer-field-full">
        <span>Address</span>

        <textarea
          rows="3"
          name="address"
          value={data.address}
          onChange={onChange}
          placeholder="Customer address"
        />
      </label>

      <label className="customer-field customer-field-full">
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
