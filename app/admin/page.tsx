"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Entry = {
  id: number;
  name: string;
  product_code?: string | null;
  [key: string]: string | number | null | undefined;
};

type ProductForm = {
  productName: string;
  productCode: string;
  brand: string;
  weightKg: string;
  plankThicknessMm: string;
  plankWidthMm: string;
  plankLengthMm: string;
  productType: string;
  range: string;
  installationType: string;
  m2PerPackBox: string;
  boardsPerPackBox: string;
  warranty: string;
  colorTone: string;
  species: string;
  pricePerM2: string;
  waterResistance: string;
  surfaceTexture: string;
  surfaceFinish: string;
  edgeType: string;
  jointType: string;
  wearLayerThickness: string;
  veneerThickness: string;
  plankLayout: string;
  plankStyle: string;
  vocEmission: string;
  jankaRating: string;
  wearRating: string;
  grade: string;
  repeats: string;
};

const initialProduct: ProductForm = {
  productName: "",
  productCode: "",
  brand: "",
  weightKg: "",
  plankThicknessMm: "",
  plankWidthMm: "",
  plankLengthMm: "",
  productType: "",
  range: "",
  installationType: "",
  m2PerPackBox: "",
  boardsPerPackBox: "",
  warranty: "",
  colorTone: "",
  species: "",
  pricePerM2: "",
  waterResistance: "",
  surfaceTexture: "",
  surfaceFinish: "",
  edgeType: "",
  jointType: "",
  wearLayerThickness: "",
  veneerThickness: "",
  plankLayout: "",
  plankStyle: "",
  vocEmission: "",
  jankaRating: "",
  wearRating: "",
  grade: "",
  repeats: "",
};

export default function AdminPage() {
  const supabase = createClient(
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
      productCode: entry.product_code ?? "",
      brand: toFormText(entry.brand),
      weightKg: toFormText(entry.weight_kg),
      plankThicknessMm: toFormText(entry.plank_thickness_mm),
      plankWidthMm: toFormText(entry.plank_width_mm),
      plankLengthMm: toFormText(entry.plank_length_mm),
      productType: toFormText(entry.product_type),
      range: toFormText(entry.range),
      installationType: toFormText(entry.installation_type),
      m2PerPackBox: toFormText(entry.m2_per_pack_box),
      boardsPerPackBox: toFormText(entry.boards_per_pack_box),
      warranty: toFormText(entry.warranty),
      colorTone: toFormText(entry.color_tone),
      species: toFormText(entry.species),
      pricePerM2: toFormText(entry.price_per_m2),
      waterResistance: toFormText(entry.water_resistance),
      surfaceTexture: toFormText(entry.surface_texture),
      surfaceFinish: toFormText(entry.surface_finish),
      edgeType: toFormText(entry.edge_type),
      jointType: toFormText(entry.joint_type),
      wearLayerThickness: toFormText(entry.wear_layer_thickness),
      veneerThickness: toFormText(entry.veneer_thickness),
      plankLayout: toFormText(entry.plank_layout),
      plankStyle: toFormText(entry.plank_style),
      vocEmission: toFormText(entry.voc_emission),
      jankaRating: toFormText(entry.janka_rating),
      wearRating: toFormText(entry.wear_rating),
      grade: toFormText(entry.grade),
      repeats: toFormText(entry.repeats),
    };
  }

  async function addItem(e?: React.FormEvent) {
    e?.preventDefault();
    if (!product.productName.trim()) return;
    setLoading(true);
    const insertData = {
      name: product.productName,
      product_code: product.productCode,
      brand: product.brand,
      weight_kg: product.weightKg ? Number(product.weightKg) : null,
      plank_thickness_mm: product.plankThicknessMm ? Number(product.plankThicknessMm) : null,
      plank_width_mm: product.plankWidthMm ? Number(product.plankWidthMm) : null,
      plank_length_mm: product.plankLengthMm ? Number(product.plankLengthMm) : null,
      product_type: product.productType,
      range: product.range,
      installation_type: product.installationType,
      m2_per_pack_box: product.m2PerPackBox ? Number(product.m2PerPackBox) : null,
      boards_per_pack_box: product.boardsPerPackBox ? Number(product.boardsPerPackBox) : null,
      warranty: product.warranty,
      color_tone: product.colorTone,
      species: product.species,
      price_per_m2: product.pricePerM2 ? Number(product.pricePerM2) : null,
      water_resistance: product.waterResistance,
      surface_texture: product.surfaceTexture,
      surface_finish: product.surfaceFinish,
      edge_type: product.edgeType,
      joint_type: product.jointType,
      wear_layer_thickness: product.wearLayerThickness ? Number(product.wearLayerThickness) : null,
      veneer_thickness: product.veneerThickness ? Number(product.veneerThickness) : null,
      plank_layout: product.plankLayout,
      plank_style: product.plankStyle,
      voc_emission: product.vocEmission,
      janka_rating: product.jankaRating,
      wear_rating: product.wearRating,
      grade: product.grade,
      repeats: product.repeats,
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
                padding: '16px',
                display: 'flex',
                gap: '12px'}}>
                Manage entries in the &quot;Products&quot; Supabase table
            </div>

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
                        {[
                          { label: 'Product Name', key: 'productName', type: 'text' },
                          { label: 'Product Code', key: 'productCode', type: 'text' },
                          { label: 'Brand', key: 'brand', type: 'text' },
                          { label: 'Weight (kg)', key: 'weightKg', type: 'number' },
                          { label: 'Plank Thickness (mm)', key: 'plankThicknessMm', type: 'number' },
                          { label: 'Plank Width (mm)', key: 'plankWidthMm', type: 'number' },
                          { label: 'Plank Length (mm)', key: 'plankLengthMm', type: 'number' },
                          { label: 'Product Type', key: 'productType', type: 'text' },
                          { label: 'Range', key: 'range', type: 'text' },
                          { label: 'Installation Type', key: 'installationType', type: 'text' },
                          { label: 'm2 per pack/box', key: 'm2PerPackBox', type: 'number' },
                          { label: 'Boards per pack/box', key: 'boardsPerPackBox', type: 'number' },
                          { label: 'Warranty', key: 'warranty', type: 'text' },
                          { label: 'Color Tone', key: 'colorTone', type: 'text' },
                          { label: 'Species', key: 'species', type: 'text' },
                          { label: 'Price (per m2)', key: 'pricePerM2', type: 'number' },
                          { label: 'Water Resistance', key: 'waterResistance', type: 'text' },
                          { label: 'Surface Texture', key: 'surfaceTexture', type: 'text' },
                          { label: 'Surface Finish', key: 'surfaceFinish', type: 'text' },
                          { label: 'Edge Type', key: 'edgeType', type: 'text' },
                          { label: 'Joint Type', key: 'jointType', type: 'text' },
                          { label: 'Wear layer Thickness', key: 'wearLayerThickness', type: 'number' },
                          { label: 'Veneer Thickness (E.Timber)', key: 'veneerThickness', type: 'number' },
                          { label: 'Plank Layout', key: 'plankLayout', type: 'text' },
                          { label: 'Plank Style', key: 'plankStyle', type: 'text' },
                          { label: 'VOC Emission', key: 'vocEmission', type: 'text' },
                          { label: 'Janka Rating (E.Timber)', key: 'jankaRating', type: 'text' },
                          { label: 'Wear Rating', key: 'wearRating', type: 'text' },
                          { label: 'Grade (E.Timber)', key: 'grade', type: 'text' },
                          { label: 'Repeats', key: 'repeats', type: 'text' },
                        ].map((field) => (
                          <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                            <span style={{ fontWeight: 600 }}>{field.label}</span>
                            <input
                              value={product[field.key as keyof ProductForm]}
                              onChange={(e) => setProduct((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.label}
                              type={field.type}
                              style={{ padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, width: '100%' }}
                            />
                          </label>
                        ))}
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

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Product Name</th>
                        <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Product Code</th>
                        <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
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
