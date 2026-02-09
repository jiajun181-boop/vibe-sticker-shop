import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INDUSTRY_TAGS, INDUSTRY_TAGS_SET, INDUSTRY_LABELS } from "@/lib/industryTags";

export const dynamic = "force-dynamic";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default async function IndustryPage({ params }) {
  const { tag } = await params;

  if (!INDUSTRY_TAGS_SET.has(tag)) notFound();

  const meta = INDUSTRY_LABELS[tag];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      tags: { has: tag },
    },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header */}
      <div className="bg-black text-white pt-24 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/shop" className="text-xs text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
            &larr; Back to Shop
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-4xl">{meta.icon}</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{meta.title}</h1>
              <p className="text-gray-400 mt-2 max-w-2xl">{meta.description}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 font-bold">
            {products.length} product{products.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </div>

      {/* Industry navigation chips */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_TAGS.map((t) => {
            const m = INDUSTRY_LABELS[t];
            if (!m) return null;
            return (
              <Link
                key={t}
                href={`/shop/industry/${t}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  t === tag
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {m.icon} {m.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-6">
        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">No products found for this industry yet.</p>
            <Link href="/shop" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black">
              Browse All Products &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const img = product.images?.[0]?.url;
              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.category}/${product.slug}`}
                  className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                      {img ? (
                        <Image src={img} alt={product.name} width={300} height={300} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{meta.icon}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{product.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {product.basePrice > 0 ? "From" : "Get Quote"}
                    </div>
                    <div className="text-sm font-black">
                      {product.basePrice > 0 ? formatCad(product.basePrice) : "Custom"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
