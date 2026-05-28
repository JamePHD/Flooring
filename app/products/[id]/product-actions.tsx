"use client";

import { useMemo, useState } from "react";
import {
  addStoredCartItem,
  getStoredCompareProducts,
  setStoredCompareProducts,
  StoredCartItem,
  StoredCompareProduct,
} from "@/app/lib/local-storage";

interface ProductVariantOption {
  id: string;
  sku: string;
  colour_name: string | null;
  price_per_sqm: number | null;
  price_per_unit: number | null;
  image_url: string | null;
}

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
  };
  activeVariants: ProductVariantOption[];
  compareProducts: StoredCompareProduct[];
}

export default function ProductActions({
  product,
  activeVariants,
  compareProducts,
}: ProductActionsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id ?? product.id);
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 2500);
  }

  const selectedVariant = useMemo(
    () => activeVariants.find((variant) => variant.id === selectedVariantId) ?? null,
    [activeVariants, selectedVariantId]
  );

  function addToQuote() {
    const variantPrice = selectedVariant
      ? selectedVariant.price_per_sqm && selectedVariant.price_per_sqm > 0
        ? selectedVariant.price_per_sqm
        : selectedVariant.price_per_unit && selectedVariant.price_per_unit > 0
          ? selectedVariant.price_per_unit
          : 0
      : 0;

    const cartItem: StoredCartItem = {
      id: selectedVariant?.id ?? product.id,
      slug: product.slug,
      name: selectedVariant?.colour_name
        ? `${product.name} - ${selectedVariant.colour_name}`
        : product.name,
      price: variantPrice,
      quantity: 1,
      image: selectedVariant?.image_url ?? product.image_url ?? "/products/woodfloor.jpg",
      sqmPerBox: 1,
    };

    addStoredCartItem(cartItem);
    showMessage("Saved to your cart on this device.");
  }

  function addToCompare() {
    const existingProducts = getStoredCompareProducts();
    const uniqueProducts = compareProducts.filter(
      (item) =>
        !existingProducts.some((storedProduct) => String(storedProduct.id) === String(item.id))
    );

    if (uniqueProducts.length === 0) {
      showMessage("This product is already in your compare list.");
      return;
    }

    const nextProducts = [...existingProducts, ...uniqueProducts];
    setStoredCompareProducts(nextProducts);
    showMessage("Added to your compare list.");
  }

  return (
    <div className="mt-8">
      {activeVariants.length > 0 ? (
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          Select variant
          <select
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800"
          >
            {activeVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.colour_name || "Standard"} · SKU {variant.sku}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addToQuote}
          className="inline-flex h-12 items-center justify-center bg-[#0B6A6A] px-8 text-sm font-bold text-white transition hover:bg-[#109494]"
        >
          Add to Cart
        </button>

        <button
          type="button"
          onClick={addToCompare}
          className="inline-flex h-12 items-center justify-center border border-[#0B6A6A] px-8 text-sm font-bold text-[#0B6A6A] transition hover:border-[#109494] hover:text-[#109494]"
        >
          Add to Compare
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm font-semibold text-[#0B6A6A]">{message}</p>
      ) : null}
    </div>
  );
}
