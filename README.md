# IoTBay Flooring Platform

IoTBay Flooring is a Next.js web application for browsing flooring products, comparing product options, requesting quotes, and managing product catalogue data through an admin area.

The project uses Next.js, React, TypeScript, Tailwind CSS, Supabase, and Resend. Supabase provides authentication and database storage, while Resend is used to email quote requests to the sales team.

## Prerequisites

Before running the project, install or create the following:

- Git
- Node.js 20.9.0 or newer
- npm, which is included with Node.js
- A Supabase project
- A Resend account and API key, if quote emails should be sent

Next.js does not need to be installed globally. It is installed from `package.json` when you run `npm install`.

## Installation

Clone the repository:

```bash
git clone https://github.com/JamePHD/Flooring.git
```

Move into the project folder:

```bash
cd Flooring
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a local environment file from the example file.

On Windows:

```bash
copy .env.local.example .env.local
```

On macOS or Linux:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-api-key
SALES_REP_EMAIL=sales@example.com
FROM_EMAIL=noreply@example.com
```

The Supabase URL, anon key, and service role key are available in your Supabase project settings under the API section.

The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values are used by the browser and server. The `SUPABASE_SERVICE_ROLE_KEY` is used only by server-side admin API code and should never be exposed in client-side code.

The Resend values are used by the quote request flow.

`RESEND_API_KEY` authenticates email sending, `SALES_REP_EMAIL` receives quote requests, and `FROM_EMAIL` should be a sender address verified in Resend.

## Supabase Setup

Create a Supabase project, then run the SQL setup files in this order from the Supabase SQL Editor:

```bash
sql/supabase-setup.sql
sql/scrum45-product-schema.sql
```

After the schema is created:

1. Create an admin user in Supabase Auth.
2. Add the matching user row to the `admin_profiles` table.
3. Confirm that product, category, variant, and attribute tables are available.

## Example Admin Profile Insert

After creating the first user in Supabase Auth, copy that user's UUID and insert a matching profile row:

```sql
INSERT INTO admin_profiles (user_id, email, full_name, role)
VALUES (
  'paste-the-uuid-from-auth-users-here',
  'admin@empiricalflooring.com.au',
  'Admin Name',
  'super_admin'
);
```

Use the same email address as the Supabase Auth user. The first admin is normally created manually in the Supabase SQL Editor.

## Running the Project

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build the production version:

```bash
npm run build
```

Run the production build:

```bash
npm run start
```

Run linting:

```bash
npm run lint
```

## Usage

Use the public site to browse products, open product detail pages, compare product variants, and request a quote.

Important pages:

- `/` - home page
- `/products` - product catalogue
- `/products/[id]` - product detail page by product slug
- `/compare` - selected product comparison table
- `/cart` - quote request cart
- `/contact` - contact form
- `/signIn` - admin sign in
- `/admin` - product and variant management

To test the admin area, sign in with a Supabase Auth user that also has an `admin_profiles` row.

To test quote emails, add products to the quote cart, complete the quote form, and submit it. The app sends the quote request through the `/api/send-quote` route using Resend.

## Frontend Features

- Product catalogue pages backed by Supabase data
- Product detail pages with images, variants, pricing, attributes, and related products
- Product comparison using locally stored selected products
- Quote cart using browser local storage
- Quote request form with customer details and quote totals
- Contact, policy, privacy, blog, and news pages
- Shared header, footer, logo, and global styling

## Backend and API Features

Public API features include:

- Product listing and product detail data
- Category and attribute data
- Product filtering and scoring
- Qualifying session routes
- Quote email submission

Admin API features include:

- Admin authentication checks
- Category management
- Product management
- Product variant management
- Product pricing updates
- Attribute and attribute group management

For detailed CMS API documentation, see [`CMS-API-DOCUMENTATION.md`](./CMS-API-DOCUMENTATION.md).

## Project Structure

- `app/` - frontend pages, layout, shared components, and app-level API routes
- `app/api/send-quote/` - quote email route using Resend
- `src/app/api/` - product, category, attribute, auth, admin, and session API routes
- `src/controllers/` - controller logic for API features
- `src/models/` - Supabase data access logic
- `src/lib/supabase/` - Supabase client helpers
- `sql/` - Supabase setup and schema files
- `public/` - images, logos, and static assets

## Deployment

The app can be deployed to Vercel or another platform that supports Next.js.

Before deploying, add the same environment variables from `.env.local` to the deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SALES_REP_EMAIL`
- `FROM_EMAIL`

Run `npm run build` locally before deployment to check that the production build completes.

## Troubleshooting

If products do not load, check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in `.env.local`.

If the admin area does not work, confirm that the signed-in Supabase Auth user has a matching active row in `admin_profiles`.

If quote emails fail, check that `RESEND_API_KEY`, `SALES_REP_EMAIL`, and `FROM_EMAIL` are set, and confirm that `FROM_EMAIL` is verified in Resend.

If environment variable changes are not picked up, stop and restart the development server.

## Development Notes

This project uses Next.js 16.2.0, which may differ from older Next.js examples. Before changing Next.js-specific APIs, routing conventions, or configuration, check the relevant guide in `node_modules/next/dist/docs/`.
