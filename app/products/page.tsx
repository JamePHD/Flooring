import { createServerClient } from '@/src/lib/supabase/server';
import ProductsBrowser, {
  ProductCardItem,
  ProductCategory,
} from './products-browser';

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

  return (
    <main className="flex-1 bg-white">
      <section style={{background: "linear-gradient(to right, #0d5a57, #118b85, #15c4c4)", color: 'white', padding: '40px 16px', textAlign: 'center', marginBottom: '40px', width:'100%' }}>
        <h1 className="text-4xl font-bold">Our Products</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-white/90">
          Browse our current range of active flooring products from Supabase.
        </p>  
      </section>

      {error ? (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
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

    const products = ((productRows || []) as unknown as SupabaseProduct[]).map((product) => {
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
