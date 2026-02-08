import { prisma } from "@/lib/prisma";

// 本地预览时务必注释掉 edge 运行时
// export const runtime = "edge"; 
export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    where: { status: "paid" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black italic tracking-tighter mb-10">PRODUCTION QUEUE</h1>
        
        {orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center text-gray-400">
            目前没有任何已支付的订单。
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <p className="font-bold text-xl">{order.customerEmail}</p>
                <p className="text-gray-400">订单金额: ${(order.totalAmount / 100).toFixed(2)}</p>
                <div className="mt-4 text-xs text-blue-500 font-mono">ID: {order.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}