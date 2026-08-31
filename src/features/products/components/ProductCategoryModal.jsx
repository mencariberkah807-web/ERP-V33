export default function ProductCategoryModal({
  open,
  categoryName,
  categoryError,
  onChange,
  onClose,
  onSave,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="product-modal-layer">
      <button
        type="button"
        className="product-modal-backdrop"
        onClick={onClose}
        aria-label="Close Category Modal"
      />

      <div className="product-category-modal">
        <div className="product-category-modal-header">
          <div>
            <h3>Add Category</h3>

            <p>Create a new Product Category.</p>
          </div>

          <button
            type="button"
            className="product-modal-close"
            onClick={onClose}>
            ×
          </button>
        </div>

        <div className="product-category-modal-body">
          {categoryError && (
            <div className="product-form-error">{categoryError}</div>
          )}

          <label className="product-field">
            <span>Category Name *</span>

            <input
              autoFocus
              value={categoryName}
              onChange={onChange}
              placeholder="Enter category name"
            />
          </label>
        </div>

        <div className="product-category-modal-footer">
          <button
            type="button"
            className="product-secondary-button"
            onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="product-primary-button"
            onClick={onSave}>
            Save Category
          </button>
        </div>
      </div>
    </div>
  );
}
