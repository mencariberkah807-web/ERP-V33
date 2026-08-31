import { useState } from "react";

import { customerStore } from "../../state/customerStore.js";

import { productStore } from "../../state/productStore.js";

import { categoryStore } from "../../state/categoryStore.js";

import CustomerForm, {
  createEmptyCustomerForm,
  buildCustomerDisplayName,
} from "../customers/components/CustomerForm.jsx";

import ProductForm, {
  createEmptyProductForm,
  buildProductDimension,
} from "../products/components/ProductForm.jsx";

import "./salesOrder.css";

const TODAY = new Date().toISOString().split("T")[0];

const PRIORITIES = ["Regular", "Same Day", "Instant"];

const MARKETPLACES = [
  "Shopee",
  "Tokopedia",
  "TikTok Shop",
  "Lazada",
  "Blibli",
  "Other",
];

function createItem() {
  return {
    id: Date.now() + Math.random(),

    productId: "",

    quantity: 1,

    unitPrice: "",

    discount: "",

    notes: "",

    attachment: null,

    customRequest: false,
  };
}

function getCustomerLabel(customer) {
  return (
    customer?.displayName ||
    customer?.customerName ||
    customer?.company ||
    customer?.customerId ||
    "Unnamed Customer"
  );
}

function generateCustomerId(customers) {
  const numbers = customers
    .map((customer) => {
      const match = String(customer.customerId ?? "").match(/^CUST-(\d{5})$/);

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const lastNumber = numbers.length ? Math.max(...numbers) : 0;

  return `CUST-${String(lastNumber + 1).padStart(5, "0")}`;
}

function generateProductId(products) {
  const numbers = products
    .map((product) => {
      const match = String(product.productId ?? "").match(/^PRD-(\d{5})$/);

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const lastNumber = numbers.length ? Math.max(...numbers) : 0;

  return `PRD-${String(lastNumber + 1).padStart(5, "0")}`;
}

export default function NewSalesOrderForm({ onCancel }) {
  /*
   * =========================================================
   * MASTER DATA
   * =========================================================
   */

  const [customers, setCustomers] = useState(() =>
    customerStore.getActiveCustomers()
  );

  const [products, setProducts] = useState(() =>
    productStore.getActiveProducts()
  );

  const [categories] = useState(() => categoryStore.getCategories());

  /*
   * =========================================================
   * ORDER
   * =========================================================
   */

  const [orderType, setOrderType] = useState("DIRECT");

  const [orderDate, setOrderDate] = useState(TODAY);

  const [deadline, setDeadline] = useState("");

  const [priority, setPriority] = useState("Regular");

  /*
   * =========================================================
   * CUSTOMER
   * =========================================================
   */

  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [customer, setCustomer] = useState("");

  const [customerMobile, setCustomerMobile] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");

  const [customerAddress, setCustomerAddress] = useState("");

  /*
   * =========================================================
   * QUICK CREATE CUSTOMER
   * =========================================================
   */

  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [newCustomerData, setNewCustomerData] = useState(
    createEmptyCustomerForm
  );

  /*
   * =========================================================
   * QUICK CREATE PRODUCT
   * =========================================================
   */

  const [showProductForm, setShowProductForm] = useState(false);

  const [activeProductItemId, setActiveProductItemId] = useState(null);

  const [newProductData, setNewProductData] = useState(createEmptyProductForm);

  /*
   * =========================================================
   * MARKETPLACE
   * =========================================================
   */

  const [marketplace, setMarketplace] = useState("");

  const [marketplaceCustomer, setMarketplaceCustomer] = useState("");

  const [trackingNumber, setTrackingNumber] = useState("");

  /*
   * =========================================================
   * ORDER ITEMS
   * =========================================================
   */

  const [items, setItems] = useState([createItem()]);

  /*
   * =========================================================
   * PAYMENT
   * =========================================================
   */

  const [paymentAdded, setPaymentAdded] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [amountPaid, setAmountPaid] = useState("");

  const [paymentReference, setPaymentReference] = useState("");

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  const [error, setError] = useState("");

  const [showPreview, setShowPreview] = useState(false);

  /*
   * =========================================================
   * CUSTOMER SELECTOR
   * =========================================================
   */

  function handleCustomerChange(event) {
    const customerId = event.target.value;

    setSelectedCustomerId(customerId);

    const selected = customers.find(
      (item) => String(item.customerId) === String(customerId)
    );

    if (!selected) {
      setCustomer("");
      setCustomerMobile("");
      setCustomerEmail("");
      setCustomerAddress("");

      return;
    }

    setCustomer(getCustomerLabel(selected));

    setCustomerMobile(selected.mobile || "");

    setCustomerEmail(selected.email || "");

    setCustomerAddress(selected.address || "");

    setError("");
  }

  /*
   * =========================================================
   * QUICK CREATE CUSTOMER
   * =========================================================
   */

  function handleAddCustomer() {
    setNewCustomerData(createEmptyCustomerForm());

    setShowCustomerForm(true);

    setError("");
  }

  function handleNewCustomerChange(event) {
    const { name, value } = event.target;

    setNewCustomerData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function handleCreateCustomer(event) {
    event.preventDefault();

    const customerName = newCustomerData.customerName.trim();

    if (!customerName) {
      setError("Customer Name is required.");

      return;
    }

    if (!newCustomerData.customerType) {
      setError("Please select Customer Type.");

      return;
    }

    const displayName = buildCustomerDisplayName(
      newCustomerData.customerName,
      newCustomerData.company
    );

    const existing = customerStore.getCustomers();

    const duplicate = existing.find(
      (item) =>
        String(item.displayName ?? "")
          .trim()
          .toLowerCase() === displayName.trim().toLowerCase()
    );

    if (duplicate) {
      setError("Display Name already exists.");

      return;
    }

    const newCustomer = {
      customerId: generateCustomerId(existing),

      customerName,

      company: newCustomerData.company.trim(),

      displayName,

      customerType: newCustomerData.customerType,

      mobile: newCustomerData.mobile.trim(),

      email: newCustomerData.email.trim(),

      address: newCustomerData.address.trim(),

      status: "Active",

      notes: newCustomerData.notes.trim(),

      photo: "",
    };

    const next = [...existing, newCustomer];

    customerStore.replaceCustomers(next);

    setCustomers(customerStore.getActiveCustomers());

    setSelectedCustomerId(newCustomer.customerId);

    setCustomer(newCustomer.displayName);

    setCustomerMobile(newCustomer.mobile);

    setCustomerEmail(newCustomer.email);

    setCustomerAddress(newCustomer.address);

    setNewCustomerData(createEmptyCustomerForm());

    setShowCustomerForm(false);

    setError("");
  }

  /*
   * =========================================================
   * PRODUCT SELECTOR
   * =========================================================
   */

  function handleProductChange(itemId, productId) {
    const selected = products.find(
      (product) => String(product.productId) === String(productId)
    );

    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,

          productId,

          unitPrice: selected ? selected.sellingPrice : item.unitPrice,
        };
      })
    );

    setError("");
  }

  /*
   * =========================================================
   * QUICK CREATE PRODUCT
   * =========================================================
   */

  function handleAddProduct(itemId) {
    setActiveProductItemId(itemId);

    setNewProductData(createEmptyProductForm());

    setShowProductForm(true);

    setError("");
  }

  function handleNewProductChange(event) {
    const { name, value } = event.target;

    setNewProductData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function validateNewProduct() {
    if (!newProductData.sku.trim()) {
      return "SKU is required.";
    }

    if (!newProductData.productName.trim()) {
      return "Product Name is required.";
    }

    if (!newProductData.categoryId) {
      return "Category is required.";
    }

    if (!newProductData.unit.trim()) {
      return "Unit is required.";
    }

    if (Number(newProductData.costPrice || 0) < 0) {
      return "Cost Price cannot be negative.";
    }

    if (Number(newProductData.sellingPrice || 0) < 0) {
      return "Selling Price cannot be negative.";
    }

    const existing = productStore.getProducts();

    const duplicate = existing.find(
      (product) =>
        product.sku?.trim().toLowerCase() ===
          newProductData.sku.trim().toLowerCase() ||
        product.productName?.trim().toLowerCase() ===
          newProductData.productName.trim().toLowerCase()
    );

    if (duplicate) {
      return "SKU or Product Name already exists.";
    }

    return "";
  }

  function handleCreateProduct(event) {
    event.preventDefault();

    const validationError = validateNewProduct();

    if (validationError) {
      setError(validationError);

      return;
    }

    const existing = productStore.getProducts();

    const newProduct = {
      productId: generateProductId(existing),

      sku: newProductData.sku.trim(),

      productName: newProductData.productName.trim(),

      categoryId: newProductData.categoryId,

      unit: newProductData.unit.trim(),

      costPrice: Number(newProductData.costPrice || 0),

      sellingPrice: Number(newProductData.sellingPrice || 0),

      status: "Active",

      material: newProductData.material.trim(),

      specification: newProductData.specification.trim(),

      color: newProductData.color.trim(),

      thickness: newProductData.thickness,

      length: newProductData.length,

      width: newProductData.width,

      height: newProductData.height,

      description: newProductData.description.trim(),

      image: newProductData.image,
    };

    const next = [...existing, newProduct];

    productStore.replaceProducts(next);

    setProducts(productStore.getActiveProducts());

    /*
     * Automatically select the
     * newly-created product.
     */
    if (activeProductItemId) {
      setItems((current) =>
        current.map((item) =>
          item.id === activeProductItemId
            ? {
                ...item,

                productId: newProduct.productId,

                unitPrice: newProduct.sellingPrice,
              }
            : item
        )
      );
    }

    setNewProductData(createEmptyProductForm());

    setActiveProductItemId(null);

    setShowProductForm(false);

    setError("");
  }

  /*
   * =========================================================
   * ITEM
   * =========================================================
   */

  function updateItem(id, field, value) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((current) => [...current, createItem()]);
  }

  function removeItem(id) {
    setItems((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((item) => item.id !== id);
    });
  }

  function handleAttachment(id, event) {
    const file = event.target.files?.[0] || null;

    updateItem(id, "attachment", file);
  }

  /*
   * =========================================================
   * DATE
   * =========================================================
   */

  function handleDeadlineChange(event) {
    const value = event.target.value;

    if (orderDate && value < orderDate) {
      setError("Deadline tidak boleh sebelum Order Date.");

      return;
    }

    setDeadline(value);

    setError("");
  }

  /*
   * =========================================================
   * CALCULATION
   * =========================================================
   */

  function calculateItemTotal(item) {
    const quantity = Number(item.quantity) || 0;

    const unitPrice = Number(item.unitPrice) || 0;

    const discount = Number(item.discount) || 0;

    return Math.max(0, quantity * unitPrice - discount);
  }

  function calculateGrandTotal() {
    return items.reduce((total, item) => total + calculateItemTotal(item), 0);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  /*
   * =========================================================
   * PAYMENT
   * =========================================================
   */

  function handleAddPayment() {
    setPaymentAdded(true);
  }

  /*
   * =========================================================
   * PREVIEW
   * =========================================================
   */

  function handleCreateOrder() {
    setError("");

    if (!orderDate) {
      setError("Order Date wajib diisi.");

      return;
    }

    if (!deadline) {
      setError("Deadline wajib diisi.");

      return;
    }

    if (deadline < orderDate) {
      setError("Deadline tidak boleh sebelum Order Date.");

      return;
    }

    if (orderType === "DIRECT" && !selectedCustomerId) {
      setError("Customer wajib dipilih.");

      return;
    }

    if (orderType === "MARKETPLACE" && !marketplace) {
      setError("Marketplace wajib dipilih.");

      return;
    }

    const invalidItem = items.some((item) => !item.productId);

    if (invalidItem) {
      setError("Product wajib dipilih dari Product Master.");

      return;
    }

    setShowPreview(true);
  }

  /*
   * =========================================================
   * PREVIEW DATA
   * =========================================================
   */

  function getPreviewData() {
    return {
      orderType,

      orderDate,

      deadline,

      priority,

      customer,

      mobile: customerMobile,

      email: customerEmail,

      address: customerAddress,

      marketplace,

      marketplaceCustomer,

      trackingNumber,

      items: items.map((item) => {
        const product = products.find(
          (product) => String(product.productId) === String(item.productId)
        );

        return {
          ...item,

          productName: product?.productName || "Unknown Product",

          sku: product?.sku || "—",

          material: product?.material || "—",

          categoryId: product?.categoryId || "—",

          thickness: product?.thickness || "—",

          dimension: buildProductDimension(product),

          color: product?.color || "—",

          specification: product?.specification || "—",
        };
      }),

      grandTotal: calculateGrandTotal(),

      amountPaid: Number(amountPaid) || 0,

      paymentMethod,

      paymentReference,
    };
  }

  return (
    <div className="sales-order-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sales-order-header">
        <h1>New Sales Order</h1>

        <p>Create a new sales order</p>
      </header>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && <div className="sales-order-error">{error}</div>}

      {/* =====================================================
          ORDER TYPE
          ===================================================== */}

      <section className="ui-card">
        <div className="sales-order-card-header">Order Type</div>

        <div className="sales-order-card-body">
          <div className="sales-order-radio-row">
            <label className="sales-order-radio">
              <input
                type="radio"
                name="orderType"
                value="DIRECT"
                checked={orderType === "DIRECT"}
                onChange={(event) => setOrderType(event.target.value)}
              />

              <span>Direct Order</span>
            </label>

            <label className="sales-order-radio">
              <input
                type="radio"
                name="orderType"
                value="MARKETPLACE"
                checked={orderType === "MARKETPLACE"}
                onChange={(event) => setOrderType(event.target.value)}
              />

              <span>Marketplace</span>
            </label>
          </div>
        </div>
      </section>

      {/* =====================================================
          DIRECT
          ===================================================== */}

      {orderType === "DIRECT" && (
        <div className="sales-order-two-column">
          <section className="ui-card">
            <div className="sales-order-card-header">Order Information</div>

            <div className="sales-order-card-body">
              <div className="sales-order-grid-2">
                <div className="sales-order-field">
                  <label>SO Number</label>

                  <input
                    className="ui-input"
                    value="Generated by system"
                    readOnly
                  />
                </div>

                <div className="sales-order-field">
                  <label>Order Date</label>

                  <input
                    className="ui-input"
                    type="date"
                    value={orderDate}
                    onChange={(event) => {
                      const value = event.target.value;

                      setOrderDate(value);

                      if (deadline && value > deadline) {
                        setDeadline("");
                      }

                      setError("");
                    }}
                  />
                </div>

                <div className="sales-order-field">
                  <label>Deadline</label>

                  <input
                    className="ui-input"
                    type="date"
                    min={orderDate}
                    value={deadline}
                    onChange={handleDeadlineChange}
                  />
                </div>

                <div className="sales-order-field">
                  <label>Priority</label>

                  <div className="sales-order-priority-row">
                    {PRIORITIES.map((value) => (
                      <label className="sales-order-radio" key={value}>
                        <input
                          type="radio"
                          name="directPriority"
                          value={value}
                          checked={priority === value}
                          onChange={() => setPriority(value)}
                        />

                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="ui-card">
            <div className="sales-order-card-header sales-order-card-header-between">
              <span>Customer Information</span>

              <button
                type="button"
                className="sales-order-small-button ui-button-primary"
                onClick={handleAddCustomer}>
                + Add Customer
              </button>
            </div>

            <div className="sales-order-card-body">
              <div className="sales-order-field">
                <label>Customer</label>

                <select
                  className="ui-input"
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}>
                  <option value="">Select Customer...</option>

                  {customers.map((item) => (
                    <option key={item.customerId} value={item.customerId}>
                      {getCustomerLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sales-order-grid-2 sales-order-margin-top">
                <div className="sales-order-field">
                  <label>Mobile</label>

                  <input className="ui-input" value={customerMobile} readOnly />
                </div>

                <div className="sales-order-field">
                  <label>Email</label>

                  <input className="ui-input" value={customerEmail} readOnly />
                </div>
              </div>

              <div className="sales-order-field sales-order-margin-top">
                <label>Address</label>

                <textarea
                  className="sales-order-textarea"
                  rows="2"
                  value={customerAddress}
                  readOnly
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================
          MARKETPLACE
          ===================================================== */}

      {orderType === "MARKETPLACE" && (
        <>
          <div className="sales-order-two-column">
            <section className="ui-card">
              <div className="sales-order-card-header">Order Information</div>

              <div className="sales-order-card-body">
                <div className="sales-order-grid-2">
                  <div className="sales-order-field">
                    <label>SO Number</label>

                    <input
                      className="ui-input"
                      value="Generated by system"
                      readOnly
                    />
                  </div>

                  <div className="sales-order-field">
                    <label>Order Date</label>

                    <input
                      className="ui-input"
                      type="date"
                      value={orderDate}
                      onChange={(event) => setOrderDate(event.target.value)}
                    />
                  </div>

                  <div className="sales-order-field">
                    <label>Deadline</label>

                    <input
                      className="ui-input"
                      type="date"
                      min={orderDate}
                      value={deadline}
                      onChange={handleDeadlineChange}
                    />
                  </div>

                  <div className="sales-order-field">
                    <label>Priority</label>

                    <div className="sales-order-priority-row">
                      {PRIORITIES.map((value) => (
                        <label className="sales-order-radio" key={value}>
                          <input
                            type="radio"
                            name="marketplacePriority"
                            value={value}
                            checked={priority === value}
                            onChange={() => setPriority(value)}
                          />

                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="ui-card">
              <div className="sales-order-card-header">Payment Information</div>

              <div className="sales-order-card-body">
                <div className="sales-order-payment-info">
                  <div className="sales-order-payment-info-row">
                    <span>Payment Status</span>

                    <strong>PAID</strong>
                  </div>

                  <div className="sales-order-payment-info-row">
                    <span>Payment Method</span>

                    <strong>Transfer</strong>
                  </div>

                  <div className="sales-order-payment-info-row">
                    <span>Payment Type</span>

                    <strong>Automatic</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="ui-card">
            <div className="sales-order-card-header">
              Marketplace Information
            </div>

            <div className="sales-order-card-body">
              <div className="sales-order-marketplace-layout">
                <div>
                  <div className="sales-order-field">
                    <label>No. Resi</label>

                    <input
                      className="ui-input"
                      value={trackingNumber}
                      onChange={(event) =>
                        setTrackingNumber(event.target.value)
                      }
                      placeholder="Tracking number"
                    />
                  </div>

                  <div className="sales-order-field sales-order-margin-top">
                    <label>Customer</label>

                    <input
                      className="ui-input"
                      value={marketplaceCustomer}
                      onChange={(event) =>
                        setMarketplaceCustomer(event.target.value)
                      }
                      placeholder="Customer name"
                    />
                  </div>
                </div>

                <div className="sales-order-field">
                  <label>Marketplace Channel</label>

                  <div className="sales-order-radio-row sales-order-marketplace-channel-row">
                    {MARKETPLACES.map((value) => (
                      <label className="sales-order-radio" key={value}>
                        <input
                          type="radio"
                          name="marketplace"
                          value={value}
                          checked={marketplace === value}
                          onChange={(event) =>
                            setMarketplace(event.target.value)
                          }
                        />

                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* =====================================================
          ORDER ITEMS
          ===================================================== */}

      <section className="ui-card">
        <div className="sales-order-card-header sales-order-card-header-between">
          <span>Order Items</span>

          <button
            type="button"
            className="sales-order-small-button ui-button-primary"
            onClick={addItem}>
            + Add Item
          </button>
        </div>

        <div className="sales-order-card-body">
          {items.map((item) => {
            const selectedProduct = products.find(
              (product) => String(product.productId) === String(item.productId)
            );

            return (
              <div className="sales-order-item" key={item.id}>
                <div className="sales-order-item-main">
                  <div className="sales-order-item-product-row">
                    <div className="sales-order-field sales-order-product-selector">
                      <label>Product</label>

                      <select
                        className="ui-input"
                        value={item.productId}
                        onChange={(event) =>
                          handleProductChange(item.id, event.target.value)
                        }>
                        <option value="">Select Product...</option>

                        {products.map((product) => (
                          <option
                            key={product.productId}
                            value={product.productId}>
                            {product.productName}{" "}
                            {product.sku ? `(${product.sku})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      className="sales-order-small-button ui-button-primary sales-order-add-product-button"
                      onClick={() => handleAddProduct(item.id)}>
                      + Add Product
                    </button>
                  </div>

                  {selectedProduct && (
                    <div className="sales-order-product-info">
                      <div>
                        <small>SKU</small>

                        <strong>{selectedProduct.sku || "—"}</strong>
                      </div>

                      <div>
                        <small>Material</small>

                        <strong>{selectedProduct.material || "—"}</strong>
                      </div>

                      <div>
                        <small>Category</small>

                        <strong>
                          {categories.find(
                            (category) =>
                              category.categoryId === selectedProduct.categoryId
                          )?.name ||
                            categories.find(
                              (category) =>
                                category.categoryId ===
                                selectedProduct.categoryId
                            )?.categoryName ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Thickness</small>

                        <strong>{selectedProduct.thickness || "—"}</strong>
                      </div>

                      <div>
                        <small>Dimension</small>

                        <strong>
                          {buildProductDimension(selectedProduct)}
                        </strong>
                      </div>

                      <div>
                        <small>Color</small>

                        <strong>{selectedProduct.color || "—"}</strong>
                      </div>

                      <div>
                        <small>Specification</small>

                        <strong>{selectedProduct.specification || "—"}</strong>
                      </div>
                    </div>
                  )}

                  <div className="sales-order-grid-3 sales-order-margin-top">
                    <div className="sales-order-field">
                      <label>Quantity</label>

                      <input
                        className="ui-input"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, "quantity", event.target.value)
                        }
                      />
                    </div>

                    <div className="sales-order-field">
                      <label>Unit Price</label>

                      <input
                        className="ui-input"
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateItem(item.id, "unitPrice", event.target.value)
                        }
                      />
                    </div>

                    <div className="sales-order-field">
                      <label>Discount</label>

                      <input
                        className="ui-input"
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(event) =>
                          updateItem(item.id, "discount", event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="sales-order-item-extra">
                    <div className="sales-order-field">
                      {item.customRequest && (
                        <>
                          <div className="sales-order-field">
                            <label>Notes / Special Request</label>

                            <textarea
                              className="sales-order-textarea"
                              rows="2"
                              value={item.notes}
                              onChange={(event) =>
                                updateItem(item.id, "notes", event.target.value)
                              }
                              placeholder="Notes for this item..."
                            />
                          </div>

                          <div className="sales-order-field">
                            <label>Attachment</label>

                            <input
                              className="sales-order-file"
                              type="file"
                              onChange={(event) =>
                                handleAttachment(item.id, event)
                              }
                            />
                          </div>
                        </>
                      )}

                      <textarea
                        className="sales-order-textarea"
                        rows="2"
                        value={item.notes}
                        onChange={(event) =>
                          updateItem(item.id, "notes", event.target.value)
                        }
                        placeholder="Notes for this item..."
                      />
                    </div>

                    <div className="sales-order-field">
                      <label>Attachment</label>

                      <input
                        className="sales-order-file"
                        type="file"
                        onChange={(event) => handleAttachment(item.id, event)}
                      />

                      {item.attachment && (
                        <span className="sales-order-file-name">
                          {item.attachment.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sales-order-check-row">
                    <label className="sales-order-checkbox">
                      <input
                        type="checkbox"
                        checked={item.returnablePackaging}
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "returnablePackaging",
                            event.target.checked
                          )
                        }
                      />
                      Returnable packaging
                    </label>
                  </div>
                </div>

                <div className="sales-order-item-total">
                  <div className="sales-order-field">
                    <label>Total</label>

                    <input
                      className="ui-input"
                      value={formatCurrency(calculateItemTotal(item))}
                      readOnly
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="sales-order-remove-button"
                      onClick={() => removeItem(item.id)}>
                      Remove Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          DIRECT PAYMENT
          ===================================================== */}

      {orderType === "DIRECT" && (
        <section className="ui-card">
          <div className="sales-order-card-header sales-order-card-header-between">
            <span>Payment</span>

            <button
              type="button"
              className="sales-order-small-button ui-button-primary"
              onClick={handleAddPayment}>
              + Add Payment
            </button>
          </div>

          <div className="sales-order-card-body">
            <div className="sales-order-grid-3">
              <div className="sales-order-field">
                <label>Grand Total</label>

                <input
                  className="ui-input"
                  value={formatCurrency(calculateGrandTotal())}
                  readOnly
                />
              </div>

              <div className="sales-order-field">
                <label>Amount Paid</label>

                <input
                  className="ui-input"
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.target.value)}
                  readOnly={!paymentAdded}
                />
              </div>

              <div className="sales-order-field">
                <label>Balance</label>

                <input
                  className="ui-input"
                  value={formatCurrency(
                    Math.max(
                      0,
                      calculateGrandTotal() - (Number(amountPaid) || 0)
                    )
                  )}
                  readOnly
                />
              </div>
            </div>

            {paymentAdded && (
              <div className="sales-order-payment-method">
                <strong>Payment Method</strong>

                <label className="sales-order-payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={paymentMethod === "Cash"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  Cash
                </label>

                <label className="sales-order-payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Transfer"
                    checked={paymentMethod === "Transfer"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  Transfer
                </label>

                <label className="sales-order-payment-radio">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="QRIS"
                    checked={paymentMethod === "QRIS"}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  QRIS
                </label>

                <input
                  className="ui-input sales-order-payment-reference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Payment reference"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="sales-order-footer">
        <button
          type="button"
          className="sales-order-secondary-button"
          onClick={onCancel}>
          Cancel
        </button>

        <button
          type="button"
          className="ui-button-primary"
          onClick={handleCreateOrder}>
          {orderType === "MARKETPLACE" ? "Create WO" : "Create Order"}
        </button>
      </footer>

      {/* =====================================================
          CUSTOMER DRAWER
          ===================================================== */}

      {showCustomerForm && (
        <>
          <button
            type="button"
            className="customer-drawer-backdrop"
            onClick={() => setShowCustomerForm(false)}
            aria-label="Close Customer Form"
          />

          <aside className="customer-detail-drawer">
            <div className="customer-detail-header customer-detail-header--corporate">
              <div>
                <span className="customer-detail-eyebrow">New Customer</span>

                <h2>Create Customer</h2>

                <span className="customer-detail-id">
                  Customer ID generated automatically
                </span>
              </div>

              <button
                type="button"
                className="customer-detail-close customer-detail-close--corporate"
                onClick={() => setShowCustomerForm(false)}
                aria-label="Close">
                ×
              </button>
            </div>

            <form
              className="customer-drawer-form"
              onSubmit={handleCreateCustomer}>
              <div className="customer-detail-body">
                <div className="customer-form-card-modern">
                  <CustomerForm
                    data={newCustomerData}
                    onChange={handleNewCustomerChange}
                  />
                </div>
              </div>

              <div className="customer-detail-footer">
                <button
                  type="button"
                  className="customer-secondary-button"
                  onClick={() => setShowCustomerForm(false)}>
                  Cancel
                </button>

                <button type="submit" className="customer-primary-button">
                  Create Customer
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* =====================================================
          PRODUCT DRAWER
          ===================================================== */}

      {showProductForm && (
        <>
          <button
            type="button"
            className="product-drawer-backdrop"
            onClick={() => {
              setShowProductForm(false);

              setActiveProductItemId(null);
            }}
            aria-label="Close Product Form"
          />

          <aside className="product-detail-drawer">
            <div className="product-detail-header product-detail-header--corporate">
              <div>
                <span className="product-detail-eyebrow">New Product</span>

                <h2>Create Product</h2>

                <span className="product-detail-id">
                  Product ID generated automatically
                </span>
              </div>

              <button
                type="button"
                className="product-detail-close product-detail-close--corporate"
                onClick={() => {
                  setShowProductForm(false);

                  setActiveProductItemId(null);
                }}
                aria-label="Close">
                ×
              </button>
            </div>

            <form
              className="product-drawer-form"
              onSubmit={handleCreateProduct}>
              <div className="product-detail-body">
                <div className="product-form-card-modern">
                  <ProductForm
                    data={newProductData}
                    categories={categories}
                    onChange={handleNewProductChange}
                  />
                </div>
              </div>

              <div className="product-detail-footer">
                <button
                  type="button"
                  className="product-secondary-button"
                  onClick={() => {
                    setShowProductForm(false);

                    setActiveProductItemId(null);
                  }}>
                  Cancel
                </button>

                <button type="submit" className="product-primary-button">
                  Create Product
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {/* =====================================================
          PREVIEW
          ===================================================== */}

      {showPreview && (
        <div className="sales-order-preview-overlay">
          <div className="sales-order-preview-panel">
            <div className="sales-order-preview-header">
              <div>
                <span>Preview</span>

                <h2>Review Sales Order</h2>
              </div>

              <button type="button" onClick={() => setShowPreview(false)}>
                ×
              </button>
            </div>

            <div className="sales-order-preview-body">
              <div className="sales-order-preview-grid">
                <div>
                  <small>Order Type</small>

                  <strong>
                    {orderType === "DIRECT" ? "Direct Order" : "Marketplace"}
                  </strong>
                </div>

                <div>
                  <small>Order Date</small>

                  <strong>{orderDate}</strong>
                </div>

                <div>
                  <small>Deadline</small>

                  <strong>{deadline}</strong>
                </div>

                <div>
                  <small>Priority</small>

                  <strong>{priority}</strong>
                </div>
              </div>

              <div className="sales-order-preview-section">
                <h3>Customer</h3>

                <p>{customer || marketplaceCustomer || "—"}</p>
              </div>

              <div className="sales-order-preview-section">
                <h3>Order Items</h3>

                {items.map((item) => {
                  const product = products.find(
                    (product) =>
                      String(product.productId) === String(item.productId)
                  );

                  return (
                    <div className="sales-order-preview-item" key={item.id}>
                      <div>
                        <strong>{product?.productName || "—"}</strong>

                        <span>SKU: {product?.sku || "—"}</span>
                      </div>

                      <span>Qty: {item.quantity}</span>

                      <strong>
                        {formatCurrency(calculateItemTotal(item))}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="sales-order-preview-total">
                <span>Grand Total</span>

                <strong>{formatCurrency(calculateGrandTotal())}</strong>
              </div>
            </div>

            <div className="sales-order-preview-footer">
              <button
                type="button"
                className="sales-order-secondary-button"
                onClick={() => setShowPreview(false)}>
                Back to Edit
              </button>

              <button
                type="button"
                className="ui-button-primary"
                onClick={() => setShowPreview(false)}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
