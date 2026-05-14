import Image from 'next/image';
import Link from 'next/link';
import { createServerClient } from '@/src/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SupabaseProduct {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
}

interface SupabaseVariant {
  price_per_sqm: number | null;
  price_per_unit: number | null;
  colour_name: string | null;
  size_label: string | null;
  image_url: string | null;
}

interface DrilldownProduct {
  id: string;
  name: string;
  brand: string | null;
  description: string;
  shortDescription: string | null;
  imageUrl: string;
  pricePerSqm: number | null;
  pricePerUnit: number | null;
  colourName: string | null;
  sizeLabel: string | null;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DrilldownPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getDrilldownProduct(resolvedParams.id);

  if (!product) {
    return (
      <main className="flex-1">
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold text-primary">Product unavailable</h1>
            <p className="mt-4 text-gray-600">
              Could not load the requested product from Supabase. Please check the URL and your database.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const images = [product.imageUrl || '/products/woodfloor.jpg'];
  const priceLabel = product.pricePerSqm ? `$${product.pricePerSqm.toFixed(2)}` : 'Price unavailable';
  const detailItems = [
    { label: 'Brand', value: product.brand || 'N/A' },
    { label: 'Colour', value: product.colourName || 'N/A' },
    { label: 'Size', value: product.sizeLabel || 'N/A' },
  ];

  return (
    <main className="flex-1">
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="relative w-full h-80 rounded-lg overflow-hidden shadow">
              <Image src={images[0]} alt={product.name} fill className="object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative h-24 rounded-lg overflow-hidden shadow">
                  <Image src={img} alt={`${product.name} image ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl text-primary font-bold mb-4">{product.name}</h2>

            <div className="text-4xl font-bold text-primary mb-4">{priceLabel}</div>
            <Link href="/cart">
              <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition">
                Add to Cart
              </button>
            </Link>

            <div className="mt-10">
              <h3 className="text-xl text-primary font-semibold mb-4">Product details</h3>
              <div className="grid grid-cols-1 gap-3 text-gray-700">
                {detailItems.map((item) => (
                  <div key={item.label} className="rounded-lg bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">{item.label}</div>
                    <div className="text-lg text-secondary font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">Description</h3>
          <p className="text-gray-700 bg-white rounded-xl p-6 shadow">{product.description || 'No short description is available for this product.'}</p>
        </div>
      </section>
    </main>
  );
}

async function getDrilldownProduct(productSlugOrId: string): Promise<DrilldownProduct | null> {
  try {
    const supabase = createServerClient();
    let { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, brand, description, short_description, image_url')
      .eq('slug', productSlugOrId)
      .eq('is_active', true)
      .maybeSingle();

    if (productError || !product) {
      const response = await supabase
        .from('products')
        .select('id, name, brand, description, short_description, image_url')
        .eq('id', productSlugOrId)
        .eq('is_active', true)
        .maybeSingle();

      product = response.data;
      productError = response.error;
    }

    if (productError || !product) {
      return null;
    }

    const { data: variant } = await supabase
      .from('product_variants')
      .select('price_per_sqm, price_per_unit, colour_name, size_label, image_url')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description ?? product.short_description ?? 'No description available.',
      shortDescription: product.short_description,
      imageUrl: variant?.image_url ?? product.image_url ?? '/products/woodfloor.jpg',
      pricePerSqm: variant?.price_per_sqm ?? null,
      pricePerUnit: variant?.price_per_unit ?? null,
      colourName: variant?.colour_name ?? null,
      sizeLabel: variant?.size_label ?? null,
    };
  } catch (error) {
    return null;
  }
}
