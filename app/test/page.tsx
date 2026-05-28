'use client'

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useActionState } from 'react';

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseURL, supabaseAnonKey);

type Metric = {
    name: string;
    brand: string;
};

export default function TestPage() {
    // Form handling
    const [error, submitAction, isPending] = useActionState(
        async (previousState, formData) => {
            // Action logic
            const newProduct = {
                name: formData.get('name') as string,
                brand: 'Test Brand',
            };
            console.log('Submitting new product:', newProduct);
            // Async operation
            const { error } = await supabase
                .from('products')
                .insert(newProduct);
            // Return error state
            if (error) {
                console.error('Error inserting product:', error.message);
                return new Error('Failed to insert product'); // Return error message
            }
            return null; // No error
        },
        null // Initial state
    );

    // State variable = metrics
    // Metrics setter function = setMetrics
    const [metrics, setMetrics] = useState<Metric[]>([]);

    useEffect(() => {
        // Fetch metrics when the component mounts
        fetchMetrics();
        // Setup supabase real-time subscription to the 'products' table
        const channel = supabase
            .channel('products_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
            (payload) => {
                // Log the change event and the new data
                console.log('new: ', payload.new);
            })
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchMetrics() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select(
                    `
                    name,
                    brand
                    `,
                )
                .order('brand', { ascending: false })
            // Handle error
            if (error) {
                throw error;
            }
            // Log data
            console.log(data);
            setMetrics(data);
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    } 

    return (
        <div>
            <h1>Test Page</h1>
            <p>This is a simple test page.</p>

            <p>Add new products to the database:</p>
            <form action={submitAction}>
                <div>
                    Use this form to add new products to the database.
                </div>
                <label htmlFor="name">
                    Name:
                    <input 
                        type="text"
                        id="name"
                        name="name" 
                        aria-invalid={error ? 'true' : 'false'}
                        disabled={isPending} 
                    />
                </label>
                <button type="submit" disabled={isPending}>
                    {isPending ? 'Submitting...' : 'Submit'}
                </button>
            </form>

            {error && (
                <div role="alert" className="error-message">
                    {error}
                </div>
            )}

            <p>Metrics:</p>
            <ul>
                {metrics.map((metric) => (
                    <li key={metric.name}>
                        {metric.name} - {metric.brand}
                    </li>
                ))}
            </ul>
        </div>
    );
}