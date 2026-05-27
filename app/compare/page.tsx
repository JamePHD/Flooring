"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import CompareFilter from "./filter";
import {
  getStoredCompareProducts,
  setStoredCompareProducts,
  StoredCompareProduct,
} from "@/app/lib/local-storage";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
);

const CompareCategories = [
  { label: "PRODUCT NAME", key: "name" },
  { label: "PRODUCT CODE", key: "code" },
  { label: "BRAND", key: "brand" },
  { label: "DESCRIPTION", key: "description" },
  { label: "PLANK THICKNESS (MM)", key: "thickness" },
  { label: "PLANK WIDTH (MM)", key: "plank-width" },
  { label: "PLANK LENGTH (MM)", key: "plank-length" },
  { label: "WARRANTY (YEARS)", key: "warranty" },
  { label: "RANGE", key: "range" },
];

interface SupabaseAttributeLink {
  value: string | null;
  attributes: { slug: string | null } | { slug: string | null }[] | null;
}

interface SupabaseCompareRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  is_residential: boolean | null;
  is_commercial: boolean | null;
  created_at: string;
  categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
  product_attributes: SupabaseAttributeLink[] | null;
}

export default function ComparisonPage() {
  const [comparedProducts, setComparedProducts] = useState<StoredCompareProduct[]>([]);
  const [dbProducts, setDbProducts] = useState<StoredCompareProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedCompare, setHasLoadedCompare] = useState(false);

  useEffect(() => {
    setComparedProducts(getStoredCompareProducts());
    setHasLoadedCompare(true);
  }, []);

  useEffect(() => {
    if (hasLoadedCompare) {
      setStoredCompareProducts(comparedProducts);
    }
  }, [comparedProducts, hasLoadedCompare]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const { data: productRows, error } = await supabase
          .from("products")
          .select(
            "id, name, slug, brand, short_description, description, image_url, is_residential, is_commercial, created_at, categories(name, slug), product_attributes(value, attributes(name, slug))"
          )
          .eq("is_active", true);

        if (error) throw error;

        if (productRows) {
          const formattedProducts = (productRows as unknown as SupabaseCompareRow[]).map(
            (product) => {
              const category = Array.isArray(product.categories)
                ? product.categories[0]
                : product.categories;

              const mappedProduct: StoredCompareProduct = {
                id: product.id,
                name: product.name,
                slug: product.slug,
                code: product.slug,
                brand: product.brand,
                description: product.description || product.short_description,
                imageUrl: product.image_url,
                categoryName: category?.name || null,
                categorySlug: category?.slug || null,
                isResidential: product.is_residential ?? false,
                isCommercial: product.is_commercial ?? false,
                createdAt: product.created_at,
              };

              if (Array.isArray(product.product_attributes)) {
                product.product_attributes.forEach((attrLink) => {
                  const attributeObj = attrLink.attributes;
                  const targetAttribute = Array.isArray(attributeObj)
                    ? attributeObj[0]
                    : attributeObj;

                  const attrSlug = targetAttribute?.slug;
                  const attrValue = attrLink.value;

                  if (attrSlug && attrValue) {
                    mappedProduct[attrSlug] = attrValue;
                  }
                });
              }

              return mappedProduct;
            }
          );

          setDbProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Error loading products for comparison:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const addProductToCompare = (product: StoredCompareProduct) => {
    setComparedProducts((current) => {
      if (current.find((item) => String(item.id) === String(product.id))) return current;
      return [...current, product];
    });
  };

  const removeProducts = (id: string) => {
    setComparedProducts((current) => current.filter((product) => product.id !== id));
  };

  const hasComparedProducts = comparedProducts.length > 0;

  return (
    <div>
      <div style={{ background: "#ffffff", width: "100%" }}>
        <section style={{ background: "linear-gradient(to right, #0d5a57, #118b85, #15c4c4)", color: "white", padding: "40px 16px", textAlign: "center", marginBottom: "40px", width: "100%" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "bold", margin: "0 0 8px 0" }}>Compare Products</h1>
          <p style={{ fontSize: "16px", opacity: 0.9, margin: 0 }}>Use the panel below to select products and compare their details.</p>
        </section>

        <CompareFilter
          dbProducts={dbProducts}
          isLoading={isLoading}
          onSelectProduct={addProductToCompare}
        />

        {hasComparedProducts ? (
          <div style={{ background: "#ffffff", margin: "auto", padding: "40px" }}>
            <table style={{ width: "70%", borderCollapse: "collapse", background: "#fff", margin: "auto" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000000", padding: 12, background: "#f3f4f6", minWidth: 180 }}></th>
                  {comparedProducts.map((product) => (
                    <th key={product.id} style={{ border: "1px solid #000000", padding: 12, background: "#f3f4f6", minWidth: 220, position: "relative" }}>
                      <button onClick={() => removeProducts(product.id)} style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "#696969", border: "none", fontSize: 14, fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        x
                      </button>
                      <div style={{ width: "100%", height: 120, background: "#e5e7eb", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#9ca3af", fontSize: 14 }}>Product Image</span>
                      </div>
                      <div style={{ fontWeight: 300, fontSize: 18, color: "#000000" }}>{product.name}</div>
                      <div style={{ fontSize: 14, color: "#000000" }}>{product.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CompareCategories.map((category) => (
                  <tr key={category.key}>
                    <td style={{ border: "1px solid #000000", padding: 12, fontWeight: 700, background: "#f9fafb", color: "#000000", textAlign: "center" }}>{category.label}</td>
                    {comparedProducts.map((product) => (
                      <td key={`${product.id}-${category.key}`} style={{ border: "1px solid #000000", padding: 12, color: "#000000" }}>
                        {product[category.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ width: "70%", margin: " auto", padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", color: "#374151" }}>No products added to compare.</p>
          </div>
        )}
      </div>
    </div>
  );
}
