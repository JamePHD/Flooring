'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    getStoredCartItems,
    setStoredCartItems,
    StoredCartItem,
} from '@/app/lib/local-storage';

export default function CartPage() {
    const [items, setItems] = useState<StoredCartItem[]>([]);
    const [hasLoadedCart, setHasLoadedCart] = useState(false);

    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');

    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [detailAddress, setAddress] = useState('');

    const [carryRequired, setCarryRequired] = useState(false);
    const [installationRequired, setInstallationRequired] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setItems(getStoredCartItems());
        setHasLoadedCart(true);
    }, []);

    useEffect(() => {
        if (hasLoadedCart) {
            setStoredCartItems(items);
        }
    }, [hasLoadedCart, items]);

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
                    phone,
                    city,
                    postalCode,
                    detailAddress,
                    carryRequired,
                    installationRequired,
                    items: items.map((item) => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        sqmPerBox: item.sqmPerBox
                    })),
                    subtotal,
                    tax,
                    finalTotal,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const errorMessage =
                    typeof errorBody?.error === 'string'
                        ? errorBody.error
                        : 'Failed to send quote';
                throw new Error(errorMessage);
            }

            setSubmitMessage({ type: 'success', text: 'Quote request sent successfully! The sales team will contact you soon.' });
            // Reset form
            setCustomerName('');
            setCustomerEmail('');
            setCustomerNotes('');
            setCarryRequired(false);
            setInstallationRequired(false);
        } catch (error) {
            setSubmitMessage({
                type: 'error',
                text: error instanceof Error
                    ? error.message
                    : 'Failed to send quote request. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((currentItems) => currentItems.filter(item => item.id !== id));
        } else {
            setItems((currentItems) =>
                currentItems.map(item => item.id === id ? { ...item, quantity } : item)
            );
        }
    };

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const subtotal = total;
    const tax = subtotal * 0.08;
    const finalTotal = subtotal + tax;

    return (
        <main className="flex-1">
            <section style={{ background: 'linear-gradient(to right, #0d5a57, #118b85, #15c4c4)', color: 'white', padding: '40px 16px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Request a Quote</h1>
                <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>Fill out the form below to request a personalized quote from our team.</p>
            </section>

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }} className="flex flex-col gap-8">

                {items.length === 0 ? (
                    <p className="text-gray-600">Your cart is empty. <Link href="/products" className="text-blue-600">Continue shopping</Link></p>
                ) : (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            {items.map(item => (
                                <div key={item.id} 
                                    style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        padding: '16px',
                                        display: 'flex',
                                        gap: '12px'
                                    }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-gray-600">
                                            {item.price > 0 ? `$${item.price.toFixed(2)}/m2` : 'Price on request'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">{item.sqmPerBox} sqm per box</p>
                                        <div className="flex gap-2 mt-2 items-center">
                                            <input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)} className="px-3 py-1 border rounded w-20" />
                                            <span>boxes</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        <p className="font-semibold">
                                            {item.price > 0 ? `$${(item.price * item.quantity).toFixed(2)}` : 'TBC'}
                                        </p>
                                        <button onClick={() => updateQuantity(item.id, 0)} className="text-red-600 hover:underline">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
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
                                        <label className="block text-sm font-semibold mb-2">Phone Number</label>
                                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                                    </div>

                                    <div className="w-full space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <label className="block text-sm font-semibold mb-2">City</label>
                                                <input
                                                    type="text"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder="Enter city or suburb"
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="block text-sm font-semibold mb-2">Postal Code</label>
                                                <input
                                                    type="text"
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    placeholder="e.g. 2000"
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="block text-sm font-semibold mb-2">Address</label>
                                            <input
                                                type="text"
                                                value={detailAddress}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Enter street address"
                                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="carryRequired" 
                                                checked={carryRequired} 
                                                onChange={(e) => setCarryRequired(e.target.checked)} 
                                                className="w-4 h-4 rounded cursor-pointer"
                                            />
                                            <label htmlFor="carryRequired" className="text-sm font-semibold cursor-pointer">
                                                Carry Required
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                id="installationRequired" 
                                                checked={installationRequired} 
                                                onChange={(e) => setInstallationRequired(e.target.checked)} 
                                                className="w-4 h-4 rounded cursor-pointer"
                                            />
                                            <label htmlFor="installationRequired" className="text-sm font-semibold cursor-pointer">
                                                Installation Required
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Additional Notes</label>
                                        <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} placeholder="Any additional information for the sales representative" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" rows={4} />
                                    </div>
                                    
                                </div>
                                <p className="text-gray-600 text-sm mt-4">Fields marked with <span className="text-red-600">*</span> are required</p>
                            </div>

                            <div style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
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
                                <button onClick={handleSubmitQuote} disabled={isSubmitting} className="w-full text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" style={{background: '#15c4c4'}}>
                                    {isSubmitting ? 'Sending...' : 'Request Quote'}
                                </button>
                                {submitMessage && (
                                    <div className={`mt-3 p-3 rounded-lg text-sm ${submitMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {submitMessage.text}
                                    </div>
                                )}
                                <Link href="/" className="block w-full mt-3 text-center hover:underline" style={{color: '#15c4c4'}}>Continue Shopping</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
