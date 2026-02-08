const STEPS = [
  {
    num: "1",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: "Upload Your Design",
    desc: "Upload your artwork or choose from our professional templates",
  },
  {
    num: "2",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "We Review Your File",
    desc: "Our team checks resolution, bleed, and color within 24 hours",
  },
  {
    num: "3",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-2.25 0h.008v.008H16.5V12z" />
      </svg>
    ),
    title: "We Print",
    desc: "High-quality production on premium materials with UV protection",
  },
  {
    num: "4",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: "Fast Shipping",
    desc: "Receive your order in 2-4 business days. Same-day available.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Simple Process
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          How It Works
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {STEPS.map((step, i) => (
          <div key={step.num} className="text-center relative">
            {/* Connector line (desktop only) */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:block absolute top-8 left-[60%] right-[-40%] h-px bg-gray-200" />
            )}

            {/* Number badge */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 text-gray-800 mb-4 mx-auto">
              {step.icon}
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full text-[10px] font-black flex items-center justify-center">
                {step.num}
              </span>
            </div>

            <h3 className="font-bold text-sm mb-1.5">{step.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[180px] mx-auto">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
