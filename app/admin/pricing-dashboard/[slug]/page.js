import { redirect } from "next/navigation";

export default async function ProductPricingDetailPage({ params }) {
  const { slug } = await params;
  redirect(`/admin/pricing?tab=quote&slug=${encodeURIComponent(slug)}`);
}
