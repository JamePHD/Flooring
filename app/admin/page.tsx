"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Entry = {
  id: number;
  name: string;
  brand?: string | null;
  description?: string | null;
  is_residential?: boolean | null;
  is_commercial?: boolean | null;
  product_code?: string | null;
  [key: string]: string | number | null | undefined;
};

type ProductForm = {
  productName: string;
  brand: string;
  description: string;
  isResidential: boolean;
  isCommercial: boolean;
};

const initialProduct: ProductForm = {
  productName: "",
  brand: "",
  description: "",
  isResidential: false,
  isCommercial: false,
};

export default function AdminPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductForm>(initialProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "product_code">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const table = "products";

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("id", { ascending: true });
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    setItems(data ?? []);
  }

  const displayedItems = items
    .filter((it) => {
      const query = filterText.trim().toLowerCase();
      if (!query) return true;
      return [it.name, it.product_code]
        .filter(Boolean)
        .some((value) => value?.toString().toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const left = (a[sortBy] ?? "").toString().toLowerCase();
      const right = (b[sortBy] ?? "").toString().toLowerCase();
      if (left === right) return 0;
      if (sortDirection === "asc") {
        return left < right ? -1 : 1;
      }
      return left > right ? -1 : 1;
    });

  function toFormText(value: string | number | null | undefined) {
    return value?.toString() ?? "";
  }

  function loadProductFromEntry(entry: Entry): ProductForm {
    return {
      productName: entry.name ?? "",
      brand: entry.brand ?? "",
      description: entry.description ?? "",
      isResidential: entry.is_residential ?? false,
      isCommercial: entry.is_commercial ?? false,
    };
  }

  async function addItem(e?: React.FormEvent) {
    e?.preventDefault();
    if (!product.productName.trim()) return;
    setLoading(true);
    const insertData = {
      name: product.productName,
      brand: product.brand.trim() || null,
      description: product.description.trim() || null,
      is_residential: product.isResidential,
      is_commercial: product.isCommercial,
    };

    const query = editingId
      ? supabase.from(table).update(insertData).eq("id", editingId).select().single()
      : supabase.from(table).insert(insertData).select().single();

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setItems((s) => {
        if (editingId) {
          return s.map((item) => (item.id === editingId ? data : item));
        }
        return [...s, data];
      });
    }

    setProduct(initialProduct);
    setEditingId(null);
  }

  function editItem(entry: Entry) {
    setProduct(loadProductFromEntry(entry));
    setEditingId(entry.id);
  }

  async function removeItem(id: number) {
    if (!confirm("Delete this entry?")) return;
    setLoading(true);
    const { error } = await supabase.from(table).delete().eq("id", id);
    setLoading(false);
    if (error) {
      console.error(error);
      return;
    }
    setItems((s) => s.filter((it) => it.id !== id));
  }

  return (
    <main className="flex-1">
        <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Admin Panel</h1>
        </section>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }} className="flex flex-col gap-8">
            <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                padding: '16px'}}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Product</h2>
                  <p style={{ margin: '6px 0 0 0', color: '#374151' }}>Fill in the fields below to add or edit a product.</p>
                </div>
                <form onSubmit={addItem} style={{ display: 'grid', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>Product Name</span>
                        <input
                          value={product.productName}
                          onChange={(e) => setProduct((prev) => ({ ...prev, productName: e.target.value }))}
                          placeholder="Product Name"
                          type="text"
                          style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, width: '100%' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>Brand</span>
                        <input
                          value={product.brand}
                          onChange={(e) => setProduct((prev) => ({ ...prev, brand: e.target.value }))}
                          placeholder="Brand"
                          type="text"
                          style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, width: '100%' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>Description</span>
                        <textarea
                          value={product.description}
                          onChange={(e) => setProduct((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Description"
                          rows={4}
                          style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, width: '100%', resize: 'vertical' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>Residential</span>
                        <input
                          type="checkbox"
                          checked={product.isResidential}
                          onChange={(e) => setProduct((prev) => ({ ...prev, isResidential: e.target.checked }))}
                          style={{ width: 18, height: 18 }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>Commercial</span>
                        <input
                          type="checkbox"
                          checked={product.isCommercial}
                          onChange={(e) => setProduct((prev) => ({ ...prev, isCommercial: e.target.checked }))}
                          style={{ width: 18, height: 18 }}
                        />
                      </label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                        <button type="button" disabled={loading} onClick={() => {
                          setProduct(initialProduct);
                          setEditingId(null);
                        }} style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                          Reset
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '10px 18px', borderRadius: 6, border: 'none', background: '#0d5a57', color: 'white' }}>
                          {editingId ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>

            <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                padding: '16px'}}>

                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Existing Products</h2>
                  <p style={{ margin: '6px 0 0 0', color: '#374151' }}>View, filter, sort, edit, or delete products from the database.</p>
                </div>

                {loading && <div>Loading...</div>}

                <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Filter products</span>
                    <input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Search by name or code"
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', width: '100%' }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "name" | "product_code")}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                      <option value="name">Product Name</option>
                      <option value="product_code">Product Code</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Sort direction</span>
                    <select
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}
                      style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1' }}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </label>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Product Name</th>
                        <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Product Code</th>
                        <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedItems.map((it) => (
                        <tr key={it.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px' }}><strong>{it.name}</strong></td>
                          <td style={{ padding: '10px' }}>{it.product_code ?? ''}</td>
                          <td style={{ padding: '10px', display: 'flex', gap: 8 }}>
                            <button onClick={() => editItem(it)} style={{ padding: '6px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4 }}>
                              Edit
                            </button>
                            <button onClick={() => removeItem(it.id)} style={{ padding: '6px 10px' }}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
        </div>
    </main>
  );
}
