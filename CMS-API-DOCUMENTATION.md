# Empirical Flooring — CMS API Documentation

## Overview

The CMS backend is built with Next.js API routes, Supabase Auth, and PostgreSQL (via Supabase). All admin endpoints require a Bearer token obtained from the login endpoint.

**Base URL:** `http://localhost:3000/api` (dev) or your Vercel deployment URL.

---

## Authentication

All `/api/admin/*` routes require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### POST /api/auth/login

Login with admin credentials. Returns a token for subsequent requests.

**Body:**
```json
{
  "email": "admin@empiricalflooring.com.au",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@empiricalflooring.com.au",
    "full_name": "Admin Name",
    "role": "super_admin"
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**Errors:** `400` missing fields, `401` invalid credentials, `403` not an admin.

### GET /api/auth/me

Returns the currently authenticated admin's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "admin@empiricalflooring.com.au",
  "full_name": "Admin Name",
  "role": "super_admin"
}
```

### POST /api/auth/logout

Ends the current admin session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

## Categories

### GET /api/categories (Public)

Returns all active flooring categories, sorted by `sort_order`.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Hybrid",
    "slug": "hybrid",
    "description": "Waterproof hybrid flooring...",
    "image_url": null,
    "sort_order": 1,
    "is_active": true,
    "created_at": "2026-03-29T...",
    "updated_at": "2026-03-29T..."
  }
]
```

### GET /api/admin/categories (Admin)

Returns all categories including inactive ones.

### POST /api/admin/categories (Admin)

Create a new category.

**Body:**
```json
{
  "name": "Engineered Timber",
  "slug": "engineered-timber",
  "description": "Premium engineered timber flooring",
  "sort_order": 6
}
```

### PUT /api/admin/categories/:id (Admin)

Update a category.

**Body (partial update):**
```json
{
  "name": "Updated Name",
  "is_active": false
}
```

### DELETE /api/admin/categories/:id (Admin)

Delete a category permanently.

---

## Products

### GET /api/products (Public)

List active products. Supports query parameter filters.

**Query params:**
- `category` — filter by category slug (e.g. `?category=hybrid`)
- `brand` — filter by brand name (e.g. `?brand=Karndean`)
- `search` — search by product name (e.g. `?search=oak`)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Karndean Van Gogh Oak Natural",
    "slug": "karndean-van-gogh-oak-natural",
    "brand": "Karndean",
    "category_id": "uuid",
    "is_active": true
  }
]
```

### GET /api/products/:slug (Public)

Get a single product with full details: variants, attributes, and category.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Karndean Van Gogh Oak Natural",
  "slug": "karndean-van-gogh-oak-natural",
  "brand": "Karndean",
  "description": "Full product description...",
  "variants": [
    {
      "id": "uuid",
      "sku": "VGW85T",
      "colour_name": "Natural Oak",
      "price_per_sqm": 65.00,
      "price_per_unit": null,
      "stock_status": 1
    }
  ],
  "attributes": [
    {
      "id": "uuid",
      "attribute_id": "uuid",
      "value": "5"
    }
  ],
  "category": {
    "id": "uuid",
    "name": "Hybrid",
    "slug": "hybrid"
  }
}
```

### POST /api/products/filter (Public)

Advanced filtering for the comparison engine. Uses POST because filters can be complex.

**Body:**
```json
{
  "category_slugs": ["hybrid", "vinyl-plank"],
  "brands": ["Karndean", "Quick-Step"],
  "search": "oak",
  "min_price": 30,
  "max_price": 80,
  "attributes": [
    { "attribute_id": "uuid-for-waterproof", "value": "true" }
  ],
  "page": 1,
  "per_page": 20
}
```

**Response (200):**
```json
{
  "products": [...],
  "total": 42
}
```

All fields are optional. Omit a field to skip that filter.

### GET /api/products/filter-options (Public)

Returns available filter values for the frontend filter sidebar.

**Response (200):**
```json
{
  "brands": ["Karndean", "Quick-Step", "Godfrey Hirst"],
  "priceRange": { "min": 25.00, "max": 120.00 }
}
```

### POST /api/products/score (Public)

Product scoring and ranking for the comparison engine. Users specify what matters to them and products are ranked 0–100.

**Body:**
```json
{
  "category_slug": "hybrid",
  "weights": [
    { "attribute_id": "uuid-for-waterproof", "weight": 1.0, "preferred_value": "true" },
    { "attribute_id": "uuid-for-wear-layer", "weight": 0.8, "preferred_min": 0.3 },
    { "attribute_id": "uuid-for-ac-rating", "weight": 0.6 },
    { "attribute_id": "uuid-for-install-method", "weight": 0.4, "preferred_value": "Click-lock" }
  ],
  "limit": 10
}
```

**Response (200):**
```json
[
  {
    "product_id": "uuid",
    "name": "Karndean Van Gogh Oak Natural",
    "slug": "karndean-van-gogh-oak-natural",
    "brand": "Karndean",
    "score": 87,
    "breakdown": [
      { "attribute_name": "Waterproof", "value": "true", "weight": 1.0, "points": 1.0 },
      { "attribute_name": "Wear Layer", "value": "0.55", "weight": 0.8, "points": 0.72 }
    ],
    "lowest_price": 65.00
  }
]
```

**Weight rules:** Each weight is 0–1 (0 = don't care, 1 = essential). For number attributes, use `preferred_min` and/or `preferred_max` for a range. For text attributes, use `preferred_value` for an exact match. For booleans, use `preferred_value` ("true" or "false").

### GET /api/admin/products (Admin)

Returns all products including inactive ones.

### POST /api/admin/products (Admin)

Create a new product.

**Body:**
```json
{
  "name": "Karndean Van Gogh Oak Natural",
  "slug": "karndean-van-gogh-oak-natural",
  "category_id": "uuid",
  "brand": "Karndean",
  "description": "Full description...",
  "short_description": "Brief description..."
}
```

### PUT /api/admin/products/:id (Admin)

Update a product.

### DELETE /api/admin/products/:id (Admin)

Delete a product and all its variants (cascading delete).

---

## Variants

### POST /api/admin/products/:id/variants (Admin)

Add a variant to a product.

**Body:**
```json
{
  "sku": "VGW85T-NAT",
  "colour_name": "Natural Oak",
  "colour_hex": "#C4A56E",
  "size_label": "1219 x 178mm",
  "price_per_sqm": 65.00,
  "stock_status": 1,
  "sort_order": 1
}
```

### PUT /api/admin/products/:id/variants/:variantId (Admin)

Update a variant.

### DELETE /api/admin/products/:id/variants/:variantId (Admin)

Delete a variant.

---

## Pricing

### GET /api/admin/products/:id/pricing (Admin)

Get a pricing summary for all variants of a product.

**Response (200):**
```json
[
  {
    "id": "variant-uuid",
    "sku": "VGW85T-NAT",
    "colour_name": "Natural Oak",
    "size_label": "1219 x 178mm",
    "price_per_sqm": 65.00,
    "price_per_unit": null,
    "is_active": true
  }
]
```

### PUT /api/admin/products/:id/pricing (Admin)

Bulk update pricing for multiple variants at once.

**Body:**
```json
{
  "updates": [
    { "variant_id": "uuid-1", "price_per_sqm": 69.99 },
    { "variant_id": "uuid-2", "price_per_sqm": 72.50, "price_per_unit": 145.00 }
  ]
}
```

---

## Attributes

### GET /api/attributes (Public)

Returns the full tiered attribute structure: groups with nested attributes.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Durability",
    "slug": "durability",
    "sort_order": 1,
    "attributes": [
      {
        "id": "uuid",
        "name": "AC Rating",
        "slug": "ac-rating",
        "unit": null,
        "data_type": "number",
        "sort_order": 1
      },
      {
        "id": "uuid",
        "name": "Wear Layer",
        "slug": "wear-layer",
        "unit": "mm",
        "data_type": "number",
        "sort_order": 2
      }
    ]
  }
]
```

### POST /api/admin/attributes (Admin)

Create a new attribute.

**Body:**
```json
{
  "group_id": "uuid",
  "name": "Moisture Resistance",
  "slug": "moisture-resistance",
  "unit": null,
  "data_type": "boolean",
  "sort_order": 5
}
```

### PUT /api/admin/attributes/:id (Admin)

Update an attribute.

### DELETE /api/admin/attributes/:id (Admin)

Delete an attribute.

### POST /api/admin/attributes/groups (Admin)

Create a new attribute group.

**Body:**
```json
{
  "name": "Environmental",
  "slug": "environmental",
  "sort_order": 5
}
```

### PUT /api/admin/attributes/groups/:id (Admin)

Update an attribute group.

### DELETE /api/admin/attributes/groups/:id (Admin)

Delete an attribute group and all its attributes (cascading delete).

---

## Database Schema

See `sql/supabase-setup.sql` (auth tables) and `sql/scrum45-product-schema.sql` (product tables) for the full schema. Run in Supabase SQL Editor in that order.

### Tables

| Table | Purpose |
|-------|---------|
| admin_profiles | Admin users linked to Supabase Auth |
| categories | Flooring types (hybrid, vinyl, etc.) |
| products | Base products |
| product_variants | SKUs with pricing and colour/size |
| attribute_groups | Attribute categories (Durability, etc.) |
| attributes | Individual attributes (AC Rating, etc.) |
| product_attributes | Product-to-attribute values |

### Row Level Security

All tables have RLS enabled. Public users can read active records. Admin write access is verified against `admin_profiles`.

---

## Setup Guide

1. Create a Supabase project at https://supabase.com
2. Run `sql/supabase-setup.sql` in SQL Editor
3. Run `sql/scrum45-product-schema.sql` in SQL Editor
4. Create `.env.local` in project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Create first admin user in Supabase Dashboard → Authentication → Users
6. Insert matching row in `admin_profiles` table
7. Run `npm install` and `npm run dev`
