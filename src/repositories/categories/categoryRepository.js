const CATEGORY_STORAGE_KEY = "artkrilik-erp-v3.product-categories";

function storageIsAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

function readCategories() {
  if (!storageIsAvailable()) {
    return [];
  }

  const storedValue = window.localStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeCategories(categories) {
  if (!Array.isArray(categories)) {
    throw new TypeError("Category repository expects an array.");
  }

  if (!storageIsAvailable()) {
    return categories;
  }

  window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));

  return categories;
}

export const categoryRepository = {
  getAll() {
    return readCategories();
  },

  replaceAll(categories) {
    return writeCategories(categories);
  },

  clear() {
    if (storageIsAvailable()) {
      window.localStorage.removeItem(CATEGORY_STORAGE_KEY);
    }
  },
};
