import {
  useMemo,
  useState,
} from "react";

import { productStore } from "../../state/productStore.js";
import { categoryStore } from "../../state/categoryStore.js";

import "./products.css";

const PRODUCT_TABS = [
  "information",
  "specification",
  "pricing",
  "media",
];

function createEmptyProductForm() {
  return {
    sku: "",
    productName: "",
    categoryId: "",
    unit: "",
    costPrice: "",
    sellingPrice: "",
    material: "",
    specification: "",
    color: "",
    thickness: "",
    length: "",
    width: "",
    height: "",
    description: "",
    image: "",
  };
}

function generateProductId(products) {
  const numbers = products
    .map((product) => {
      const match = String(
        product.productId ?? ""
      ).match(/^PRD-(\d{5})$/);

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((number) => number > 0);

  const lastNumber =
    numbers.length > 0
      ? Math.max(...numbers)
      : 0;

  return `PRD-${String(
    lastNumber + 1
  ).padStart(5, "0")}`;
}

function generateCategoryId(categories) {
  const numbers = categories
    .map((category) => {
      const match = String(
        category.categoryId ?? ""
      ).match(/^CAT-(\d{5})$/);

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((number) => number > 0);

  const lastNumber =
    numbers.length > 0
      ? Math.max(...numbers)
      : 0;

  return `CAT-${String(
    lastNumber + 1
  ).padStart(5, "0")}`;
}

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

function getDimension(product) {
  if (
    !product.length &&
    !product.width &&
    !product.height
  ) {
    return "—";
  }

  return `${product.length || "—"} × ${
    product.width || "—"
  } × ${product.height || "—"} cm`;
}

function productToForm(product) {
  return {
    sku: product.sku ?? "",
    productName:
      product.productName ?? "",
    categoryId:
      product.categoryId ?? "",
    unit: product.unit ?? "",
    costPrice:
      product.costPrice ?? "",
    sellingPrice:
      product.sellingPrice ?? "",
    material:
      product.material ?? "",
    specification:
      product.specification ?? "",
    color: product.color ?? "",
    thickness:
      product.thickness ?? "",
    length:
      product.length ?? "",
    width:
      product.width ?? "",
    height:
      product.height ?? "",
    description:
      product.description ?? "",
    image:
      product.image ?? "",
  };
}

export default function ProductPage() {
  const [products, setProducts] =
    useState(() =>
      productStore.getProducts()
    );

  const [categories, setCategories] =
    useState(() =>
      categoryStore.getCategories()
    );

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState(null);

  const [drawerMode, setDrawerMode] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("information");

  const [formData, setFormData] =
    useState(createEmptyProductForm);

  const [editData, setEditData] =
    useState(createEmptyProductForm);

  const [formError, setFormError] =
    useState("");

  const [editError, setEditError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [
    isCategoryModalOpen,
    setIsCategoryModalOpen,
  ] = useState(false);

  const [
    newCategoryName,
    setNewCategoryName,
  ] = useState("");

  const [
    categoryError,
    setCategoryError,
  ] = useState("");

  const selectedProduct =
    products.find(
      (product) =>
        product.productId ===
        selectedProductId
    ) ?? null;

  const activeCategories =
    categories.filter(
      (category) =>
        category.status === "Active"
    );

  function getCategoryName(
    categoryId
  ) {
    return (
      categories.find(
        (category) =>
          category.categoryId ===
          categoryId
      )?.categoryName ?? "—"
    );
  }

  const filteredProducts =
    useMemo(() => {
      const keyword =
        searchQuery
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          if (
            categoryFilter !==
              "ALL" &&
            product.categoryId !==
              categoryFilter
          ) {
            return false;
          }

          if (
            statusFilter !== "ALL" &&
            product.status !==
              statusFilter
          ) {
            return false;
          }

          if (!keyword) {
            return true;
          }

          const categoryName =
            getCategoryName(
              product.categoryId
            );

          return [
            product.productId,
            product.sku,
            product.productName,
            categoryName,
            product.status,
          ].some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(keyword)
          );
        }
      );
    }, [
      products,
      categories,
      searchQuery,
      categoryFilter,
      statusFilter,
    ]);

  function closeDrawer() {
    setDrawerMode(null);
    setSelectedProductId(null);
    setFormError("");
    setEditError("");
    setActiveTab("information");
  }

  function openNewProduct() {
    setSelectedProductId(null);

    setFormData(
      createEmptyProductForm()
    );

    setFormError("");
    setActiveTab("information");
    setDrawerMode("new");
  }

  function openProductDetail(product) {
    setSelectedProductId(
      product.productId
    );

    setActiveTab("information");
    setDrawerMode("detail");
  }

  function startEdit() {
    if (!selectedProduct) {
      return;
    }

    setEditData(
      productToForm(
        selectedProduct
      )
    );

    setEditError("");
    setActiveTab("information");
    setDrawerMode("edit");
  }

  function backToDetail() {
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

  function readImage(
    event,
    setter
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setter((current) => ({
        ...current,
        image:
          typeof reader.result ===
          "string"
            ? reader.result
            : "",
      }));
    };

    reader.readAsDataURL(file);
  }

  function validateProduct(
    data,
    excludedProductId = null
  ) {
    if (!data.sku.trim()) {
      return "SKU is required.";
    }

    if (!data.productName.trim()) {
      return "Product Name is required.";
    }

    if (!data.categoryId) {
      return "Please select Category.";
    }

    if (!data.unit.trim()) {
      return "Unit is required.";
    }

    if (
      Number(data.costPrice || 0) < 0 ||
      Number(data.sellingPrice || 0) < 0
    ) {
      return "Price cannot be negative.";
    }

    const duplicate =
      products.find(
        (product) =>
          product.productId !==
            excludedProductId &&
          (
            product.sku
              ?.trim()
              .toLowerCase() ===
              data.sku
                .trim()
                .toLowerCase() ||
            product.productName
              ?.trim()
              .toLowerCase() ===
              data.productName
                .trim()
                .toLowerCase()
          )
      );

    if (duplicate) {
      return "SKU or Product Name already exists.";
    }

    return "";
  }

  function buildProductRecord(
    data,
    productId,
    status = "Active"
  ) {
    return {
      productId,
      sku: data.sku.trim(),
      productName:
        data.productName.trim(),
      categoryId:
        data.categoryId,
      unit: data.unit.trim(),
      costPrice:
        Number(data.costPrice || 0),
      sellingPrice:
        Number(
          data.sellingPrice || 0
        ),
      status,
      material:
        data.material.trim(),
      specification:
        data.specification.trim(),
      color:
        data.color.trim(),
      thickness:
        data.thickness,
      length:
        data.length,
      width:
        data.width,
      height:
        data.height,
      description:
        data.description.trim(),
      image:
        data.image,
    };
  }

  function handleCreateProduct(
    event
  ) {
    event.preventDefault();

    const error =
      validateProduct(formData);

    if (error) {
      setFormError(error);
      return;
    }

    const newProduct =
      buildProductRecord(
        formData,
        generateProductId(
          products
        )
      );

    const nextProducts = [
      ...products,
      newProduct,
    ];

    productStore.replaceProducts(
      nextProducts
    );

    setProducts(nextProducts);
    closeDrawer();
  }

  function handleUpdateProduct(
    event
  ) {
    event.preventDefault();

    if (!selectedProduct) {
      return;
    }

    const error =
      validateProduct(
        editData,
        selectedProduct.productId
      );

    if (error) {
      setEditError(error);
      return;
    }

    const updatedProduct =
      buildProductRecord(
        editData,
        selectedProduct.productId,
        selectedProduct.status
      );

    const nextProducts =
      products.map(
        (product) =>
          product.productId ===
          selectedProduct.productId
            ? updatedProduct
            : product
      );

    productStore.replaceProducts(
      nextProducts
    );

    setProducts(nextProducts);
    setDrawerMode("detail");
    setEditError("");
    setActiveTab("information");
  }

  function handleToggleStatus() {
    if (!selectedProduct) {
      return;
    }

    const nextStatus =
      selectedProduct.status ===
      "Active"
        ? "Inactive"
        : "Active";

    const confirmed =
      window.confirm(
        `Set ${selectedProduct.productName} to ${nextStatus}?`
      );

    if (!confirmed) {
      return;
    }

    const nextProducts =
      products.map(
        (product) =>
          product.productId ===
          selectedProduct.productId
            ? {
                ...product,
                status: nextStatus,
              }
            : product
      );

    productStore.replaceProducts(
      nextProducts
    );

    setProducts(nextProducts);
  }

  function openCategoryModal() {
    setNewCategoryName("");
    setCategoryError("");
    setIsCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    setIsCategoryModalOpen(false);
    setNewCategoryName("");
    setCategoryError("");
  }

  function saveCategory() {
    const cleanName =
      newCategoryName.trim();

    if (!cleanName) {
      setCategoryError(
        "Category Name is required."
      );
      return;
    }

    const duplicate =
      categories.find(
        (category) =>
          category.categoryName
            .trim()
            .toLowerCase() ===
          cleanName.toLowerCase()
      );

    if (duplicate) {
      setCategoryError(
        "Category already exists."
      );
      return;
    }

    const newCategory = {
      categoryId:
        generateCategoryId(
          categories
        ),
      categoryName:
        cleanName,
      status: "Active",
    };

    const nextCategories = [
      ...categories,
      newCategory,
    ];

    categoryStore.replaceCategories(
      nextCategories
    );

    setCategories(nextCategories);

    if (drawerMode === "edit") {
      setEditData((current) => ({
        ...current,
        categoryId:
          newCategory.categoryId,
      }));
    } else {
      setFormData((current) => ({
        ...current,
        categoryId:
          newCategory.categoryId,
      }));
    }

    closeCategoryModal();
  }

  const drawerData =
    drawerMode === "edit"
      ? editData
      : formData;

  return (
    <div className="product-page">
      <div className="product-page-header">
        <div>
          <h1 className="product-page-title">
            Products
          </h1>

          <p className="product-page-description">
            Manage Product Master data
            used by Sales Orders.
          </p>
        </div>

        <button
          type="button"
          className="product-primary-button"
          onClick={openNewProduct}
        >
          + New Product
        </button>
      </div>

      <section className="product-list-card">
        <div className="product-toolbar">
          <input
            type="search"
            className="product-search-input"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search products..."
          />

          <select
            className="product-filter-select"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Categories
            </option>

            {categories.map(
              (category) => (
                <option
                  key={
                    category.categoryId
                  }
                  value={
                    category.categoryId
                  }
                >
                  {
                    category.categoryName
                  }
                </option>
              )
            )}
          </select>

          <select
            className="product-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>
        </div>

        <div className="product-table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="product-empty-state"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map(
                  (product) => (
                    <tr
                      key={
                        product.productId
                      }
                      className="product-table-row"
                      onClick={() =>
                        openProductDetail(
                          product
                        )
                      }
                    >
                      <td>
                        {product.sku}
                      </td>

                      <td>
                        {
                          product.productName
                        }
                      </td>

                      <td>
                        {getCategoryName(
                          product.categoryId
                        )}
                      </td>

                      <td>
                        {product.unit}
                      </td>

                      <td>
                        {formatIDR(
                          product.costPrice
                        )}
                      </td>

                      <td>
                        {formatIDR(
                          product.sellingPrice
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          status={
                            product.status
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
            className="product-drawer-backdrop"
            onClick={closeDrawer}
            aria-label="Close Product Drawer"
          />

          <aside className="product-detail-drawer">
            <div className="product-detail-header product-detail-header--corporate">
              <div>
                <span className="product-detail-eyebrow">
                  {drawerMode === "new"
                    ? "New Product"
                    : drawerMode === "edit"
                    ? "Edit Product"
                    : "Product Detail"}
                </span>

                <h2>
                  {drawerMode === "new"
                    ? "Create Product"
                    : selectedProduct?.productName}
                </h2>

                <span className="product-detail-id">
                  {drawerMode === "new"
                    ? "Product ID generated automatically"
                    : selectedProduct?.productId}
                </span>
              </div>

              <button
                type="button"
                className="product-detail-close product-detail-close--corporate"
                onClick={closeDrawer}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {drawerMode === "detail" ? (
              <>
                <div className="product-detail-body">
                  <ProductDetail
                    product={
                      selectedProduct
                    }
                    categoryName={
                      selectedProduct
                        ? getCategoryName(
                            selectedProduct.categoryId
                          )
                        : "—"
                    }
                  />
                </div>

                <div className="product-detail-footer">
                  <button
                    type="button"
                    className="product-secondary-button"
                    onClick={closeDrawer}
                  >
                    Close
                  </button>

                  <div className="product-footer-actions-right">
                    <button
                      type="button"
                      className="product-light-action-button"
                      onClick={
                        handleToggleStatus
                      }
                    >
                      {selectedProduct?.status ===
                      "Active"
                        ? "Set Inactive"
                        : "Set Active"}
                    </button>

                    <button
                      type="button"
                      className="product-primary-button"
                      onClick={startEdit}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <form
                className="product-drawer-form"
                onSubmit={
                  drawerMode === "new"
                    ? handleCreateProduct
                    : handleUpdateProduct
                }
              >
                <ProductTabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />

                <div className="product-detail-body">
                  {(formError ||
                    editError) && (
                    <div className="product-form-error">
                      {drawerMode === "new"
                        ? formError
                        : editError}
                    </div>
                  )}

                  <ProductDrawerFields
                    tab={activeTab}
                    data={drawerData}
                    productId={
                      drawerMode === "edit"
                        ? selectedProduct?.productId
                        : null
                    }
                    categories={
                      activeCategories
                    }
                    onChange={(event) =>
                      handleFieldChange(
                        event,
                        drawerMode === "edit"
                          ? setEditData
                          : setFormData
                      )
                    }
                    onImageChange={(event) =>
                      readImage(
                        event,
                        drawerMode === "edit"
                          ? setEditData
                          : setFormData
                      )
                    }
                    onAddCategory={
                      openCategoryModal
                    }
                  />
                </div>

                <div className="product-detail-footer">
                  <button
                    type="button"
                    className="product-secondary-button"
                    onClick={closeDrawer}
                  >
                    Close
                  </button>

                  <div className="product-footer-actions-right">
                    <button
                      type="button"
                      className="product-secondary-button"
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
                      className="product-primary-button"
                    >
                      {drawerMode === "new"
                        ? "Create Product"
                        : "Update Product"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </aside>
        </>
      )}

      {isCategoryModalOpen && (
        <div className="product-modal-layer">
          <button
            type="button"
            className="product-modal-backdrop"
            onClick={
              closeCategoryModal
            }
            aria-label="Close Category Modal"
          />

          <div className="product-category-modal">
            <div className="product-category-modal-header">
              <div>
                <h3>
                  Add Category
                </h3>

                <p>
                  Create a new Product Category.
                </p>
              </div>

              <button
                type="button"
                className="product-modal-close"
                onClick={
                  closeCategoryModal
                }
              >
                ×
              </button>
            </div>

            <div className="product-category-modal-body">
              {categoryError && (
                <div className="product-form-error">
                  {categoryError}
                </div>
              )}

              <label className="product-field">
                <span>
                  Category Name *
                </span>

                <input
                  autoFocus
                  type="text"
                  value={
                    newCategoryName
                  }
                  onChange={(event) => {
                    setNewCategoryName(
                      event.target.value
                    );
                    setCategoryError("");
                  }}
                  placeholder="Enter category name"
                />
              </label>
            </div>

            <div className="product-category-modal-footer">
              <button
                type="button"
                className="product-secondary-button"
                onClick={
                  closeCategoryModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="product-primary-button"
                onClick={saveCategory}
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductTabs({
  activeTab,
  onChange,
}) {
  return (
    <div className="product-tabs">
      {PRODUCT_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={
            activeTab === tab
              ? "product-tab product-tab--active"
              : "product-tab"
          }
          onClick={() =>
            onChange(tab)
          }
        >
          {tab === "information"
            ? "Information"
            : tab === "specification"
            ? "Specification"
            : tab === "pricing"
            ? "Pricing"
            : "Media"}
        </button>
      ))}
    </div>
  );
}

function ProductDrawerFields({
  tab,
  data,
  productId,
  categories,
  onChange,
  onImageChange,
  onAddCategory,
}) {
  if (tab === "information") {
    return (
      <div className="product-form-grid">
        {productId && (
          <label className="product-field">
            <span>Product ID</span>

            <input
              value={productId}
              readOnly
            />
          </label>
        )}

        <label className="product-field">
          <span>SKU *</span>

          <input
            name="sku"
            value={data.sku}
            onChange={onChange}
          />
        </label>

        <label className="product-field product-field--full">
          <span>
            Product Name *
          </span>

          <input
            name="productName"
            value={
              data.productName
            }
            onChange={onChange}
          />
        </label>

        <div className="product-field product-field--full">
          <span>Category *</span>

          <div className="product-category-control">
            <select
              name="categoryId"
              value={
                data.categoryId
              }
              onChange={onChange}
            >
              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.categoryId
                    }
                    value={
                      category.categoryId
                    }
                  >
                    {
                      category.categoryName
                    }
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              className="product-add-category-button"
              onClick={
                onAddCategory
              }
            >
              + Add
            </button>
          </div>
        </div>

        <label className="product-field">
          <span>Unit *</span>

          <input
            name="unit"
            value={data.unit}
            onChange={onChange}
          />
        </label>
      </div>
    );
  }

  if (tab === "pricing") {
    return (
      <div className="product-form-grid">
        <label className="product-field">
          <span>Cost Price</span>

          <input
            type="number"
            min="0"
            name="costPrice"
            value={data.costPrice}
            onChange={onChange}
          />
        </label>

        <label className="product-field">
          <span>Selling Price</span>

          <input
            type="number"
            min="0"
            name="sellingPrice"
            value={data.sellingPrice}
            onChange={onChange}
          />
        </label>
      </div>
    );
  }

  if (tab === "specification") {
    return (
      <div className="product-form-grid">
        <label className="product-field">
          <span>Material</span>

          <input
            name="material"
            value={data.material}
            onChange={onChange}
          />
        </label>

        <label className="product-field">
          <span>Color</span>

          <input
            name="color"
            value={data.color}
            onChange={onChange}
          />
        </label>

        <label className="product-field">
          <span>
            Thickness (mm)
          </span>

          <input
            type="number"
            min="0"
            step="any"
            name="thickness"
            value={
              data.thickness
            }
            onChange={onChange}
          />
        </label>

        <div className="product-field product-field--full">
          <span>
            Dimension (cm)
          </span>

          <div className="product-dimension-grid">
            <input
              type="number"
              min="0"
              step="any"
              name="length"
              value={data.length}
              onChange={onChange}
              placeholder="Length"
            />

            <input
              type="number"
              min="0"
              step="any"
              name="width"
              value={data.width}
              onChange={onChange}
              placeholder="Width"
            />

            <input
              type="number"
              min="0"
              step="any"
              name="height"
              value={data.height}
              onChange={onChange}
              placeholder="Height"
            />
          </div>
        </div>

        <label className="product-field product-field--full">
          <span>
            Specification
          </span>

          <textarea
            rows="4"
            name="specification"
            value={
              data.specification
            }
            onChange={onChange}
          />
        </label>

        <label className="product-field product-field--full">
          <span>
            Description
          </span>

          <textarea
            rows="4"
            name="description"
            value={
              data.description
            }
            onChange={onChange}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="product-form-grid">
      <div className="product-field product-field--full">
        <span>Product Image</span>

        {data.image ? (
          <div className="product-image-preview product-image-preview--large">
            <img
              src={data.image}
              alt="Product preview"
            />
          </div>
        ) : (
          <div className="product-media-empty">
            No Image
          </div>
        )}

        <label className="product-file-input">
          <input
            type="file"
            accept="image/*"
            onChange={
              onImageChange
            }
          />

          <span>
            Choose Product Image
          </span>
        </label>
      </div>
    </div>
  );
}

function ProductDetail({
  product,
  categoryName,
}) {
  if (!product) {
    return null;
  }

  return (
    <>
      {product.image ? (
        <div className="product-detail-image">
          <img
            src={product.image}
            alt={
              product.productName
            }
          />
        </div>
      ) : (
        <div className="product-detail-image product-detail-image--empty">
          No Image
        </div>
      )}

      <div className="product-detail-grid">
        <DetailField
          label="Product ID"
          value={
            product.productId
          }
        />

        <DetailField
          label="Status"
          value={product.status}
          status
        />

        <DetailField
          label="SKU"
          value={product.sku}
        />

        <DetailField
          label="Product Name"
          value={
            product.productName
          }
        />

        <DetailField
          label="Category"
          value={categoryName}
        />

        <DetailField
          label="Unit"
          value={product.unit}
        />

        <DetailField
          label="Cost Price"
          value={formatIDR(
            product.costPrice
          )}
        />

        <DetailField
          label="Selling Price"
          value={formatIDR(
            product.sellingPrice
          )}
        />

        <DetailField
          label="Material"
          value={
            product.material
          }
        />

        <DetailField
          label="Color"
          value={product.color}
        />

        <DetailField
          label="Thickness"
          value={
            product.thickness
              ? `${product.thickness} mm`
              : "—"
          }
        />

        <DetailField
          label="Dimension"
          value={getDimension(
            product
          )}
        />

        <DetailField
          full
          label="Specification"
          value={
            product.specification
          }
        />

        <DetailField
          full
          label="Description"
          value={
            product.description
          }
        />
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={
        status === "Active"
          ? "product-status product-status--active"
          : "product-status product-status--inactive"
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
          ? "product-detail-field product-detail-field--full"
          : "product-detail-field"
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