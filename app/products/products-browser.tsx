'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export interface ProductCardItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  isResidential: boolean;
  isCommercial: boolean;
  createdAt: string;
}

export interface ProductCategory {
  name: string;
  slug: string;
}

interface ProductsBrowserProps {
  products: ProductCardItem[];
  categories: ProductCategory[];
}

export default function ProductsBrowser({
  products,
  categories,
}: ProductsBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedUse, setSelectedUse] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [searchTerm, setSearchTerm] = useState('');

  const brands = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.brand).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === 'all' || product.categorySlug === selectedCategory;
        const matchesBrand =
          selectedBrand === 'all' || product.brand === selectedBrand;
        const matchesUse =
          selectedUse === 'all' ||
          (selectedUse === 'residential' && product.isResidential) ||
          (selectedUse === 'commercial' && product.isCommercial);
        const matchesSearch =
          !normalizedSearch ||
          [product.name, product.brand, product.categoryName, product.description]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));

        return matchesCategory && matchesBrand && matchesUse && matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'brand-asc':
            return (a.brand || '').localeCompare(b.brand || '') || a.name.localeCompare(b.name);
          case 'brand-desc':
            return (b.brand || '').localeCompare(a.brand || '') || a.name.localeCompare(b.name);
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'name-asc':
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [products, searchTerm, selectedBrand, selectedCategory, selectedUse, sortBy]);

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedUse !== 'all' ||
    searchTerm.trim() !== '';

  function clearFilters() {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedUse('all');
    setSearchTerm('');
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
      <aside className="space-y-8">
        <FilterGroup title="Categories">
          <CategoryButton
            isSelected={selectedCategory === 'all'}
            label="All"
            onClick={() => setSelectedCategory('all')}
          />
          {categories.map((category) => (
            <CategoryButton
              key={category.slug}
              isSelected={selectedCategory === category.slug}
              label={category.name}
              onClick={() => setSelectedCategory(category.slug)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Brands">
          <CategoryButton
            isSelected={selectedBrand === 'all'}
            label="All brands"
            onClick={() => setSelectedBrand('all')}
          />
          {brands.map((brand) => (
            <CategoryButton
              key={brand}
              isSelected={selectedBrand === brand}
              label={brand}
              onClick={() => setSelectedBrand(brand)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Use">
          <CategoryButton
            isSelected={selectedUse === 'all'}
            label="All uses"
            onClick={() => setSelectedUse('all')}
          />
          <CategoryButton
            isSelected={selectedUse === 'residential'}
            label="Residential"
            onClick={() => setSelectedUse('residential')}
          />
          <CategoryButton
            isSelected={selectedUse === 'commercial'}
            label="Commercial"
            onClick={() => setSelectedUse('commercial')}
          />
        </FilterGroup>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <label className="sr-only" htmlFor="product-search">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products, brands, or categories"
            className="h-11 border border-gray-300 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#15C4C4]"
          />

          <label className="sr-only" htmlFor="product-sort">
            Sort products
          </label>
          <select
            id="product-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-11 border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-[#15C4C4]"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="brand-asc">Brand A-Z</option>
            <option value="brand-desc">Brand Z-A</option>
            <option value="newest">Newest</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="h-11 border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition enabled:hover:border-[#15C4C4] enabled:hover:text-[#0B6A6A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        <div className="mb-4 text-sm font-medium text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {filteredProducts.length === 0 ? (
          <div className="border border-dashed border-gray-300 bg-white p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Try changing the category, brand, use, or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden border border-gray-200 bg-white"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || '/images/flooringplaceholder.jpg'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-h-52 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#109494]">
                      {product.categoryName || 'Flooring'}
                    </span>
                    {product.brand ? (
                      <span className="truncate text-xs text-gray-500">{product.brand}</span>
                    ) : null}
                  </div>
                  <h3 className="text-lg font-bold text-gray-950">{product.name}</h3>
                  <p className="line-clamp-3 text-sm leading-6 text-gray-600">
                    {product.shortDescription ||
                      product.description ||
                      'Premium flooring selected for Australian homes.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                    {product.isResidential ? (
                      <span className="border border-gray-200 px-2 py-1">Residential</span>
                    ) : null}
                    {product.isCommercial ? (
                      <span className="border border-gray-200 px-2 py-1">Commercial</span>
                    ) : null}
                  </div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-auto inline-flex h-10 items-center justify-center bg-[#15C4C4] px-4 text-sm font-bold text-white transition hover:bg-[#109494]"
                  >
                    View Product
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FilterGroup({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-[#0B6A6A]">{title}</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {children}
      </div>
    </div>
  );
}

function CategoryButton({
  isSelected,
  label,
  onClick,
}: {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-10 shrink-0 border px-4 text-left text-sm font-semibold transition lg:w-full',
        isSelected
          ? 'border-[#15C4C4] bg-[#15C4C4] text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-[#15C4C4] hover:text-[#0B6A6A]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
