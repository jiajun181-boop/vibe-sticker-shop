// 文件路径: app/shop/page.js
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

// 强制动态渲染，确保每次刷新都从 DB 拿最新数据
export const dynamic = "force-dynamic";

const CATEGORY_LABELS = {
  "fleet-compliance-id": "Fleet Compliance & ID",
  "vehicle-branding-advertising": "Vehicle Branding & Advertising",
  "safety-warning-decals": "Safety & Warning Decals",
  "facility-asset-labels": "Facility & Asset Labels",
};

// 价格格式化工具
const formatPrice = (cents, unit) => {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  return unit === "per_sqft" ? `From ${price} / sqft` : `${price} / ea`;
};

export default async function ShopPage() {
  // 1. 从数据库查询所有上架产品
  const products = await prisma.product.findMany({
    where: { 
      isActive: true // ✅ 修正：这里改成了 isActive，匹配你的新 Schema
    }, 
    include: { 
      images: { take: 1, orderBy: { sortOrder: 'asc' } } // ✅ 获取第一张图片
    }, 
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
      { name: 'asc' }
    ] 
  });
  
  // 2. 按分类分组
  const grouped = products.reduce((acc, p) => { 
    (acc[p.category] ||= []).push(p); 
    return acc; 
  }, {});

  // 3. 定义分类显示顺序
  const sortOrder = [
    "fleet-compliance-id", 
    "vehicle-branding-advertising", 
    "safety-warning-decals", 
    "facility-asset-labels"
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-12 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-black mb-10 text-gray-900">Product Catalog</h1>
      
      {/* 4. 渲染分类区块 */}
      {sortOrder.map((cat) => {
        const items = grouped[cat];
        if (!items) return null;

        return (
          <section key={cat} className="mb-16">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-800">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map(p => (
                <Link 
                  key={p.id} 
                  href={`/shop/${p.category}/${p.slug}`} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 group flex flex-col"
                >
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {p.images[0] ? (
                       <Image 
                         src={p.images[0].url} 
                         alt={p.name} 
                         fill 
                         className="object-cover group-hover:scale-105 transition-transform" 
                         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                       />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="mt-auto pt-2">
                      <p className="text-sm text-gray-500 font-medium">
                        {formatPrice(p.basePrice, p.pricingUnit)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}