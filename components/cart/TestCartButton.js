"use client";
import { useCartStore } from "../../app/store/useCartStore"; 

export default function TestCartButton() {
  const openCart = useCartStore((s) => s.openCart);
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-2">
      <button onClick={openCart} className="bg-black border border-white px-4 py-3 text-white font-bold rounded shadow-lg hover:bg-gray-800">🛒 OPEN CART</button>
      <button onClick={() => addItem({
            productId: "die-cut-singles",
            name: "Die Cut Stickers",
            price: 5400,
            quantity: 50,
            width: 3,
            height: 3,
            material: "Vinyl",
            finish: "Matte",
            fileKey: "test-file-key",
            fileUrl: "https://utfs.io/f/94042211-5d9c-486a-8b29-373981882d92-123.png", 
          })} className="bg-blue-600 border border-white px-4 py-3 text-white font-bold rounded shadow-lg hover:bg-blue-500">➕ ADD SAMPLE</button>
      <button onClick={clearCart} className="bg-red-600 border border-white px-4 py-2 text-white text-xs rounded shadow-lg hover:bg-red-500">🗑️ CLEAR</button>
    </div>
  );
}