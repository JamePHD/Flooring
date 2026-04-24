'use client';

import Link from 'next/link';
import { useState } from 'react';
import Logo from '../components/logo';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Solid Flooring',
    'Engineered',
    'Laminate',
    'Vinyl',
    'Hybrid',
    'Bamboo'
  ];

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

  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: '16px', background: '#15c4c4', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <Logo />
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Flooring Solulu</h1>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Just Solutions</p>
          </div>
        </div>

        <nav style={{ marginTop: '10px' }}>
          <Link href="/" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
          <Link href="/products" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500, borderBottom: '2px solid white' }}>Products</Link>
          <Link href="/compare" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Compare</Link>
          <Link href="#" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>About Us</Link>
          <Link href="#" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>News</Link>
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: '#15c4c4', color: 'white', padding: '40px 16px', marginTop: '60px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Flooring Solulu</h3>
            <p style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>Just Solutions - Premium flooring for your dream home with expert guidance and fast delivery.</p>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Shop</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
              <li><Link href="/products" style={{ color: 'white', textDecoration: 'none' }}>All Products</Link></li>
              <li><Link href="#" style={{ color: 'white', textDecoration: 'none' }}>Engineered Flooring</Link></li>
              <li><Link href="#" style={{ color: 'white', textDecoration: 'none' }}>Laminate Flooring</Link></li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Company</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '14px' }}>
              <li><Link href="#" style={{ color: 'white', textDecoration: 'none' }}>About Us</Link></li>
              <li><Link href="#" style={{ color: 'white', textDecoration: 'none' }}>Contact</Link></li>
              <li><Link href="#" style={{ color: 'white', textDecoration: 'none' }}>Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Contact</h3>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>Email: info@flooring-solulu.com</p>
            <p style={{ opacity: 0.9, fontSize: '14px' }}>Phone: 1300 119 313</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px', textAlign: 'center', fontSize: '14px', opacity: 0.8 }}>
          <p style={{ margin: 0 }}>&copy; 2026 Flooring Solulu. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
