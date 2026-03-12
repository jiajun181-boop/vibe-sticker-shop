import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/admin-auth";
import { getProductTemplate } from "@/lib/pricing/template-resolver";
import { getProductMaterials } from "@/lib/pricing/product-materials";
import PricingDetailClient from "./PricingDetailClient";

/**
 * Admin Product Pricing Detail page — SERVER COMPONENT.
 *
 * Data flow:
 *   1. Server reads admin_session cookie → verifyAdminToken()
 *   2. Server queries Prisma directly — product info appears instantly (no loading skeleton)
 *   3. Serialized product passed to PricingDetailClient (client component)
 *   4. QuoteSimulator (nested client component) handles interactive quote API calls
 *
 * States:
 *   - unauthorized → redirect to /admin/login
 *   - not-found → Next.js 404
 *   - loaded → product info visible instantly, quote simulator interactive
 */
export default async function ProductPricingDetailPage({ params }) {
  const { slug } = await params;

  // ── Auth: read cookie server-side ──
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie?.value) {
    redirect("/admin/login");
  }
  const payload = await verifyAdminToken(sessionCookie.value);
  if (!payload) {
    redirect("/admin/login");
  }

  // ── Fetch product directly from DB — no API round-trip ──
  const product = await prisma.product.findFirst({
    where: { slug },
    include: { pricingPreset: true },
  });

  if (!product) {
    notFound();
  }

  // ── Serialize for client component (Dates → ISO strings) ──
  const serialized = {
    ...product,
    createdAt: product.createdAt?.toISOString() ?? null,
    updatedAt: product.updatedAt?.toISOString() ?? null,
    pricingConfig: product.pricingConfig ?? null,
    pricingPreset: product.pricingPreset ? {
      ...product.pricingPreset,
      createdAt: product.pricingPreset.createdAt?.toISOString() ?? null,
      updatedAt: product.pricingPreset.updatedAt?.toISOString() ?? null,
    } : null,
  };

  const pricingTemplate = getProductTemplate(product) || null;
  const productMaterials = getProductMaterials(slug) || null;
  const materialSource = productMaterials?.source || "template";

  return <PricingDetailClient product={serialized} pricingTemplate={pricingTemplate} productMaterials={productMaterials} materialSource={materialSource} />;
}
