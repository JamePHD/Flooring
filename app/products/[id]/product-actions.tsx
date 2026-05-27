"use client";

import { useState } from "react";
import {
  addStoredCartItem,
  addStoredCompareProduct,
  getStoredCompareProducts,
  StoredCartItem,
  StoredCompareProduct,
} from "@/app/lib/local-storage";

interface ProductActionsProps {
  cartItem: StoredCartItem;
  compareProduct: StoredCompareProduct;
}

export default function ProductActions({
  cartItem,
  compareProduct,
}: ProductActionsProps) {
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 2500);
  }

  function addToQuote() {
    addStoredCartItem(cartItem);
    showMessage("Saved to your quote cart on this device.");
  }

  function addToCompare() {
    const beforeCount = getStoredCompareProducts().length;
    const nextProducts = addStoredCompareProduct(compareProduct);

    showMessage(
      nextProducts.length > beforeCount
        ? "Saved to your compare list on this device."
        : "This product is already in your compare list."
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addToQuote}
          className="inline-flex h-12 items-center justify-center bg-[#0B6A6A] px-8 text-sm font-bold text-white transition hover:bg-[#109494]"
        >
          Add to Quote
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
