"use client";

import { useMemo, useState } from "react";

interface CompareFilterProps {
  dbProducts: any[];
  isLoading: boolean;
  onSelectProduct: (product: any) => void;
}

export default function CompareFilter({
  dbProducts,
  isLoading,
  onSelectProduct,
}: CompareFilterProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedUse, setSelectedUse] = useState("all");

  const categories = useMemo(() => {
    const uniqueMap = new Map<string, { name: string; slug: string }>();
    dbProducts.forEach((product) => {
      if (product.categorySlug && product.categoryName) {
        uniqueMap.set(product.categorySlug, { name: product.categoryName, slug: product.categorySlug });
      }
    });
    return Array.from(uniqueMap.values());
  }, [dbProducts]);

  const brands = useMemo(() => {
    return Array.from(new Set(dbProducts.map((p) => p.brand).filter(Boolean) as string[])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [dbProducts]);

  const uses = useMemo(() => {
    const values = new Set<string>();

    dbProducts.forEach((product) => {
      if (product.isResidential) values.add("residential");
      if (product.isCommercial) values.add("commercial");
      if (typeof product.use === "string" && product.use.trim()) {
        values.add(product.use.trim());
      }
    });

    return Array.from(values).sort();
  }, [dbProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dbProducts.filter((product) => {
      const matchesCat = selectedCat === "all" || product.categorySlug === selectedCat || product.category === selectedCat;
      const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
      
      const matchesUse = selectedUse === 'all' ||
      (selectedUse === "residential" && product.isResidential) || (selectedUse === "commercial" && product.isCommercial);

      const matchesSearch = !normalizedSearch ||
      [product.name, product.displayName, product.code, product.brand, product.categoryName, product.description]
      .filter(Boolean).some((value) => value!.toLowerCase().includes(normalizedSearch));

      return matchesCat && matchesBrand && matchesUse && matchesSearch;
    });
  }, [dbProducts, searchTerm, selectedCat, selectedBrand, selectedUse]);

  function clearFilters(){
    setSelectedCat("all");
    setSelectedBrand("all");
    setSelectedUse("all");
    setSearchTerm("");
  }

  return (
    <div style={{ width: "75%", margin: "0 auto 30px auto", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <div
        onClick={() => setIsCartOpen(!isCartOpen)}
        style={{ padding: "15px 20px", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#333" }}>
          Add Product to Compare {dbProducts.length > 0 && `(${dbProducts.length} available)`}
        </h3>
        <span style={{ transform: isCartOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.3s" }}>▼</span>
      </div>

      {isCartOpen && (
        <div>
          {/*Search bar*/}
          <div style={{ padding: "15px 15px 0 15px", background: "#fff" }}>
            <input
              type="text"
              placeholder="Quick search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{color:"#4e6d75", width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", outline: "none" }}
            />
          </div>

        
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", background: "#fff", minHeight: "280px" }}>
            
            {/*Select filters*/}
            <div style={{ padding: "15px", borderRight: "1px solid #f3f4f6", background: "#fbfcfc", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px", color: "#4b5563", fontSize: "12px" }}>CATEGORIES</label>
                <select value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} style={{ color: "#2f3f43", width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px", color: "#4b5563", fontSize: "12px" }}>BRANDS</label>
                <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} style={{color:"#2f3f43", width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                  <option value="all">All Brands</option>
                  {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "6px", color: "#4b5563", fontSize: "12px" }}>USE</label>
                <select value={selectedUse} onChange={(e) => setSelectedUse(e.target.value)} style={{ color: "#2f3f43", width: "100%", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                  <option value="all">All Uses</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  
                </select>
              </div>

              <button
                onClick={clearFilters}
                style={{ marginTop: "auto", padding: "8px", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#4b5563" }}
              >
                Clear Filters
              </button>
            </div>

            {/*Product list*/}
            <div style={{ padding: "15px", maxHeight: "320px", overflowY: "auto" }}>
              {isLoading ? (
                <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", marginTop: "40px" }}>Loading products...</p>
              ) : filteredProducts.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>                  No products found for the selected filters.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id ?? product.code}
                      onClick={() => onSelectProduct(product)}
                      style={{
                        padding: "14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        cursor: "pointer",
                        background: "#fff",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = "#fff";
                      }}
                    >
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                        {product.displayName || "Unnamed product"}
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "13px", color: "#6b7280" }}>
                        {product.brand || product.category || "No brand"}
                      </div>
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#9ca3af" }}>
                        Code: {product.code ?? "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}                  