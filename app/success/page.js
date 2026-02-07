"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. 把逻辑拆分到一个子组件里
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-5xl">🎉</span>
      </div>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Order Confirmed!</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Thank you for your order. We have received your payment and will begin production shortly.
        </p>
        {sessionId && (
          <p className="text-xs text-gray-300 font-mono">Session ID: {sessionId.slice(0, 10)}...</p>
        )}
      </div>

      <div className="pt-8">
        <Link 
          href="/" 
          className="bg-black text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

// 2. 这里的 export default 才是页面入口，用 Suspense 包裹
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}