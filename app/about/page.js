export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-neutral-900">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-6 text-white">About Vibe Stickers</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          We started in a small garage with one goal: to make the highest quality stickers on the planet.
          Our stickers are waterproof, sun-proof, and vibe-proof.
        </p>
        <div className="p-6 bg-black/50 rounded-xl border border-white/10">
          <p className="text-purple-400 font-bold">📍 Based in Toronto, Shipping Worldwide.</p>
        </div>
      </div>
    </div>
  )
}