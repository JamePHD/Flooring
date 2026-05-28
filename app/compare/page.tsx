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
  { label: "PRODUCT NAME", key: "displayName" },  // Range + Colour 
  { label: "PRODUCT CODE (SKU)", key: "code" },   
  { label: "BRAND", key: "brand" },
  { label: "DESCRIPTION", key: "description" },   
  { label: "PLANK THICKNESS (MM)", key: "thickness" },
  { label: "PLANK WIDTH (MM)", key: "plank-width" },
  { label: "PLANK LENGTH (MM)", key: "plank-length" },
  { label: "WARRANTY (YEARS)", key: "warranty" },
  { label: "RANGE", key: "range" }
];

export default function ComparisonPage() {
  const [comparedProducts, setComparedProducts] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
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
  }, [hasLoadedCompare, comparedProducts]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);

       
        const { data: productRows, error } = await supabase
          .from('product_variants')
          .select('id, sku, colour_name, size_label, products (id, name, slug, brand, short_description, description, image_url, is_residential, is_commercial, created_at, is_active, categories(name, slug), product_attributes(value, attributes(name, slug)))');

        if (error) throw error;

        if (productRows) {
          const validVariants = productRows.filter((v: any) => v.products?.is_active === true);

          const formattedProducts = validVariants.map((variant: any) => {
            const product = variant.products;
            const category = Array.isArray(product?.categories) ? product.categories[0] : product?.categories;

            const mappedProduct: any = {
              id: variant.id,
              variantSku: variant.sku,
              code: variant.sku,
              colourName: variant.colour_name,
              displayName: product?.name && variant.colour_name ? `${product.name} ${variant.colour_name}` : product?.name || variant.colour_name || "Unknown Product",
              name: product?.name || "",
              brand: product?.brand || null,
              description: product?.description || null,
              imageUrl: product?.image_url || null,
              categoryName: category?.name || null,
              categorySlug: category?.slug || null,
              isResidential: product?.is_residential ?? false,
              isCommercial: product?.is_commercial ?? false,
              "thickness": "-",
              "plank-width": "-",
              "plank-length": "-",
              warranty: "-",
              range: product?.name || "-",
            };

            if (variant.size_label && typeof variant.size_label === "string") {
              const cleanSize = variant.size_label.toLowerCase().replace(/mm/g, "").trim(); 
              const parts = cleanSize.split("×"); 

              if (parts.length === 3) {
          
                mappedProduct["plank-length"] = parts[0].trim();
                mappedProduct["plank-width"] = parts[1].trim();
                mappedProduct["thickness"] = parts[2].trim();
              } else if (parts.length === 2) {
                mappedProduct["plank-length"] = parts[0].trim();
                mappedProduct["thickness"] = parts[1].trim();
              }
            }

            if (product && product.product_attributes && Array.isArray(product.product_attributes)) {
              product.product_attributes.forEach((attrLink: any) => {
                const attrValue = attrLink.value;
                const attributeObj = attrLink.attributes || attrLink.attribute;
                const targetAttribute = Array.isArray(attributeObj) ? attributeObj[0] : attributeObj;
                const attrSlug = targetAttribute?.slug;

                if (attrSlug && attrValue) {
                  const cleanSlug = String(attrSlug).trim().toLowerCase();

                  if (cleanSlug === "thickness" && mappedProduct["thickness"] === "-") mappedProduct["thickness"] = attrValue;
                  else if ((cleanSlug === "plank-width" || cleanSlug === "plankwidth" || cleanSlug === "width") && mappedProduct["plank-width"] === "-") mappedProduct["plank-width"] = attrValue;
                  else if ((cleanSlug === "plank-length" || cleanSlug === "planklength" || cleanSlug === "length") && mappedProduct["plank-length"] === "-") mappedProduct["plank-length"] = attrValue;
                  else if (cleanSlug === "warranty") mappedProduct["warranty"] = attrValue;
                  else if (cleanSlug === "range") mappedProduct["range"] = attrValue;
                }
              });
            }


            return mappedProduct;
          });

          setDbProducts(formattedProducts);
        }
      } catch (err) {
        console.error("Error extracting product data", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const addProductToCompare = (product: StoredCompareProduct) => {
    setComparedProducts((current) => {
      if (current.find((item) => String(item.id) === String(product.id))) return current;
      const updated = [...current, product];
      setStoredCompareProducts(updated);
      return updated;
    });
  };

  const removeProducts = (id: string) => {
    setComparedProducts((current) => {
      const updated = current.filter((product) => String(product.id) !== String(id));
      setStoredCompareProducts(updated);
      return updated;
    });
    
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
          comparedProducts={comparedProducts}
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
};
