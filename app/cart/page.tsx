'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>([
        { id: '1', name: 'Oak Flooring', price: 89.99, quantity: 2, image: '/oak.jpg' },
        { id: '2', name: 'Maple Hardwood', price: 129.99, quantity: 1, image: '/maple.jpg' },
    ]);

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            setItems(items.filter(item => item.id !== id));
        } else {
            setItems(items.map(item => item.id === id ? { ...item, quantity } : item));
        }
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotal = total;
    const tax = subtotal * 0.08;
    const finalTotal = subtotal + tax;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            {items.length === 0 ? (
                <p className="text-gray-600">Your cart is empty. <Link href="/" className="text-blue-600">Continue shopping</Link></p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-lg shadow flex gap-4">
                                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                                        <span className="px-3 py-1">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 bg-gray-200 rounded">+</button>
                                        <button onClick={() => updateQuantity(item.id, 0)} className="ml-auto text-red-600 hover:underline">Remove</button>
                                    </div>
                                </div>
                                <p className="font-semibold mt-2">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow h-fit">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
                            Proceed to Checkout
                        </button>
                        <Link href="/" className="block w-full mt-3 text-center text-blue-600 hover:underline">Continue Shopping</Link>
                    </div>
                </div>
            )}
        </main>
    );
}