import { createServerClient } from '@/src/lib/supabase/server';
import ProductsBrowser, {
  ProductCardItem,
  ProductCategory,
} from './products-browser';

<<<<<<< Updated upstream
export const dynamic = 'force-dynamic';

interface SupabaseCategory {
  name: string;
  slug: string;
}

interface SupabaseProduct {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  categories: SupabaseCategory | SupabaseCategory[] | null;
  is_residential: boolean | null;
  is_commercial: boolean | null;
  created_at: string;
}

export default async function ProductsPage() {
  const { products, categories, error } = await getProductsPageData();
=======
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Logo from '../components/logo';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      setCategoryError(null);

      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`Failed to load categories (${response.status})`);
        }

        const data = await response.json();
        const names = Array.isArray(data)
          ? (data as any[])
              .map((item) => item?.name)
              .filter((name) => typeof name === 'string')
          : [];

        setCategories(['All', ...names]);
      } catch (error) {
        console.error('Unable to load categories', error);
        setCategoryError('Unable to load categories');
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  const categoriesToRender = loadingCategories ? ['All'] : categories;

  const products = [
    { id: 1, name: 'Premium Oak Engineered', category: 'Engineered' },
    { id: 2, name: 'Solid Blackbutt Flooring', category: 'Solid Flooring' },
    { id: 3, name: 'Laminate Dark Walnut', category: 'Laminate' },
    { id: 4, name: 'Luxury Vinyl Plank Grey', category: 'Vinyl' },
    { id: 5, name: 'Hybrid Click System Oak', category: 'Hybrid' },
    { id: 6, name: 'Strand Woven Bamboo', category: 'Bamboo' },
    { id: 7, name: 'Engineered Maple Premium', category: 'Engineered' },
    { id: 8, name: 'Solid Mountain Ash', category: 'Solid Flooring' },
    { id: 9, name: 'Laminate Light Oak', category: 'Laminate' },
    { id: 10, name: 'Vinyl Loose Lay Timber', category: 'Vinyl' },
    { id: 11, name: 'Hybrid Blackbutt Click', category: 'Hybrid' },
    { id: 12, name: 'Bamboo Natural Strand', category: 'Bamboo' },
  ];

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);
>>>>>>> Stashed changes

  return (
    <main className="flex-1 bg-white">
      <section className="bg-[#0B6A6A] px-4 py-12 text-center text-white sm:px-6">
        <h1 className="text-4xl font-bold">Our Products</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-white/90">
          Browse our current range of active flooring products from Supabase.
        </p>
      </section>

<<<<<<< Updated upstream
      {error ? (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
=======
        <nav style={{ marginTop: '10px' }}>
          <Link href="/" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
          <Link href="/products" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500, borderBottom: '2px solid white' }}>Products</Link>
          <Link href="/compare" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Compare</Link>
          <Link href="#" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>About Us</Link>
          <Link href="#" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Vlogs</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Our Products</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Browse our extensive collection of premium flooring options</p>
        </section>

        <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px' }}>
            <aside style={{ width: '200px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#15c4c4' }}>Categories</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 12px',
                      border: selectedCategory === cat ? '2px solid #15c4c4' : '1px solid #e5e7eb',
                      borderRadius: '4px',
                      background: selectedCategory === cat ? '#15c4c4' : 'white',
                      color: selectedCategory === cat ? 'white' : '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </aside>

            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ height: '200px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: '14px' }}>Product Image</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#15c4c4', fontWeight: 'bold' }}>{product.category}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111827' }}>{product.name}</h3>
                    <Link href={'/drilldown'}>
                      <button
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: '#15c4c4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#0d7370'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#15c4c4'}
                      >
                        Compare
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
>>>>>>> Stashed changes
          </div>
        </section>
      ) : null}

      <ProductsBrowser products={products} categories={categories} />
    </main>
  );
}

async function getProductsPageData(): Promise<{
  products: ProductCardItem[];
  categories: ProductCategory[];
  error: string | null;
}> {
  try {
    const supabase = createServerClient();

    const [{ data: productRows, error: productsError }, { data: categoryRows, error: categoriesError }] =
      await Promise.all([
        supabase
          .from('products')
          .select('id, name, slug, brand, short_description, description, image_url, is_residential, is_commercial, created_at, categories(name, slug)')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('categories')
          .select('name, slug')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

    if (productsError) {
      throw productsError;
    }

    if (categoriesError) {
      throw categoriesError;
    }

    const products = ((productRows || []) as SupabaseProduct[]).map((product) => {
      const category = Array.isArray(product.categories)
        ? product.categories[0]
        : product.categories;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        shortDescription: product.short_description,
        description: product.description,
        imageUrl: product.image_url,
        categoryName: category?.name || null,
        categorySlug: category?.slug || null,
        isResidential: product.is_residential ?? false,
        isCommercial: product.is_commercial ?? false,
        createdAt: product.created_at,
      };
    });

    return {
      products,
      categories: (categoryRows || []) as ProductCategory[],
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load Supabase products.';

    return {
      products: [],
      categories: [],
      error: `Products could not be loaded from Supabase: ${message}`,
    };
  }
}
