export interface StoredCartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sqmPerBox: number;
}

export interface StoredCompareProduct {
  id: string;
  name: string;
  slug: string;
  code: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  isResidential: boolean;
  isCommercial: boolean;
  [key: string]: string | number | boolean | null;
}

const CART_KEY = "flooring_cart_items";
const COMPARE_KEY = "flooring_compare_items";

function readStoredArray<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredCartItems() {
  return readStoredArray<StoredCartItem>(CART_KEY);
}

export function setStoredCartItems(items: StoredCartItem[]) {
  writeStoredArray(CART_KEY, items);
}

export function addStoredCartItem(item: StoredCartItem) {
  const items = getStoredCartItems();
  const existingIndex = items.findIndex((storedItem) => storedItem.id === item.id);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: items[existingIndex].quantity + item.quantity,
    };
  } else {
    items.push(item);
  }

  setStoredCartItems(items);
  return items;
}

export function getStoredCompareProducts() {
  return readStoredArray<StoredCompareProduct>(COMPARE_KEY);
}

export function setStoredCompareProducts(products: StoredCompareProduct[]) {
  writeStoredArray(COMPARE_KEY, products);
}

export function addStoredCompareProduct(product: StoredCompareProduct) {
  const products = getStoredCompareProducts();

  if (products.some((storedProduct) => storedProduct.id === product.id)) {
    return products;
  }

  const nextProducts = [...products, product];
  setStoredCompareProducts(nextProducts);
  return nextProducts;
}
