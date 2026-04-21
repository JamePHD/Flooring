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

    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmitQuote = async () => {
        // Validate required fields
        if (!customerName.trim()) {
            setSubmitMessage({ type: 'error', text: 'Please enter your name' });
            return;
        }
        if (!customerEmail.trim() || !isValidEmail(customerEmail)) {
            setSubmitMessage({ type: 'error', text: 'Please enter a valid email address' });
            return;
        }
        if (items.length === 0) {
            setSubmitMessage({ type: 'error', text: 'Please add items to your quote' });
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const response = await fetch('/api/send-quote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerNotes,
                    items: items.map((item) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    subtotal,
                    tax,
                    finalTotal,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send quote');
            }

            setSubmitMessage({ type: 'success', text: 'Quote request sent successfully! The sales team will contact you soon.' });
            // Reset form
            setCustomerName('');
            setCustomerEmail('');
            setCustomerNotes('');
        } catch (error) {
            setSubmitMessage({ type: 'error', text: 'Failed to send quote request. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <h1 className="text-3xl font-bold mb-8">Request a Quote</h1>

            {items.length === 0 ? (
                <p className="text-gray-600">Your cart is empty. <Link href="/" className="text-blue-600">Continue shopping</Link></p>
            ) : (
                <div className="space-y-8">
                    <div className="space-y-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-white p-4 rounded-lg shadow flex gap-4">
                                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                    <p className="text-gray-600">${item.price.toFixed(2)}/m²</p>
                                    <div className="flex gap-2 mt-2 items-center">
                                        <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)} className="px-3 py-1 border rounded w-20" />
                                        <span>m²</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => updateQuantity(item.id, 0)} className="text-red-600 hover:underline">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4">Your Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Name <span className="text-red-600">*</span></label>
                                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Email Address <span className="text-red-600">*</span></label>
                                    <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Enter your email address" className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${ customerEmail && !isValidEmail(customerEmail) ? 'border-red-500 focus:ring-red-600' : 'focus:ring-blue-600' }`} />
                                    {customerEmail && !isValidEmail(customerEmail) && (
                                        <p className="text-red-600 text-sm mt-1">Please enter a valid email address</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Additional Notes</label>
                                    <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Any additional information for the sales representative" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" rows={4} />
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-4">Fields marked with <span className="text-red-600">*</span> are required</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <h2 className="text-xl font-bold mb-4">Quote Summary</h2>
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
                                <span>Estimated Total</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                            <button onClick={handleSubmitQuote} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Sending...' : 'Request Quote'}
                            </button>
                            {submitMessage && (
                                <div className={`mt-3 p-3 rounded-lg text-sm ${submitMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {submitMessage.text}
                                </div>
                            )}
                            <Link href="/" className="block w-full mt-3 text-center text-blue-600 hover:underline">Continue Shopping</Link>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}