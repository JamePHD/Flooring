import { redirect } from "next/navigation";

export default async function DrilldownRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  const { product } = await searchParams;
  const slug = Array.isArray(product) ? product[0] : product;

  if (slug) {
    redirect(`/products/${encodeURIComponent(slug)}`);
  }

  redirect("/products");
}
