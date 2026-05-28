import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "./product-actions";
import { createServerClient } from "@/src/lib/supabase/server";
import { StoredCompareProduct } from "@/app/lib/local-storage";

export const dynamic = "force-dynamic";

interface ProductCategory {
  name: string;
  slug: string;
}

interface ProductVariant {
  sku: string;
  colour_name: string | null;
  price_per_sqm: number | null;
  price_per_unit: number | null;
  stock_status: number;
  image_url: string | null;
  is_active: boolean;
}

interface ProductAttribute {
  value: string;
  attributes: {
    name: string;
    slug: string;
    unit: string | null;
    attribute_groups: {
      name: string;
      slug: string;
    } | null;
  } | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  is_residential: boolean | null;
  is_commercial: boolean | null;
  categories: ProductCategory | ProductCategory[] | null;
  product_variants: ProductVariant[];
  product_attributes: ProductAttribute[];
}

interface RelatedProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  image_url: string | null;
}

export default async function ProductDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, relatedProducts } = await getProductPageData(id);

  if (!product) {
    notFound();
  }

  const category = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;
  const activeVariants = product.product_variants.filter((variant) => variant.is_active);
  const galleryImages = [
    product.image_url,
    ...activeVariants.map((variant) => variant.image_url),
  ].filter(Boolean) as string[];
  const images = galleryImages.length > 0 ? galleryImages : ["/products/woodfloor.jpg"];
  const priceLabel = getPriceLabel(activeVariants);
  const attributesByGroup = groupAttributes(product.product_attributes);
  const cartItem = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: getLowestPrice(activeVariants),
    quantity: 1,
    image: images[0],
    sqmPerBox: 1,
  };
  const compareProduct = createCompareProduct(product, category);

  return (
    <main className="flex-1 bg-white">
      <section style={{ background: "linear-gradient(to right, #0d5a57, #118b85, #15c4c4)" }} className="border-b border-gray-200 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/products" className="text-sm font-semibold text-white/80 hover:text-white">
            Back to products
          </Link>
          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-white/75">
              {category?.name || "Flooring"}
            </p>
            <h1 className="mt-2 text-4xl font-bold">{product.name}</h1>
            {product.brand ? (
              <p className="mt-3 text-lg text-white/85">{product.brand}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="space-y-4">
          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {images.slice(0, 3).map((image, index) => (
              <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${product.name} preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-600">
            {product.description ||
              product.short_description ||
              "Premium flooring selected for Australian homes."}
          </p>

          <div className="mt-8 text-3xl font-bold text-[#0B6A6A]">{priceLabel}</div>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.is_residential ? (
              <span className="border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                Residential
              </span>
            ) : null}
            {product.is_commercial ? (
              <span className="border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                Commercial
              </span>
            ) : null}
          </div>

          <ProductActions cartItem={cartItem} compareProduct={compareProduct} />

          <div className="mt-10">
            <h2 className="text-xl font-bold text-[#0B6A6A]">Available variants</h2>
            {activeVariants.length > 0 ? (
              <div className="mt-4 divide-y divide-gray-200 border border-gray-200">
                {activeVariants.map((variant) => (
                  <div key={variant.sku} className="grid gap-1 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {variant.colour_name || "Standard"}
                      </div>
                      <div className="text-sm text-gray-500">SKU: {variant.sku}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {formatVariantPrice(variant)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-600">No active variants listed.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#0B6A6A] py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Specifications</h2>

          {attributesByGroup.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {attributesByGroup.map((group) => (
                <div key={group.name} className="bg-white p-5 text-gray-900">
                  <h3 className="font-bold text-[#0B6A6A]">{group.name}</h3>
                  <dl className="mt-4 space-y-3">
                    {group.attributes.map((attribute) => (
                      <div key={attribute.name} className="flex justify-between gap-4 text-sm">
                        <dt className="text-gray-500">{attribute.name}</dt>
                        <dd className="text-right font-semibold text-gray-900">
                          {attribute.value}
                          {attribute.unit ? ` ${attribute.unit}` : ""}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-white/80">No specifications listed yet.</p>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0B6A6A]">Related products</h2>
          {relatedProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/products/${related.slug}`}
                  className="group border border-gray-200 bg-white transition hover:border-[#15C4C4]"
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={related.image_url || "/images/flooringplaceholder.jpg"}
                      alt={related.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    {related.brand ? (
                      <p className="text-xs font-bold uppercase tracking-wide text-[#109494]">
                        {related.brand}
                      </p>
                    ) : null}
                    <h3 className="mt-1 font-bold text-gray-950 group-hover:text-[#0B6A6A]">
                      {related.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-600">No related products found yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

async function getProductPageData(slug: string): Promise<{
  product: ProductRow | null;
  relatedProducts: RelatedProductRow[];
}> {
  const supabase = createServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, brand, description, short_description, image_url, is_residential, is_commercial, categories(name, slug), product_variants(sku, colour_name, price_per_sqm, price_per_unit, stock_status, image_url, is_active), product_attributes(value, attributes(name, slug, unit, attribute_groups(name, slug)))"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !product) {
    return { product: null, relatedProducts: [] };
  }

  const row = product as unknown as ProductRow;
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;

  let relatedProducts: RelatedProductRow[] = [];
  if (category?.slug) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, brand, image_url, categories!inner(slug)")
      .eq("is_active", true)
      .eq("categories.slug", category.slug)
      .neq("id", row.id)
      .limit(3);

    relatedProducts = ((data || []) as RelatedProductRow[]).map((related) => ({
      id: related.id,
      name: related.name,
      slug: related.slug,
      brand: related.brand,
      image_url: related.image_url,
    }));
  }

  return { product: row, relatedProducts };
}

function getPriceLabel(variants: ProductVariant[]) {
  const lowestPrice = getLowestPrice(variants);

  if (lowestPrice <= 0) {
    return "Price on request";
  }

  return `From ${formatCurrency(lowestPrice)}`;
}

function getLowestPrice(variants: ProductVariant[]) {
  const prices = variants
    .flatMap((variant) => [variant.price_per_sqm, variant.price_per_unit])
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (prices.length === 0) {
    return 0;
  }

  return Math.min(...prices);
}

function formatVariantPrice(variant: ProductVariant) {
  if (variant.price_per_sqm && variant.price_per_sqm > 0) {
    return `${formatCurrency(variant.price_per_sqm)} per m2`;
  }

  if (variant.price_per_unit && variant.price_per_unit > 0) {
    return `${formatCurrency(variant.price_per_unit)} per unit`;
  }

  return "Price on request";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function groupAttributes(productAttributes: ProductAttribute[]) {
  const groups = new Map<
    string,
    { name: string; attributes: { name: string; value: string; unit: string | null }[] }
  >();

  for (const productAttribute of productAttributes) {
    const attribute = productAttribute.attributes;
    if (!attribute) {
      continue;
    }

    const groupName = attribute.attribute_groups?.name || "Other";
    const group = groups.get(groupName) || { name: groupName, attributes: [] };
    group.attributes.push({
      name: attribute.name,
      value: formatAttributeValue(productAttribute.value),
      unit: attribute.unit,
    });
    groups.set(groupName, group);
  }

  return Array.from(groups.values());
}

function formatAttributeValue(value: string) {
  if (value.toLowerCase() === "true") {
    return "Yes";
  }

  if (value.toLowerCase() === "false") {
    return "No";
  }

  return value;
}

function createCompareProduct(
  product: ProductRow,
  category: ProductCategory | null | undefined
): StoredCompareProduct {
  const compareProduct: StoredCompareProduct = {
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
  };

  for (const productAttribute of product.product_attributes) {
    const attribute = productAttribute.attributes;
    if (attribute?.slug) {
      compareProduct[attribute.slug] = formatAttributeValue(productAttribute.value);
    }
  }

  return compareProduct;
}
