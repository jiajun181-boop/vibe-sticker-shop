// app/admin/orders/page.js
import { prisma } from "@/lib/prisma";

// 👈 关键：告诉 Cloudflare 在边缘网络运行
export const runtime = "edge"; 
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
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter">PRODUCTION QUEUE</h1>
            <p className="text-gray-400 text-sm">Monitor paid orders and download artwork assets.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Orders</span>
            <div className="text-3xl font-black">{orders.length}</div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center text-gray-400">
            No paid orders in the queue yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap justify-between items-start border-b border-gray-50 pb-6 mb-6 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">Order #{order.id.slice(-6)}</span>
                    <h2 className="text-xl font-bold">{order.customerEmail}</h2>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Total Amount</p>
                    <p className="text-2xl font-black">${(order.totalAmount / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 bg-white rounded-xl border border-gray-100 flex-shrink-0 overflow-hidden">
                        {item.fileUrl && (
                          <img src={item.fileUrl} alt="Artwork" className="w-full h-full object-contain" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">
                          {item.sizeLabel ? item.sizeLabel : `${item.width}x${item.height} in`} · {item.printQuantity} pcs
                        </p>
                      </div>
                      {item.fileUrl && (
                        <a href={item.fileUrl} target="_blank" rel="noreferrer" className="bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all">
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}