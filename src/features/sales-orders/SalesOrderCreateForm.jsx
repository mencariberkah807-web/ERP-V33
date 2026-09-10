import { useMemo, useState } from "react";

import { customerStore } from "../../state/customerStore.js";
import { productStore } from "../../state/productStore.js";
import { categoryStore } from "../../state/categoryStore.js";
import { createSalesOrderFromForm, updateSalesOrderFromForm } from "./services/salesOrderService.js";
import "./salesOrderCreate.css";

const TODAY = new Date().toISOString().split("T")[0];
const PRIORITIES = ["Regular", "Same Day", "Instant"];
const MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Blibli", "Other"];

function createItem(source = null) {
  return source
    ? { id: source.soItemId, soItemId: source.soItemId, productId: source.productId ?? "", quantity: source.quantity ?? 1, unitPrice: source.unitPrice ?? "", discount: source.discount ?? "", notes: source.productionNotes ?? "", customRequest: Boolean(source.customRequest), attachment: null, artwork: source.artwork ?? null, status: source.status ?? "ACTIVE" }
    : { id: `${Date.now()}-${Math.random()}`, productId: "", quantity: 1, unitPrice: "", discount: "", notes: "", customRequest: false, attachment: null, artwork: null, status: "ACTIVE" };
}

function createEmptyProduct() {
  return { sku: "", productName: "", categoryId: "", unit: "pcs", sellingPrice: "", material: "", specification: "", color: "", thickness: "", length: "", width: "", height: "", description: "", image: "" };
}

function nextProductId(products) {
  const numbers = products.map((product) => Number(String(product.productId ?? "").match(/^PRD-(\d+)$/)?.[1] || 0));
  return `PRD-${String(Math.max(0, ...numbers) + 1).padStart(5, "0")}`;
}

function nextCategoryId(categories) {
  const numbers = categories.map((category) => Number(String(category.categoryId ?? "").match(/^CAT-(\d+)$/)?.[1] || 0));
  return `CAT-${String(Math.max(0, ...numbers) + 1).padStart(5, "0")}`;
}

function itemTotal(item) {
  const quantity = Math.max(Number(item.quantity) || 0, 0);
  const unitPrice = Math.max(Number(item.unitPrice) || 0, 0);
  const discount = Math.min(Math.max(Number(item.discount) || 0, 0), quantity * unitPrice);
  return Math.max(quantity * unitPrice - discount, 0);
}

function formatIDR(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function SalesOrderCreateForm({ onCancel, onCreated, onSaved, initialOrder = null }) {
  const isEditing = Boolean(initialOrder);
  const [customers] = useState(() => customerStore.getActiveCustomers());
  const [products, setProducts] = useState(() => productStore.getActiveProducts());
  const [categories, setCategories] = useState(() => categoryStore.getCategories().filter((category) => category.status === "Active"));
  const [orderType, setOrderType] = useState(initialOrder?.orderType ?? "DIRECT");
  const [orderDate, setOrderDate] = useState(initialOrder?.orderDate ?? TODAY);
  const [deadline, setDeadline] = useState(initialOrder?.deadline ?? "");
  const [priority, setPriority] = useState(initialOrder?.priority ?? "Regular");
  const [customerId, setCustomerId] = useState(initialOrder?.customer?.customerId ?? "");
  const [marketplace, setMarketplace] = useState(initialOrder?.marketplace?.channel ?? "");
  const [marketplaceCustomer, setMarketplaceCustomer] = useState(initialOrder?.marketplace?.customer ?? "");
  const [trackingNumber, setTrackingNumber] = useState(initialOrder?.marketplace?.trackingNumber ?? "");
  const [items, setItems] = useState(() => initialOrder?.items?.map(createItem) ?? [createItem()]);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(createEmptyProduct);
  const [productError, setProductError] = useState("");
  const [productTargetItemId, setProductTargetItemId] = useState(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const selectedCustomer = useMemo(() => customers.find((item) => item.customerId === customerId) ?? null, [customers, customerId]);
  const grandTotal = useMemo(() => items.filter((item) => item.status !== "INACTIVE").reduce((total, item) => total + itemTotal(item), 0), [items]);
  const balance = Math.max(grandTotal - (Number(amountPaid) || 0), 0);

  function updateItem(id, field, value) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setError("");
  }

  function handleProductChange(id, productId) {
    const product = products.find((item) => item.productId === productId);
    setItems((current) => current.map((item) => item.id === id ? { ...item, productId, unitPrice: product?.sellingPrice ?? item.unitPrice } : item));
    setError("");
  }

  function openAddProduct(itemId) {
    setProductTargetItemId(itemId);
    setNewProduct(createEmptyProduct());
    setProductError("");
    setAddProductOpen(true);
  }

  function updateNewProduct(field, value) {
    setNewProduct((current) => ({ ...current, [field]: value }));
    setProductError("");
  }

  function openAddCategory() {
    setNewCategoryName("");
    setCategoryError("");
    setAddCategoryOpen(true);
  }

  function closeAddCategory() {
    setAddCategoryOpen(false);
    setNewCategoryName("");
    setCategoryError("");
  }

  function saveNewCategory() {
    const cleanName = newCategoryName.trim();
    if (!cleanName) return setCategoryError("Category Name is required.");
    const allCategories = categoryStore.getCategories();
    const duplicate = allCategories.find((category) => category.categoryName?.trim().toLowerCase() === cleanName.toLowerCase());
    if (duplicate) return setCategoryError("Category already exists.");
    const newCategory = { categoryId: nextCategoryId(allCategories), categoryName: cleanName, status: "Active" };
    const nextCategories = [...allCategories, newCategory];
    categoryStore.replaceCategories(nextCategories);
    setCategories(nextCategories.filter((category) => category.status === "Active"));
    setNewProduct((current) => ({ ...current, categoryId: newCategory.categoryId }));
    closeAddCategory();
  }

  function saveNewProduct(event) {
    event.preventDefault();
    const sku = newProduct.sku.trim();
    const productName = newProduct.productName.trim();
    const unit = newProduct.unit.trim();
    if (!sku) return setProductError("SKU is required.");
    if (!productName) return setProductError("Product Name is required.");
    if (!newProduct.categoryId) return setProductError("Category is required.");
    if (!unit) return setProductError("Unit is required.");
    const duplicate = products.find((product) => product.sku?.trim().toLowerCase() === sku.toLowerCase() || product.productName?.trim().toLowerCase() === productName.toLowerCase());
    if (duplicate) return setProductError("SKU or Product Name already exists.");
    const product = { productId: nextProductId(productStore.getProducts()), sku, productName, categoryId: newProduct.categoryId, unit, costPrice: 0, sellingPrice: Number(newProduct.sellingPrice || 0), status: "Active", material: newProduct.material.trim(), specification: newProduct.specification.trim(), color: newProduct.color.trim(), thickness: newProduct.thickness, length: newProduct.length, width: newProduct.width, height: newProduct.height, description: newProduct.description.trim(), image: newProduct.image };
    const nextProducts = [...productStore.getProducts(), product];
    productStore.replaceProducts(nextProducts);
    setProducts(nextProducts.filter((entry) => entry.status === "Active"));
    if (productTargetItemId) handleProductChange(productTargetItemId, product.productId);
    setAddProductOpen(false);
    setProductTargetItemId(null);
  }

  function validate() {
    if (!orderDate) return "Order Date wajib diisi.";
    if (!deadline) return "Deadline wajib diisi.";
    if (deadline < orderDate) return "Deadline tidak boleh sebelum Order Date.";
    if (orderType === "DIRECT" && !selectedCustomer) return "Customer wajib dipilih.";
    if (orderType === "MARKETPLACE" && !marketplace) return "Marketplace wajib dipilih.";
    if (!items.length) return "Minimal 1 Order Item.";
    for (const item of items.filter((entry) => entry.status !== "INACTIVE")) {
      if (!item.productId) return "Semua Order Item wajib memiliki Product.";
      if (Number(item.quantity) < 1) return "Quantity minimal 1.";
      if (Number(item.unitPrice) < 0 || Number(item.discount) < 0) return "Unit Price dan Discount tidak boleh negatif.";
    }
    if (!isEditing && Number(amountPaid) < 0) return "Amount Paid tidak boleh negatif.";
    if (!isEditing && orderType === "DIRECT" && Number(amountPaid) > grandTotal) return "Amount Paid tidak boleh melebihi Grand Total.";
    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setSaving(true);
    setError("");
    try {
      const payload = { orderType, orderDate, deadline, priority, customer: selectedCustomer, marketplace, marketplaceCustomer, trackingNumber, items, amountPaid, paymentMethod, paymentReference };
      const order = isEditing ? updateSalesOrderFromForm(initialOrder.id, payload) : createSalesOrderFromForm(payload);
      if (isEditing) onSaved?.(order); else onCreated?.(order);
    } catch (saveError) {
      setError(saveError?.message || "Sales Order gagal disimpan.");
      setSaving(false);
    }
  }

  return (
    <form className="so-create" onSubmit={handleSubmit}>
      <header className="so-create-hero">
        <div><div className="so-create-eyebrow">SALES OPERATIONS</div><h1>{isEditing ? "Edit Sales Order" : "New Sales Order"}</h1><p>{isEditing ? `Update ${initialOrder.soNumber} before Production starts` : "Create a sales order and prepare it for the next operational step."}</p></div>
        <div className="so-create-hero-actions"><button type="button" className="so-btn so-btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="so-btn so-btn-primary" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : orderType === "MARKETPLACE" ? "Create WO" : "Create Order"}</button></div>
      </header>
      {error && <div className="so-alert" role="alert">{error}</div>}

      <section className="so-panel so-type-panel">
        <div><h2>How is this order coming in?</h2><p>Choose the sales channel before entering order details.</p></div>
        <div className="so-choice-group">
          <label className={`so-choice ${orderType === "DIRECT" ? "is-selected" : ""}`}><input type="radio" name="orderType" value="DIRECT" checked={orderType === "DIRECT"} disabled={isEditing} onChange={() => setOrderType("DIRECT")} /><span><strong>Direct Order</strong><small>Customer-managed order</small></span></label>
          <label className={`so-choice ${orderType === "MARKETPLACE" ? "is-selected" : ""}`}><input type="radio" name="orderType" value="MARKETPLACE" checked={orderType === "MARKETPLACE"} disabled={isEditing} onChange={() => setOrderType("MARKETPLACE")} /><span><strong>Marketplace</strong><small>Online channel order</small></span></label>
        </div>
      </section>

      <div className="so-grid so-grid-two">
        <section className="so-panel">
          <PanelHeading number="01" title="Order details" description="Basic information and delivery priority." />
          <div className="so-fields so-fields-two">
            <Field label="SO Number"><input className="so-input" value={initialOrder?.soNumber ?? "Generated by system"} readOnly /></Field>
            <Field label="Order Date"><input className="so-input" type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} /></Field>
            <Field label="Deadline"><input className="so-input" type="date" min={orderDate} value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
            <Field label="Priority"><select className="so-input" value={priority} onChange={(event) => setPriority(event.target.value)}>{PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
          </div>
        </section>

        {orderType === "DIRECT" ? (
          <section className="so-panel">
            <PanelHeading number="02" title="Customer" description="Select the customer for this order." />
            <div className="so-fields">
              <Field label="Customer"><select className="so-input" value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Select Customer...</option>{customers.map((customer) => <option key={customer.customerId} value={customer.customerId}>{customer.displayName || customer.customerName}</option>)}</select></Field>
              <div className="so-fields so-fields-two"><Field label="Mobile"><input className="so-input" value={selectedCustomer?.mobile || ""} readOnly placeholder="—" /></Field><Field label="Email"><input className="so-input" value={selectedCustomer?.email || ""} readOnly placeholder="—" /></Field></div>
              <Field label="Address"><textarea className="so-textarea" rows="3" value={selectedCustomer?.address || ""} readOnly placeholder="Customer address will appear here" /></Field>
            </div>
          </section>
        ) : (
          <section className="so-panel">
            <PanelHeading number="02" title="Marketplace" description="Capture the channel and order reference." />
            <div className="so-fields">
              <Field label="Marketplace Channel"><select className="so-input" value={marketplace} onChange={(event) => setMarketplace(event.target.value)}><option value="">Select Marketplace...</option>{MARKETPLACES.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
              <Field label="Customer"><input className="so-input" value={marketplaceCustomer} onChange={(event) => setMarketplaceCustomer(event.target.value)} placeholder="Customer name" /></Field>
              <Field label="No. Resi"><input className="so-input" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Tracking number" /></Field>
              <div className="so-info-row"><span>Payment status</span><strong>PAID</strong><span>Payment type</span><strong>Automatic</strong></div>
            </div>
          </section>
        )}
      </div>

      <section className="so-panel so-items-panel">
        <div className="so-panel-heading so-panel-heading-inline"><PanelHeading number="03" title="Order items" description="Add every product included in this order." /><button type="button" className="so-btn so-btn-primary" onClick={() => setItems((current) => [...current, createItem()])}>+ Add item</button></div>
        <div className="so-items">
          {items.map((item, index) => (
            <article className={`so-item ${item.status === "INACTIVE" ? "is-inactive" : ""}`} key={item.id}>
              <div className="so-item-top"><div className="so-item-number">ITEM {String(index + 1).padStart(2, "0")}</div>{items.length > 1 && item.status !== "INACTIVE" && <button type="button" className="so-link-danger" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button>}</div>
              <div className="so-fields so-item-main-grid">
                <Field label="Product"><div className="so-input-action"><select className="so-input" value={item.productId} disabled={item.status === "INACTIVE"} onChange={(event) => handleProductChange(item.id, event.target.value)}><option value="">Select Product...</option>{products.map((product) => <option key={product.productId} value={product.productId}>{product.productName} {product.sku ? `(${product.sku})` : ""}</option>)}</select><button type="button" className="so-btn so-btn-secondary" disabled={item.status === "INACTIVE"} onClick={() => openAddProduct(item.id)}>+ Product</button></div></Field>
                <Field label="Quantity"><input className="so-input" type="number" min="1" disabled={item.status === "INACTIVE"} value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></Field>
                <Field label="Unit Price"><input className="so-input" type="number" min="0" disabled={item.status === "INACTIVE"} value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} /></Field>
                <Field label="Discount"><input className="so-input" type="number" min="0" disabled={item.status === "INACTIVE"} value={item.discount} onChange={(event) => updateItem(item.id, "discount", event.target.value)} /></Field>
                <Field label="Item Total" hint="Calculated"><div className="so-total-field">{formatIDR(itemTotal(item))}</div></Field>
              </div>
              <div className="so-item-bottom">
                <Field label="Production notes / special request"><textarea className="so-textarea" rows="3" disabled={item.status === "INACTIVE"} value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} placeholder="Add instructions for production if needed..." /></Field>
                <Field label="Artwork"><input className="so-file" type="file" disabled={item.status === "INACTIVE"} onChange={(event) => updateItem(item.id, "attachment", event.target.files?.[0] || null)} />{item.artwork?.name && <span className="so-helper">Current: {item.artwork.name}</span>}</Field>
              </div>
              <label className="so-check"><input type="checkbox" disabled={item.status === "INACTIVE"} checked={item.customRequest} onChange={(event) => updateItem(item.id, "customRequest", event.target.checked)} /><span>Custom / Special Request</span></label>
            </article>
          ))}
        </div>
      </section>

      <section className="so-panel so-payment-panel">
        <PanelHeading number="04" title="Payment" description={isEditing ? "Payment history is preserved in the Payment domain." : "Record the initial payment for this order."} />
        {!isEditing ? <>
          <div className="so-summary-grid"><Summary label="Grand Total" value={formatIDR(grandTotal)} emphasis /><Field label="Amount Paid"><input className="so-input" type="number" min="0" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} /></Field><Summary label="Balance" value={formatIDR(balance)} /></div>
          <div className="so-payment-controls"><div><div className="so-field-label">Payment method</div><div className="so-radio-list">{["Cash", "Transfer", "QRIS"].map((value) => <label key={value} className={`so-radio ${paymentMethod === value ? "is-selected" : ""}`}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} /><span>{value}</span></label>)}</div></div><Field label="Payment reference"><input className="so-input" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional reference" /></Field></div>
        </> : <div className="so-preserved">Payment history is preserved and is not edited from Sales Order. Use the Payment domain for payment transactions.</div>}
      </section>

      <footer className="so-create-footer"><span>Review the order details before submitting.</span><div className="so-create-hero-actions"><button type="button" className="so-btn so-btn-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="so-btn so-btn-primary" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : orderType === "MARKETPLACE" ? "Create WO" : "Create Order"}</button></div></footer>

      {addProductOpen && <Modal title="Add Product" onClose={() => setAddProductOpen(false)}>
        {productError && <div className="so-alert">{productError}</div>}
        <div className="so-fields so-fields-two">
          <Field label="SKU"><input className="so-input" value={newProduct.sku} onChange={(event) => updateNewProduct("sku", event.target.value)} autoFocus /></Field>
          <Field label="Product Name"><input className="so-input" value={newProduct.productName} onChange={(event) => updateNewProduct("productName", event.target.value)} /></Field>
          <Field label="Category"><div className="so-input-action"><select className="so-input" value={newProduct.categoryId} onChange={(event) => updateNewProduct("categoryId", event.target.value)}><option value="">Select Category...</option>{categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select><button type="button" className="so-btn so-btn-secondary" onClick={openAddCategory}>+ Category</button></div></Field>
          <Field label="Unit"><input className="so-input" value={newProduct.unit} onChange={(event) => updateNewProduct("unit", event.target.value)} /></Field>
          <Field label="Standard Price"><input className="so-input" type="number" min="0" value={newProduct.sellingPrice} onChange={(event) => updateNewProduct("sellingPrice", event.target.value)} /></Field>
          <Field label="Material"><input className="so-input" value={newProduct.material} onChange={(event) => updateNewProduct("material", event.target.value)} /></Field>
          <Field label="Specification"><input className="so-input" value={newProduct.specification} onChange={(event) => updateNewProduct("specification", event.target.value)} /></Field>
          <Field label="Color"><input className="so-input" value={newProduct.color} onChange={(event) => updateNewProduct("color", event.target.value)} /></Field>
          <Field label="Thickness"><input className="so-input" value={newProduct.thickness} onChange={(event) => updateNewProduct("thickness", event.target.value)} /></Field>
          <Field label="Length"><input className="so-input" value={newProduct.length} onChange={(event) => updateNewProduct("length", event.target.value)} /></Field>
          <Field label="Width"><input className="so-input" value={newProduct.width} onChange={(event) => updateNewProduct("width", event.target.value)} /></Field>
          <Field label="Height"><input className="so-input" value={newProduct.height} onChange={(event) => updateNewProduct("height", event.target.value)} /></Field>
        </div>
        <Field label="Description"><textarea className="so-textarea" rows="4" value={newProduct.description} onChange={(event) => updateNewProduct("description", event.target.value)} /></Field>
        <div className="so-modal-actions"><button type="button" className="so-btn so-btn-secondary" onClick={() => setAddProductOpen(false)}>Cancel</button><button type="button" className="so-btn so-btn-primary" onClick={saveNewProduct}>Save Product</button></div>
      </Modal>}

      {addCategoryOpen && <Modal title="Add Category" onClose={closeAddCategory} compact>
        {categoryError && <div className="so-alert">{categoryError}</div>}
        <Field label="Category Name"><input className="so-input" value={newCategoryName} onChange={(event) => { setNewCategoryName(event.target.value); setCategoryError(""); }} autoFocus onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveNewCategory(); } }} /></Field>
        <div className="so-modal-actions"><button type="button" className="so-btn so-btn-secondary" onClick={closeAddCategory}>Cancel</button><button type="button" className="so-btn so-btn-primary" onClick={saveNewCategory}>Save Category</button></div>
      </Modal>}
    </form>
  );
}

function PanelHeading({ number, title, description }) {
  return <div className="so-panel-heading"><div className="so-section-number">{number}</div><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function Field({ label, children, hint = "" }) {
  return <div className="so-field"><div className="so-field-label"><span>{label}</span>{hint && <small>{hint}</small>}</div>{children}</div>;
}

function Summary({ label, value, emphasis = false }) {
  return <div className={`so-summary ${emphasis ? "is-emphasis" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Modal({ title, children, onClose, compact = false }) {
  return <div className="so-modal-backdrop" role="presentation"><div className={`so-modal ${compact ? "is-compact" : ""}`} role="dialog" aria-modal="true" aria-label={title}><header className="so-modal-header"><h2>{title}</h2><button type="button" className="so-modal-close" onClick={onClose} aria-label={`Close ${title}`}>×</button></header><div className="so-modal-body">{children}</div></div></div>;
}
