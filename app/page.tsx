'use client';

import Link from 'next/link';

export default function Home() {
  const floringCategories = [
    {
      name: 'Solid Flooring',
      description: 'Natural Solid Timber Planks',
      details: 'Available in various widths and grades, sanded and finished on-site, and built to last through generations.',
      icon: '🌲',
      href: '#'
    },
    {
      name: 'Engineered Flooring',
      description: 'Natural Timber Veneer on a Plywood Base',
      details: 'Highly stable, and factory pre-finished, all advantages of real timber without the extra work.',
      icon: '🏗️',
      href: '#'
    },
    {
      name: 'Laminate Flooring',
      description: 'Decorative Layer on Fibreboard Base',
      details: 'Extremely scratch-proof, highly affordable, and true to real timber in look and feel.',
      icon: '✨',
      href: '#'
    },
    {
      name: 'Vinyl Flooring',
      description: 'Decorative Layer on 100% Plastic Base',
      details: 'Wear-resistant, 100% waterproof and easy to replace individual planks.',
      icon: '💧',
      href: '#'
    },
    {
      name: 'Hybrid Flooring',
      description: 'Decorative Layer on a Plastic Composite Base',
      details: 'Wear-resistant and 100% waterproof, create a solid feel perfect for families and pets.',
      icon: '⚡',
      href: '#'
    },
    {
      name: 'Bamboo Flooring',
      description: 'Strands of Bamboo Grass Pressed into Planks',
      details: 'Durable, timber-like feel, and eco-friendly with fully renewable resources.',
      icon: '🌱',
      href: '#'
    },
  ];

  const featuredRanges = [
    {
      name: 'Karndean Korlok',
      image: 'from-blue-100 to-blue-50',
      color: 'bg-blue-500'
    },
    {
      name: 'Quick-Step Majestic',
      image: 'from-amber-100 to-amber-50',
      color: 'bg-amber-500'
    },
    {
      name: 'Prestige 15mm Oak',
      image: 'from-orange-100 to-orange-50',
      color: 'bg-orange-500'
    },
    {
      name: 'Pronto Oak',
      image: 'from-green-100 to-green-50',
      color: 'bg-green-500'
    },
  ];

  const brands = [
    { name: 'Preference Floors', abbr: 'PF' },
    { name: 'Premium Floors', abbr: 'PM' },
    { name: 'Karndean', abbr: 'KD' },
    { name: 'Quick-Step', abbr: 'QS' },
    { name: 'Hurford', abbr: 'HF' },
    { name: 'Dunlop', abbr: 'DL' },
  ];

  const testimonials = [
    {
      name: 'John Smith',
      text: 'Excellent service and quality products. The team was incredibly helpful in choosing the perfect flooring for my home.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      text: 'Amazing experience from start to finish. Fast delivery and beautiful floors that look stunning in our new apartment.',
      rating: 5
    },
    {
      name: 'Michael Brown',
      text: 'Great pricing and variety. The expertise of the team made the selection process easy and stress-free.',
      rating: 5
    },
  ];

  const blogPosts = [
    {
      title: 'Floating Floorboards – Types, Benefits & Maintenance Tips',
      date: '25 JUL',
      excerpt: 'Complete guide to floating floorboards: types, benefits and maintenance tips...'
    },
    {
      title: 'Flawless Floors for Winter',
      date: '13 MAY',
      excerpt: 'Say goodbye to stubborn stains with our new Quick-Step Spot Cleaner...'
    },
    {
      title: 'The Ultimate Guide to Caring for Your Floors',
      date: '11 MAR',
      excerpt: 'Do\'s and don\'ts for keeping your floors in perfect condition...'
    },
  ];

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[500px] md:h-[600px] bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Premium Flooring for Your Dream Home
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-xl">
                Discover Australia's best selection of engineered, hybrid, laminate, and solid flooring with expert guidance and fast delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2">
                  Shop Now →
                </button>
                <button className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition border border-blue-500">
                  View Styles
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="bg-gray-50 py-8 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
                <p className="text-gray-600">Products</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">⭐ 4.9</div>
                <p className="text-gray-600">Customer Rating</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Next Day</div>
                <p className="text-gray-600">Quotes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <p className="text-gray-600">Best Price Match</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      
    </>
  );
}
