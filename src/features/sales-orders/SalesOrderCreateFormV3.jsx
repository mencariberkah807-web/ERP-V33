import { useMemo, useState } from "react";

import { customerStore } from "../../state/customerStore.js";
import { productStore } from "../../state/productStore.js";
import { categoryStore } from "../../state/categoryStore.js";
import { createSalesOrderFromForm, updateSalesOrderFromForm } from "./services/salesOrderService.js";

const TODAY = new Date().toISOString().split("T")[0];
const PRIORITIES = ["Regular", "Same Day", "Instant"];
const MARKETPLACES = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada", "Blibli", "Other"];

function createItem(source = null) {
  return source
    ? {
        id: source.soItemId,
        soItemId: source.soItemId,
        productId: source.productId ?? "",
        quantity: source.quantity ?? 1,
        unitPrice: source.unitPrice ?? "",
        discount: source.discount ?? "",
        notes: source.productionNotes ?? "",
        customRequest: Boolean(source.customRequest),
        attachment: null,
        artwork: source.artwork ?? null,
        status: source.status ?? "ACTIVE",
      }
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

export default function SalesOrderCreateFormV3({ onCancel, onCreated, onSaved, initialOrder = null }) {
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
    if (!cleanName) {
      setCategoryError("Category Name is required.");
      return;
    }

    const allCategories = categoryStore.getCategories();
    const duplicate = allCategories.find((category) => category.categoryName?.trim().toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      setCategoryError("Category already exists.");
      return;
    }

    const newCategory = {
      categoryId: nextCategoryId(allCategories),
      categoryName: cleanName,
      status: "Active",
    };
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

    const product = {
      productId: nextProductId(productStore.getProducts()),
      sku,
      productName,
      categoryId: newProduct.categoryId,
      unit,
      costPrice: 0,
      sellingPrice: Number(newProduct.sellingPrice || 0),
      status: "Active",
      material: newProduct.material.trim(),
      specification: newProduct.specification.trim(),
      color: newProduct.color.trim(),
      thickness: newProduct.thickness,
      length: newProduct.length,
      width: newProduct.width,
      height: newProduct.height,
      description: newProduct.description.trim(),
      image: newProduct.image,
    };

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
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { orderType, orderDate, deadline, priority, customer: selectedCustomer, marketplace, marketplaceCustomer, trackingNumber, items, amountPaid, paymentMethod, paymentReference };
      const order = isEditing ? updateSalesOrderFromForm(initialOrder.id, payload) : createSalesOrderFromForm(payload);
      if (isEditing) onSaved?.(order);
      else onCreated?.(order);
    } catch (saveError) {
      setError(saveError?.message || "Sales Order gagal disimpan.");
      setSaving(false);
    }
  }

  return (
    <form className="sales-order-create-v3" onSubmit={handleSubmit}>
      <header className="sales-order-header"><div><h1>{isEditing ? "Edit Sales Order" : "New Sales Order"}</h1><p>{isEditing ? `Update ${initialOrder.soNumber} before Production starts` : "Create a new sales order"}</p></div></header>
      {error && <div className="sales-order-error">{error}</div>}

      <section className="ui-card">
        <div className="sales-order-card-header">Order Type</div>
        <div className="sales-order-card-body sales-order-radio-row">
          <label className="sales-order-radio"><input type="radio" name="orderType" value="DIRECT" checked={orderType === "DIRECT"} disabled={isEditing} onChange={() => setOrderType("DIRECT")} />Direct Order</label>
          <label className="sales-order-radio"><input type="radio" name="orderType" value="MARKETPLACE" checked={orderType === "MARKETPLACE"} disabled={isEditing} onChange={() => setOrderType("MARKETPLACE")} />Marketplace</label>
          {isEditing && <span className="sales-order-edit-note">Order Type cannot be changed during edit.</span>}
        </div>
      </section>

      <div className="sales-order-two-column">
        <section className="ui-card">
          <div className="sales-order-card-header">Order Information</div>
          <div className="sales-order-card-body sales-order-grid-2">
            <Field label="SO Number"><input className="ui-input" value={initialOrder?.soNumber ?? "Generated by system"} readOnly /></Field>
            <Field label="Order Date"><input className="ui-input" type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} /></Field>
            <Field label="Deadline"><input className="ui-input" type="date" min={orderDate} value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
            <Field label="Priority"><select className="ui-input" value={priority} onChange={(event) => setPriority(event.target.value)}>{PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
          </div>
        </section>

        {orderType === "DIRECT" ? (
          <section className="ui-card">
            <div className="sales-order-card-header">Customer Information</div>
            <div className="sales-order-card-body">
              <Field label="Customer"><select className="ui-input" value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">Select Customer...</option>{customers.map((customer) => <option key={customer.customerId} value={customer.customerId}>{customer.displayName || customer.customerName}</option>)}</select></Field>
              <div className="sales-order-grid-2 sales-order-margin-top"><Field label="Mobile"><input className="ui-input" value={selectedCustomer?.mobile || ""} readOnly /></Field><Field label="Email"><input className="ui-input" value={selectedCustomer?.email || ""} readOnly /></Field></div>
              <Field label="Address" className="sales-order-margin-top"><textarea className="sales-order-textarea" rows="2" value={selectedCustomer?.address || ""} readOnly /></Field>
            </div>
          </section>
        ) : (
          <section className="ui-card">
            <div className="sales-order-card-header">Marketplace Information</div>
            <div className="sales-order-card-body">
              <Field label="Marketplace Channel"><select className="ui-input" value={marketplace} onChange={(event) => setMarketplace(event.target.value)}><option value="">Select Marketplace...</option>{MARKETPLACES.map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
              <Field label="Customer" className="sales-order-margin-top"><input className="ui-input" value={marketplaceCustomer} onChange={(event) => setMarketplaceCustomer(event.target.value)} placeholder="Customer name" /></Field>
              <Field label="No. Resi" className="sales-order-margin-top"><input className="ui-input" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Tracking number" /></Field>
              <div className="sales-order-payment-info sales-order-margin-top"><div className="sales-order-payment-info-row"><span>Payment Status</span><strong>PAID</strong></div><div className="sales-order-payment-info-row"><span>Payment Type</span><strong>Automatic</strong></div></div>
            </div>
          </section>
        )}
      </div>

      <section className="ui-card">
        <div className="sales-order-card-header sales-order-card-header-between"><span>Order Items</span><button type="button" className="sales-order-small-button ui-button-primary" onClick={() => setItems((current) => [...current, createItem()])}>+ Add Item</button></div>
        <div className="sales-order-card-body sales-order-items">
          {items.map((item) => (
            <div className={`sales-order-item ${item.status === "INACTIVE" ? "sales-order-item-inactive" : ""}`} key={item.id}>
              <div className="sales-order-item-main">
                <div className="sales-order-grid-2">
                  <Field label="Product"><div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><select className="ui-input" style={{ flex: 1 }} value={item.productId} disabled={item.status === "INACTIVE"} onChange={(event) => handleProductChange(item.id, event.target.value)}><option value="">Select Product...</option>{products.map((product) => <option key={product.productId} value={product.productId}>{product.productName} {product.sku ? `(${product.sku})` : ""}</option>)}</select><button type="button" className="sales-order-small-button ui-button-primary" disabled={item.status === "INACTIVE"} onClick={() => openAddProduct(item.id)}>+ Add Product</button></div></Field>
                  <div className="sales-order-grid-3"><Field label="Quantity"><input className="ui-input" type="number" min="1" disabled={item.status === "INACTIVE"} value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></Field><Field label="Unit Price"><input className="ui-input" type="number" min="0" disabled={item.status === "INACTIVE"} value={item.unitPrice} onChange={(event) => updateItem(item.id, "unitPrice", event.target.value)} /></Field><Field label="Discount"><input className="ui-input" type="number" min="0" disabled={item.status === "INACTIVE"} value={item.discount} onChange={(event) => updateItem(item.id, "discount", event.target.value)} /></Field></div>
                </div>
                <div className="sales-order-item-extra"><Field label="Production Notes / Special Request"><textarea className="sales-order-textarea" rows="2" disabled={item.status === "INACTIVE"} value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} /></Field><Field label="Artwork"><input className="sales-order-file" type="file" disabled={item.status === "INACTIVE"} onChange={(event) => updateItem(item.id, "attachment", event.target.files?.[0] || null)} />{item.artwork?.name && <span className="sales-order-file-name">Current: {item.artwork.name}</span>}</Field></div>
                <label className="sales-order-checkbox"><input type="checkbox" disabled={item.status === "INACTIVE"} checked={item.customRequest} onChange={(event) => updateItem(item.id, "customRequest", event.target.checked)} />Custom / Special Request</label>
              </div>
              <div className="sales-order-item-total"><Field label="Item Total"><input className="ui-input" value={formatIDR(itemTotal(item))} readOnly /></Field>{items.length > 1 && item.status !== "INACTIVE" && <button type="button" className="sales-order-remove-button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>Remove Item</button>}</div>
            </div>
          ))}
        </div>
      </section>

      {!isEditing && orderType === "DIRECT" && <section className="ui-card"><div className="sales-order-card-header">Payment</div><div className="sales-order-card-body"><div className="sales-order-grid-3"><Field label="Grand Total"><input className="ui-input" value={formatIDR(grandTotal)} readOnly /></Field><Field label="Amount Paid"><input className="ui-input" type="number" min="0" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} /></Field><Field label="Balance"><input className="ui-input" value={formatIDR(balance)} readOnly /></Field></div><div className="sales-order-payment-method sales-order-margin-top"><strong>Payment Method</strong>{["Cash", "Transfer", "QRIS"].map((value) => <label className="sales-order-payment-radio" key={value}><input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />{value}</label>)}<input className="ui-input sales-order-payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Payment reference" /></div></div></section>}
      {isEditing && <section className="ui-card"><div className="sales-order-card-header">Payment</div><div className="sales-order-card-body"><div className="sales-order-payment-auto-note">Payment history is preserved and is not edited from Sales Order. Use the Payment domain for payment transactions.</div></div></section>}

      <footer className="sales-order-footer"><button type="button" className="sales-order-secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="ui-button-primary" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : orderType === "MARKETPLACE" ? "Create WO" : "Create Order"}</button></footer>

      {addProductOpen && (
        <div role="dialog" aria-modal="true" aria-label="Add Product" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div className="ui-card" style={{ width: "min(760px, 100%)", maxHeight: "90vh", overflow: "auto", margin: 0 }}>
            <div className="sales-order-card-header sales-order-card-header-between"><span>Add Product</span><button type="button" className="sales-order-secondary-button" onClick={() => setAddProductOpen(false)}>Close</button></div>
            <div className="sales-order-card-body">
              {productError && <div className="sales-order-error">{productError}</div>}
              <div className="sales-order-grid-2">
                <Field label="SKU"><input className="ui-input" value={newProduct.sku} onChange={(event) => updateNewProduct("sku", event.target.value)} autoFocus /></Field>
                <Field label="Product Name"><input className="ui-input" value={newProduct.productName} onChange={(event) => updateNewProduct("productName", event.target.value)} /></Field>
                <Field label="Category"><div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><select className="ui-input" style={{ flex: 1 }} value={newProduct.categoryId} onChange={(event) => updateNewProduct("categoryId", event.target.value)}><option value="">Select Category...</option>{categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>)}</select><button type="button" className="sales-order-small-button ui-button-primary" onClick={openAddCategory}>+ Add Category</button></div></Field>
                <Field label="Unit"><input className="ui-input" value={newProduct.unit} onChange={(event) => updateNewProduct("unit", event.target.value)} /></Field>
                <Field label="Standard Price"><input className="ui-input" type="number" min="0" value={newProduct.sellingPrice} onChange={(event) => updateNewProduct("sellingPrice", event.target.value)} /></Field>
                <Field label="Material"><input className="ui-input" value={newProduct.material} onChange={(event) => updateNewProduct("material", event.target.value)} /></Field>
                <Field label="Specification"><input className="ui-input" value={newProduct.specification} onChange={(event) => updateNewProduct("specification", event.target.value)} /></Field>
                <Field label="Color"><input className="ui-input" value={newProduct.color} onChange={(event) => updateNewProduct("color", event.target.value)} /></Field>
                <Field label="Thickness"><input className="ui-input" value={newProduct.thickness} onChange={(event) => updateNewProduct("thickness", event.target.value)} /></Field>
                <Field label="Length"><input className="ui-input" value={newProduct.length} onChange={(event) => updateNewProduct("length", event.target.value)} /></Field>
                <Field label="Width"><input className="ui-input" value={newProduct.width} onChange={(event) => updateNewProduct("width", event.target.value)} /></Field>
                <Field label="Height"><input className="ui-input" value={newProduct.height} onChange={(event) => updateNewProduct("height", event.target.value)} /></Field>
              </div>
              <Field label="Description" className="sales-order-margin-top"><textarea className="sales-order-textarea" rows="3" value={newProduct.description} onChange={(event) => updateNewProduct("description", event.target.value)} /></Field>
            </div>
            <footer className="sales-order-footer"><button type="button" className="sales-order-secondary-button" onClick={() => setAddProductOpen(false)}>Cancel</button><button type="button" className="ui-button-primary" onClick={saveNewProduct}>Save Product</button></footer>
          </div>
        </div>
      )}

      {addCategoryOpen && (
        <div role="dialog" aria-modal="true" aria-label="Add Category" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 24 }}>
          <div className="ui-card" style={{ width: "min(460px, 100%)", margin: 0 }}>
            <div className="sales-order-card-header sales-order-card-header-between"><span>Add Category</span><button type="button" className="sales-order-secondary-button" onClick={closeAddCategory}>Close</button></div>
            <div className="sales-order-card-body">
              {categoryError && <div className="sales-order-error">{categoryError}</div>}
              <Field label="Category Name"><input className="ui-input" value={newCategoryName} onChange={(event) => { setNewCategoryName(event.target.value); setCategoryError(""); }} autoFocus onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveNewCategory(); } }} /></Field>
            </div>
            <footer className="sales-order-footer"><button type="button" className="sales-order-secondary-button" onClick={closeAddCategory}>Cancel</button><button type="button" className="ui-button-primary" onClick={saveNewCategory}>Save Category</button></footer>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({ label, children, className = "" }) {
  return <div className={`sales-order-field ${className}`.trim()}><label>{label}</label>{children}</div>;
}
