import { useEffect, useState } from "react";

import { categoryStore } from "../../../state/categoryStore.js";
import ProductCategoryModal from "./ProductCategoryModal.jsx";

const PRODUCT_UNITS = ["pcs", "sheet", "set", "unit", "meter", "roll"];

export function createEmptyProductForm() {
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

export function buildProductDimension(product) {
  if (!product?.length && !product?.width && !product?.height) {
    return "—";
  }

  return `${product.length || "—"} × ${product.width || "—"} × ${
    product.height || "—"
  } cm`;
}

function generateCategoryId(categories) {
  const numbers = categories
    .map((category) => {
      const match = String(category.categoryId ?? "").match(/^CAT-(\d{5})$/);

      return match ? Number(match[1]) : 0;
    })
    .filter((number) => number > 0);

  const lastNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

  return `CAT-${String(lastNumber + 1).padStart(5, "0")}`;
}

export default function ProductForm({
  data,
  categories = [],
  onChange,
  onCategoryCreated,
}) {
  const [categoryList, setCategoryList] = useState(() =>
    categories.length ? categories : categoryStore.getCategories()
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const [categoryName, setCategoryName] = useState("");

  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    if (categories.length) {
      setCategoryList(categories);
    }
  }, [categories]);

  const activeCategories = categoryList.filter(
    (category) => category.status === "Active"
  );

  function handleFieldChange(event) {
    onChange(event);
  }

  function openCategoryDialog() {
    setCategoryName("");
    setCategoryError("");
    setCategoryDialogOpen(true);
  }

  function closeCategoryDialog() {
    setCategoryName("");
    setCategoryError("");
    setCategoryDialogOpen(false);
  }

  function handleCreateCategory() {
    const cleanName = categoryName.trim();

    if (!cleanName) {
      setCategoryError("Category Name is required.");
      return;
    }

    const existingCategories = categoryStore.getCategories();

    const duplicate = existingCategories.find(
      (category) =>
        String(category.categoryName ?? "")
          .trim()
          .toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      setCategoryError("Category Name already exists.");
      return;
    }

    const newCategory = {
      categoryId: generateCategoryId(existingCategories),
      categoryName: cleanName,
      status: "Active",
    };

    const nextCategories = [...existingCategories, newCategory];

    categoryStore.replaceCategories(nextCategories);

    setCategoryList(nextCategories);

    /*
     * Automatically select the
     * newly-created category.
     */
    onChange({
      target: {
        name: "categoryId",
        value: newCategory.categoryId,
      },
    });

    if (typeof onCategoryCreated === "function") {
      onCategoryCreated(newCategory, nextCategories);
    }

    closeCategoryDialog();
  }

  function handleCategoryKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateCategory();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCategoryDialog();
    }
  }

  return (
    <>
      <div className="product-form-grid">
        {/* SKU */}

        <label className="product-field">
          <span>SKU *</span>

          <input
            name="sku"
            value={data?.sku ?? ""}
            onChange={handleFieldChange}
            placeholder="Enter SKU"
          />
        </label>

        {/* PRODUCT NAME */}

        <label className="product-field">
          <span>Product Name *</span>

          <input
            name="productName"
            value={data?.productName ?? ""}
            onChange={handleFieldChange}
            placeholder="Enter product name"
          />
        </label>

        {/* CATEGORY */}

        <div className="product-field">
          <span>Category *</span>

          <div className="product-category-row">
            <select
              name="categoryId"
              value={data?.categoryId ?? ""}
              onChange={handleFieldChange}>
              <option value="">Select Category</option>

              {activeCategories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="product-category-add-button"
              onClick={openCategoryDialog}>
              + Create
            </button>
          </div>
        </div>

        {/* UNIT */}

        <label className="product-field">
          <span>Unit *</span>

          <select
            name="unit"
            value={data?.unit ?? ""}
            onChange={handleFieldChange}>
            <option value="">Select Unit</option>

            {PRODUCT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        {/* COST PRICE */}

        <label className="product-field">
          <span>Cost Price</span>

          <input
            type="number"
            min="0"
            name="costPrice"
            value={data?.costPrice ?? ""}
            onChange={handleFieldChange}
            placeholder="0"
          />
        </label>

        {/* SELLING PRICE */}

        <label className="product-field">
          <span>Selling Price *</span>

          <input
            type="number"
            min="0"
            name="sellingPrice"
            value={data?.sellingPrice ?? ""}
            onChange={handleFieldChange}
            placeholder="0"
          />
        </label>

        {/* MATERIAL */}

        <label className="product-field">
          <span>Material</span>

          <input
            name="material"
            value={data?.material ?? ""}
            onChange={handleFieldChange}
            placeholder="Material"
          />
        </label>

        {/* COLOR */}

        <label className="product-field">
          <span>Color</span>

          <input
            name="color"
            value={data?.color ?? ""}
            onChange={handleFieldChange}
            placeholder="Color"
          />
        </label>

        {/* THICKNESS */}

        <label className="product-field">
          <span>Thickness</span>

          <input
            name="thickness"
            value={data?.thickness ?? ""}
            onChange={handleFieldChange}
            placeholder="Thickness"
          />
        </label>

        {/* SPECIFICATION */}

        <label className="product-field">
          <span>Specification</span>

          <input
            name="specification"
            value={data?.specification ?? ""}
            onChange={handleFieldChange}
            placeholder="Specification"
          />
        </label>

        {/* LENGTH */}

        <label className="product-field">
          <span>Length</span>

          <input
            name="length"
            value={data?.length ?? ""}
            onChange={handleFieldChange}
            placeholder="cm"
          />
        </label>

        {/* WIDTH */}

        <label className="product-field">
          <span>Width</span>

          <input
            name="width"
            value={data?.width ?? ""}
            onChange={handleFieldChange}
            placeholder="cm"
          />
        </label>

        {/* HEIGHT */}

        <label className="product-field">
          <span>Height</span>

          <input
            name="height"
            value={data?.height ?? ""}
            onChange={handleFieldChange}
            placeholder="cm"
          />
        </label>

        {/* DESCRIPTION */}

        <label className="product-field product-field-full">
          <span>Description</span>

          <textarea
            rows="3"
            name="description"
            value={data?.description ?? ""}
            onChange={handleFieldChange}
            placeholder="Product description"
          />
        </label>
      </div>

      {/* =====================================================
          CREATE CATEGORY DIALOG
          ===================================================== */}

      <ProductCategoryModal
        open={categoryDialogOpen}
        categoryName={categoryName}
        categoryError={categoryError}
        onChange={(event) => {
          setCategoryName(event.target.value);

          setCategoryError("");
        }}
        onClose={closeCategoryDialog}
        onSave={handleCreateCategory}
      />
    </>
  );
}
