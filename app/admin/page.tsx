'use client';

// Import necessary modules and types
import { createClient, Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState, useActionState } from "react";

// Setup Supabase client
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseURL, supabaseAnonKey);

// Define category type
type Category = {
  id: string;
  name: string;
};

// Define product reference type for variants
type ProductReference = {
  id: string;
  name: string;
};

// Define types for products and variants
type Product = {
  category_id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  short_description: string;
  image_url: string;
  is_active: boolean;
  is_residential: boolean;
  is_commercial: boolean;
};

const initialProduct: Product = {
  category_id: "",
  name: "",
  slug: "",
  brand: "",
  description: "",
  short_description: "",
  image_url: "",
  is_active: false,
  is_residential: false,
  is_commercial: false,
};

type Variant = {
  product_id: string;
  sku: string;
  colour_name: string;
  colour_hex: string;
  size_label: string;
  price_per_sqm: number | null;
  price_per_unit: number | null;
  image_url: string;
  is_active: boolean;
};

const initialVariant: Variant = {
  product_id: "",
  sku: "",
  colour_name: "",
  colour_hex: "",
  size_label: "",
  price_per_sqm: null,
  price_per_unit: null,
  image_url: "",
  is_active: false,
};

// Main admin page component
export default function AdminPage() {
  // State for user session
  const [session, setSession] = useState<Session | null>(null);
  // Add product to database action
  const [productError, submitProduct, productIsPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      // Break down form data into product fields
      const newProduct = {
        category_id: formData.get('category') as string,
        name: formData.get('name') as string,
        slug: formData.get('name')?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-') as string,
        brand: formData.get('brand') as string,
        description: formData.get('description') as string,
        short_description: formData.get('short_description') as string,
        image_url: formData.get('image_url') as string,
        is_active: formData.get('is_active') === 'on',
        is_residential: formData.get('is_residential') === 'on',
        is_commercial: formData.get('is_commercial') === 'on',
      };
      // Sanitize data input
      newProduct.name = newProduct.name.trim();
      newProduct.slug = newProduct.slug.trim();
      newProduct.brand = newProduct.brand.trim();
      newProduct.description = newProduct.description.trim();
      newProduct.short_description = newProduct.short_description.trim();
      newProduct.image_url = newProduct.image_url.trim();
      newProduct.category_id = categories.find(c => c.name === newProduct.category_id)?.id ?? '';
      // Validate required fields
      if (!newProduct.name) { return new Error('Product name is required'); }
      if (!newProduct.brand) { return new Error('Product brand is required'); }
      if (!newProduct.category_id) { return new Error('Product category is required'); }
      if (newProduct.category_id === '') { return new Error('Selected category is invalid'); }
      // Insert new product into database
      const { error } = await supabase
        .from('products')
        .insert(newProduct);
      // Handle insertion error
      if (error) {
        return new Error('Error adding product to database: ' + error.message);
      }
    },
    null // Initial state
  );
  // Add variant to database action
  const [variantError, submitVariant, variantIsPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      // Break down form data into product fields
      const newVariant = {
        product_id: formData.get('product_id') as string,
        sku: formData.get('sku') as string,
        colour_name: formData.get('colour_name') as string,
        colour_hex: formData.get('colour_hex') as string,
        size_label: formData.get('size_label') as string,
        price_per_sqm: formData.get('price_per_sqm') as number | null,
        price_per_unit: formData.get('price_per_unit') as number | null,
        image_url: formData.get('image_url') as string,
        is_active: formData.get('is_active') === 'on',
      };
      // Sanitize data input
      newVariant.sku = newVariant.sku.trim();
      newVariant.colour_name = newVariant.colour_name.trim();
      newVariant.colour_hex = newVariant.colour_hex.trim();
      newVariant.size_label = newVariant.size_label.trim();
      newVariant.image_url = newVariant.image_url.trim();
      newVariant.product_id = productReferences.find(p => p.name === newVariant.product_id)?.id ?? '';
      // Validate required fields
      if (!newVariant.sku) { return new Error('Variant SKU is required'); }
      if (!newVariant.product_id) { return new Error('Variant product is required'); }
      if (newVariant.product_id === '') { return new Error('Selected product is invalid'); }
      // Insert new variant into database
      const { error } = await supabase
        .from('product_variants')
        .insert(newVariant);
      // Handle insertion error
      if (error) {
        return new Error('Error adding variant to database: ' + error.message);
      }
    },
    null // Initial state
  );
  // Delete variant action
  const [deleteVariantError, submitVariantDelete, deleteVariantIsPending] = useActionState(
    async (previousState: any, formData: FormData) => {
      // Get variant SKU from form data
      const variantSKU = formData.get('sku') as string;
      const trimmedSKU = variantSKU.trim();
      if (!trimmedSKU) {
        return new Error('Variant SKU is required for deletion');
      }
      // Delete variant from database
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('sku', trimmedSKU);
      // Handle deletion error
      if (error) {
        return new Error('Error deleting variant from database: ' + error.message);
      }
    },
    null // Initial state
  );
  // Current list of products and variants in the database
  const [categories, setCategories] = useState<Category[]>([]);
  const [productReferences, setProductReferences] = useState<ProductReference[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  // List of options that require a dropdown
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  // Filter text for products and variants tables
  const [filterText, setFilterText] = useState("");
  const [variantFilterText, setVariantFilterText] = useState("");

  // Setup on first render: fetch session and items from database
  useEffect(() => {
    // Get current user session
    getInitialSession();
    // Get initial list of products and variants
    fetchCategories();
    fetchProductReferences();
    fetchProducts();
    fetchVariants();
    // Subscribe to real-time changes in the products and variants tables
    const product_channel = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
      (payload) => {
          console.log('new: ', payload.new);
      })
      .subscribe();
    const variant_channel = supabase
      .channel('variants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' },
      (payload) => {
          console.log('new: ', payload.new);
      })
      .subscribe();
    // Cleanup subscriptions on component unmount
    return () => {
      supabase.removeChannel(product_channel);
      supabase.removeChannel(variant_channel);
    };
  }, []);

  // Fetch user session from Supabase auth
  async function getInitialSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      // Handle error
      if (error) {
        throw error;
      }
      // Log data
      console.log(data.session);
      setSession(data.session);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }

  // Fetch categories from database
  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(
          `
          id,
          name
          `,
        )
        .order('name', { ascending: true })
      // Handle error
      if (error) {
          throw error;
      }
      // Log data
      console.log(data);
      setCategories(data);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
  }

  // Fetch reference products from database
  async function fetchProductReferences() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name
          `,
        )
        .order('name', { ascending: true })
      // Handle error
      if (error) {
          throw error;
      }
      // Log data
      console.log(data);
      setProductReferences(data);
    } catch (error) {
        console.error('Error fetching product references:', error);
    }
  }

  // Fetch products from database
  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          category_id,
          name,
          slug,
          brand,
          description,
          short_description,
          image_url,
          is_active,
          is_residential,
          is_commercial
          `,
        )
        .order('name', { ascending: true })
      // Handle error
      if (error) {
          throw error;
      }
      // Log data
      console.log(data);
      setProducts(data);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
  }

  // Fetch variants from database
  async function fetchVariants() {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(
          `
          product_id,
          sku,
          colour_name,
          colour_hex,
          size_label,
          price_per_sqm,
          price_per_unit,
          image_url,
          is_active
          `,
        )
        .order('sku', { ascending: true })
      // Handle error
      if (error) {
          throw error;
      }
      // Log data
      console.log(data);
      setVariants(data);
    } catch (error) {
        console.error('Error fetching variants:', error);
    }
  }

  // Apply filtering and sorting to products list for display
  const displayedProducts = products
    .filter((it) => {
      const query = filterText.trim().toLowerCase();
      if (!query) return true;
      return [it.name]
        .filter(Boolean)
        .some((value) => value?.toString().toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const left = (a.name ?? "").toString().toLowerCase();
      const right = (b.name ?? "").toString().toLowerCase();
      if (left === right) return 0;
      return left < right ? -1 : 1;
    });
  
  // Apply filtering and sorting to variants list for display
  const displayedVariants = variants
    .filter((it) => {
      const query = filterText.trim().toLowerCase();
      if (!query) return true;
      return [it.sku]
        .filter(Boolean)
        .some((value) => value?.toString().toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const left = (a.sku ?? "").toString().toLowerCase();
      const right = (b.sku ?? "").toString().toLowerCase();
      if (left === right) return 0;
      return left < right ? -1 : 1;
    });
  
  // Handle product deletion
  async function removeProduct(name: string) {
    // Get product name
    const trimmedName = name.trim();
    if (!trimmedName) {
      return new Error('Product name is required for deletion');
    }
    // Delete product from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('name', trimmedName);
    // Handle deletion error
    if (error) {
      return new Error('Error deleting product from database: ' + error.message);
    }
  }

  // Handle variant deletion
  async function removeVariant(sku: string) {
    // Get variant SKU
    const trimmedSku = sku.trim();
    if (!trimmedSku) {
      return new Error('Variant SKU is required for deletion');
    }
    // Delete variant from database
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('sku', trimmedSku);
    // Handle deletion error
    if (error) {
      return new Error('Error deleting variant from database: ' + error.message);
    }
  }

  // Return markup for admin page
  return session ? (
      <main className="flex-1 bg-white">
        {/* Header */}
        <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Admin Panel</h1>
        </section>
        {/* Main Body */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }} className="flex flex-col gap-8">
          {/* Add Product Form */}
          <div style={{ color: "#445152", border: '1px solid #445152', borderRadius: '8px', overflow: 'hidden', padding: '16px' }}>
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Product</h2>
              <p style={{ margin: '6px 0 0 0', color: '#374151' }}>Fill in the fields below to add or edit a product.</p>
            </div>
            {/* Form */}
            <form action={submitProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor='name'>
                Name:
                <input
                  type="text"
                  id="name"
                  name="name" 
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='category'>
                Category:
                <select value={selectedCategory} name="category" id="category" onChange={(e) => setSelectedCategory(e.target.value)}>
                  {/* Category options are populated dynamically */}
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label htmlFor='brand'>
                Brand:
                <input
                  type="text"
                  id="brand"
                  name="brand" 
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='description'>
                Description:
                <textarea
                  id="description"
                  name="description" 
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='short_description'>
                Short Description:
                <textarea
                  id="short_description"
                  name="short_description" 
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='image_url'>
                Image URL:
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='is_active'>
                Active:
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                />
              </label>
              <label htmlFor='is_residential'>
                Residential:
                <input
                  type="checkbox"
                  id="is_residential"
                  name="is_residential"
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                />
              </label>
              <label htmlFor='is_commercial'>
                Commercial:
                <input
                  type="checkbox"
                  id="is_commercial"
                  name="is_commercial"
                  aria-invalid={productError ? 'true' : 'false'}
                  disabled={productIsPending}
                />
              </label>
              <button type="submit" disabled={productIsPending} style={{ padding: '10px 18px', borderRadius: 6, border: 'none', background: '#0d5a57', color: 'white' }}>
                {productIsPending ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
          {/* Existing Products List */}
          <div style={{ color: "#445152", border: '1px solid #445152', borderRadius: '8px', overflow: 'hidden', padding: '16px' }}>
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Existing Products</h2>
              <p style={{ margin: '6px 0 0 0', color: '#374151' }}>View, filter and delete products from the database.</p>
            </div>
            {/* Product Filter */}
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Filter products</span>
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Search by name"
                  style={{ color: "#738081",padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', width: '100%' }}
                />
              </label>
            </div>
            {/* Products Table */}
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Category</th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Brand</th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedProducts.map((it) => (
                    <tr key={it.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px' }}>{it.name}</td>
                      <td style={{ padding: '10px' }}>{categories.find((c) => c.id === it.category_id)?.name ?? ''}</td>
                      <td style={{ padding: '10px' }}>{it.brand ?? ''}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: 8 }}>
                        <button onClick={() => removeProduct(it.name)} style={{ padding: '6px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Add Variant Form */}
          <div style={{ color: "#445152", border: '1px solid #445152', borderRadius: '8px', overflow: 'hidden', padding: '16px' }}>
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Product Variant</h2>
              <p style={{ margin: '6px 0 0 0', color: '#374151' }}>Fill in the fields below to add or edit a product variant.</p>
            </div>
            {/* Form */}
            <form action={submitVariant} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor='sku' >
                SKU:
                <input
                  type="text"
                  id="sku"
                  name="sku" 
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='product_id'>
                Product:
                <select value={selectedProduct} name="product_id" id="product_id" onChange={(e) => setSelectedProduct(e.target.value)}>
                  {/* Product options are populated dynamically */}
                  <option value="" disabled>Select a product</option>
                  {productReferences.map((product) => (
                    <option key={product.id} value={product.name}>{product.name}</option>
                  ))}
                </select>
              </label>
              <label htmlFor='colour_name'>
                Colour Name:
                <input
                  type="text"
                  id="colour_name"
                  name="colour_name" 
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='colour_hex'>
                Colour Hex:
                <input
                  type="text"
                  id="colour_hex"
                  name="colour_hex" 
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='size_label'>
                Size Label:
                <input
                  type="text"
                  id="size_label"
                  name="size_label" 
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='price_per_sqm'>
                Price per Square Meter:
                <input
                  type="number"
                  id="price_per_sqm"
                  name="price_per_sqm"
                  step="0.50"
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='price_per_unit'>
                Price per Unit:
                <input
                  type="number"
                  id="price_per_unit"
                  name="price_per_unit"
                  step="0.50"
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                  style={{ border: '2px solid #889192', borderRadius: 6}}
                />
              </label>
              <label htmlFor='image_url'>
                Image URL:
                <input
                  type="text"
                  id="image_url"
                  name="image_url"
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                />
              </label>
              <label htmlFor='is_active'>
                Active:
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  aria-invalid={variantError ? 'true' : 'false'}
                  disabled={variantIsPending}
                />
              </label>
              <button type="submit" disabled={variantIsPending} style={{ padding: '10px 18px', borderRadius: 6, border: 'none', background: '#0d5a57', color: 'white' }}>
                {variantIsPending ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
          {/* Existing Variants List */}
          <div style={{ color: "#445152", border: '1px solid #445152', borderRadius: '8px', overflow: 'hidden', padding: '16px' }}>
            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Existing Variants</h2>
              <p style={{ margin: '6px 0 0 0', color: '#374151' }}>View, filter and delete variants from the database.</p>
            </div>
            {/* Variants Filter */}
            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Filter variants</span>
                <input
                  value={variantFilterText}
                  onChange={(e) => setVariantFilterText(e.target.value)}
                  placeholder="Search by SKU"
                  style={{ padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', width: '100%' }}
                />
              </label>
            </div>
            {/* Variants Table */}
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>SKU</th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                    <th style={{ position: 'sticky', top: 0, background: 'white', zIndex: 2, textAlign: 'left', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVariants.map((it) => (
                    <tr key={it.sku} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px' }}>{it.sku}</td>
                      <td style={{ padding: '10px' }}>{productReferences.find((c) => c.id === it.product_id)?.name ?? ''}</td>
                      <td style={{ padding: '10px', display: 'flex', gap: 8 }}>
                        <button onClick={() => removeVariant(it.sku)} style={{ padding: '6px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4 }}>
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
    ) : (
      <main className="flex-1 bg-white">
        {/* Header */}
        <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Admin Panel</h1>
        </section>
        {/* Main Body */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }} className="flex flex-col gap-8">
          {/* Log in prompt */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', padding: '16px' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Please log in to access the admin panel.</h2>
            <Link href="/signIn" style={{ marginTop: 12, display: 'inline-block', padding: '10px 18px', borderRadius: 6, background: '#0d5a57', color: 'white' }}>
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
}