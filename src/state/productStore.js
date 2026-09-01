import { assertProductCollection } from "../domain/product/product.js";
import { productRepository } from "../repositories/products/productRepository.js";

export const productStore = {
  getProducts() {
    return productRepository.getAll();
  },

  getActiveProducts() {
    return productRepository
      .getAll()
      .filter((product) => product.status === "Active");
  },

  replaceProducts(products) {
    assertProductCollection(products);
    return productRepository.replaceAll(products);
  },

  clearProducts() {
    productRepository.clear();
  },
};
