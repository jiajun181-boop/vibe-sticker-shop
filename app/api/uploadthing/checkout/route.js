"use client";
import { useState } from 'react';
import { UploadButton } from "../utils/uploadthing"; 

export default function Home() {
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(3);
  const [quantity, setQuantity] = useState(50);
  const [loading, setLoading] = useState(false);
  
  // 两个状态：文件名(给你看的) 和 文件链接(给Stripe用的)
  const [fileName, setFileName] = useState(""); 
  const [fileUrl, setFileUrl] = useState("");

  const calculatePrice = () => {
    const area = width * height;
    let price = area * 0.15 * quantity; 
    if (price < 30) price = 30; 
    return price.toFixed(2);
  };

  const handleCheckout = async () => {
    if (!fileUrl) {
      alert("Please upload an image first! (请先上传图片)");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width, 
          height, 
          quantity, 
          filename: fileName,
          imageUrl: fileUrl // 把真的链接发给后端
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment setup failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-black relative overflow-hidden pb-20">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-12 items-start max-w-6xl w-full z-10 mt-10">
        <div className="flex-1 text-center md:text-left pt-10">
          <span className="text-purple-400 font-bold tracking-wider text-sm uppercase mb-2 block">Custom Printing</span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            UPLOAD YOUR <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">ARTWORK</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto md:mx-0">
            Turn your designs into premium die-cut vinyl stickers. 
            <br/>Waterproof, scratch-resistant, and ready for the streets.
          </p>
        </div>

        <div className="flex-1 w-full max-w-md bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white mb-6">Configure Order</h2>
          
          {/* === 上传区域 === */}
          <div className="mb-8">
            <label className="text-xs text-gray-500 font-bold uppercase block mb-2">1. Upload Design</label>
            <div className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl p-6 bg-black/40 flex flex-col items-center justify-center min-h-[150px]">
              
              {fileUrl ? (
                <div className="text-center">
                   <div className="text-green-400 text-4xl mb-2">✓</div>
                   <p className="text-white font-bold truncate max-w-[200px]">{fileName}</p>
                   <p className="text-xs text-green-500 mt-1">Ready to print</p>
                </div>
              ) : (
                <UploadButton
                  endpoint="imageUploader"
                  appearance={{
                    button: "bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-full text-sm",
                    allowedContent: "text-gray-400 text-xs"
                  }}
                  onClientUploadComplete={(res) => {
                    console.log("Files: ", res);
                    setFileName(res[0].name);
                    setFileUrl(res[0].url);
                    alert("Upload Success!");
                  }}
                  onUploadError={(error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-bold uppercase block mb-2">Width</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white text-lg"/>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-bold uppercase block mb-2">Height</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white text-lg"/>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex justify-between items-center">
             <div>
                <p className="text-gray-400 text-xs uppercase">Total</p>
                <p className="text-3xl font-black text-white">${calculatePrice()}</p>
             </div>
             <button 
                onClick={handleCheckout} 
                disabled={loading || !fileUrl} 
                className={`px-8 py-3 rounded-xl font-bold transition-all ${fileUrl ? 'bg-white text-black hover:bg-purple-400' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
             >
                {loading ? "..." : "Pay Now"}
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}