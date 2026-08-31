import { categoryRepository } from "../repositories/categories/categoryRepository.js";

export const categoryStore = {
  getCategories() {
    return categoryRepository.getAll();
  },

  getActiveCategories() {
    return categoryRepository
      .getAll()
      .filter((category) => category.status === "Active");
  },

  replaceCategories(categories) {
    return categoryRepository.replaceAll(categories);
  },

  clearCategories() {
    categoryRepository.clear();
  },
};
