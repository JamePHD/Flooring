"use client";

import Link from "next/link";
import Logo from "../components/logo";

import { useState } from "react";

const CompareCategories = [
    {label: "PRODUCT NAME", key: "name"},
    {label: "PRODUCT CODE", key: "code"},
    {label: "BRAND", key: "brand"},
    { label: "DESCRIPTION", key: "description" },
    { label: "WEIGHT (KG)", key: "weight" },
    { label: "PLANK THICKNESS (MM)", key: "thickness" },
    { label: "PLANK WIDTH (MM)", key: "width" },
    { label: "PLANK LENGTH (MM)", key: "length" },
    { label: "WARRANTY (YEARS)", key: "warranty" },
    { label: "RANGE", key: "range" },

];

const testProducts = [
    {id: 1,
     name: "Godfrey Hirst Zenith Galactic Grove",
     code: "560",
     description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
     weight: " ",
     thickness: "10",
     width: "190",
     length: "1900",
     warranty: "25",    
     range: "Zenith"
    },
    {id: 2,
        name: "Godfrey Hirst Zenith Cosmic Oak",
        code: "561",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        weight: " ",           
        thickness: "10",
        width: "190",
        length: "1900",
        warranty: "25",    
        range: "Zenith"
    }

]

const testCart = [
    {id: 1, name: "Godfrey Hirst Zenith Galactic Grove", code: "560", image: "🌲" },
    {id: 2, name: "Godfrey Hirst Zenith Cosmic Oak", code: "561", image: "🌲" },
    { id: 3, name: "Luxury Vinyl Plank", code: "562", image: "🌿" },
    { id: 4, name: "Premium Oak Timber", code: "563", image: "🌳" },
    { id: 5, name: "Eco Bamboo Strands", code: "564", image: "🌱" },
    { id: 6, name: "Modern Grey Laminate", code: "565", image: "✨" },
    { id: 7, name: "Hybrid Stone Core", code: "566", image: "⚡" },
]

export default function ComparisonPage() {
    const [comparedProducts, setComparedProducts] = useState(testProducts);

    const removeProducts = (id: number) => {
        setComparedProducts(comparedProducts.filter(p => p.id !== id));
    };

    const selectProductToCompare = (productFromCart: any) => {
        if(!comparedProducts.find(p => p.id === productFromCart.id)) {
            const newProduct = {...productFromCart,
                                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", weight: " ", thickness: "10", width: "190", length: "1900", warranty: "25", range: "Zenith"};
    
        setComparedProducts([...comparedProducts, newProduct]);
        }
    };

    const [isCartOpen, setIsCartOpen] = useState(false);

        return (
                <div>
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
                            <Link href="/products" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>Products</Link>
                            <Link href="/compare" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500, borderBottom: '2px solid white' }}>Compare</Link>
                            <Link href="#" style={{ marginRight: '20px', color: 'white', textDecoration: 'none', fontWeight: 500 }}>About Us</Link>
                            <Link href="#" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Vlogs</Link>
                        </nav>
                    </header>
                    <div style={{ background: "#ffffff", width: '100%' }}>
                        <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center', marginBottom: '40px', width:'100%' }}>
                            <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Compare Products</h1>
                            <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}> </p>
                        </section>
                        {comparedProducts.length === 0 ? (
                            <p>No products added to compare.</p>
                        ) : (
                            <div style={{ overflowX: "auto", paddingBottom: 40 }}>
                                
                            <div style={{ width: '70%', margin: '0 auto 30px auto', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
    
    {}
    <div 
        onClick={() => setIsCartOpen(!isCartOpen)}
        style={{ 
            padding: '15px 20px', 
            background: '#f9fafb', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            borderBottom: isCartOpen ? '1px solid #e5e7eb' : 'none'
        }}
    >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>
            Add Products from your Cart {comparedProducts.length > 0 && `(${testCart.length})`}
        </h3>
        <span style={{ transform: isCartOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>
            ▼
        </span>
    </div>

    {/* Phần nội dung Menu - Sẽ trượt xuống khi isCartOpen = true */}
    {isCartOpen && (
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#fff',padding: '10px'}}>
            {testCart.map(item => (
                <div 
                    key={item.id}
                    onClick={() => {
                        selectProductToCompare(item);
            
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 15px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdfa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '24px' }}>{item.image}</span>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Code: {item.code}</div>
                        </div>
                    </div>
                    <div style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        background: '#15c4c4', 
                        color: 'white', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                    }}>
                        + Add
                    </div>
                </div>
            ))}
            
            {testCart.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>Your cart is empty</p>
            )}
        </div>
    )}
</div>
                        
                                <table style={{width: "70%", borderCollapse: "collapse", background: "#fff", margin: "0 auto" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: "1px solid #000000", padding: 12, background: "#f3f4f6", minWidth: 180 }}></th>
                                            {comparedProducts.map(product => (
                                                <th key={product.id} style={{ border: "1px solid #000000", padding: 12, background: "#f3f4f6", minWidth: 220, position: 'relative' }}>
                                                    <button onClick={() => removeProducts(product.id)} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%',
                                                        background: '#696969', border: 'none', fontSize: 14, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                                    <div style={{ width: '100%', height: 120, background: '#e5e7eb', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ color: '#9ca3af', fontSize: 14 }}>Product Image</span>
                                                    </div>
                                                    <div style={{ fontWeight: 300, fontSize: 18, color: "#000000" }}>{product.name}</div>
                                                    <div style={{ fontSize: 14, color: "#000000" }}>{product.code}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CompareCategories.map(cat => (
                                            <tr key={cat.key}>
                                                <td style={{ border: "1px solid #000000", padding: 12, fontWeight: 700, background: "#f9fafb", color: "#000000", textAlign: "center" }}>{cat.label}</td>
                                                {comparedProducts.map(product => (
                                                    <td key={product.id + cat.key} style={{ border: "1px solid #000000", padding: 12, color: "#000000"}}>
                                                        {product[cat.key as keyof typeof product] ?? "-"}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                            </div>
                        )}
                    </div>
                </div>
        );
}