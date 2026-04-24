'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function DrilldownPage() {
  const product = {
    name: 'Oak Flooring',
    description:
      'Premium engineered oak flooring with a matte brushed finish, perfect for modern Australian homes.',
    price: 129.95,
    unit: 'per m²',
    images: [
      '/products/woodfloor.jpg',
      '/products/woodfloor.jpg',
      '/products/woodfloor.jpg',
    ],
    features: [
      'Real European Oak Veneer',
      'Matte Brushed Finish',
      'Tongue & Groove System',
      'Eco-Friendly',
        '25 Year Residential Warranty',
    ],
    specs: {
      thickness: '15mm',
      width: '190mm',
      length: '1900mm',
      wearLayer: '4mm',
      finish: 'Matte Brushed',
      warranty: '25 Years Residential',
    },
  };

  const relatedProducts = [
    {
      name: 'Spruce Flooring',
      image: 'from-gray-200 to-gray-100',
      color: 'bg-gray-500',
    },
    {
      name: 'Birch Flooring',
      image: 'from-yellow-100 to-yellow-50',
      color: 'bg-yellow-500',
    },
    {
      name: 'Acacia Flooring',
      image: 'from-orange-100 to-orange-50',
      color: 'bg-orange-500',
    },
  ];

  return (
    <main className="flex-1">


      {/* Product Content */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative w-full h-80 rounded-lg overflow-hidden shadow">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="relative h-24 rounded-lg overflow-hidden shadow"
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h2 className="text-3xl text-primary font-bold mb-4">{product.name}</h2>
            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="text-4xl font-bold text-primary mb-4">
              ${product.price} <span className="text-lg text-gray-500">{product.unit}</span>
            </div>
            <Link href="/cart">
                <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-secondary transition">
                Add to Cart
                </button>
            </Link>
            {/* Features */}
            <div className="mt-10">
              <h3 className="text-xl text-primary font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2 text-gray-700">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">✔</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="bg-primary py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6">Specifications</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="p-4 bg-white rounded-lg shadow">
                <div className="text-sm text-gray-500 capitalize">{key}</div>
                <div className="text-lg text-secondary font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl text-primary font-bold mb-8">Related Products</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {relatedProducts.map((p, i) => (
              <div
                key={i}
                className="rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <div
                  className={`h-40 bg-gradient-to-br ${p.image} flex items-center justify-center`}
                >
                  <div
                    className={`w-16 h-16 ${p.color} rounded-full opacity-80`}
                  ></div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-primary text-lg">{p.name}</h4>
                  <Link
                    href="#"
                    className="text-primary font-medium hover:underline"
                  >
                    View Product →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
