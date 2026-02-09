import Link from "next/link";

const advantages = [
  "Commercial-grade print quality",
  "Consistent color and material control",
  "Fast quoting and production scheduling",
  "Support for multi-location rollout",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="rounded-3xl border border-gray-200 bg-white p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">About Us</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Built for Business Print Operations</h1>
          <p className="mt-4 text-sm text-gray-600">
            Vibe Sticker Shop is a Canadian print production team focused on decals, signage, and branded graphics for B2B customers.
            We help operations, marketing, and procurement teams deliver consistent print output on schedule.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {advantages.map((item) => (
            <article key={item} className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold">{item}</h2>
              <p className="mt-2 text-sm text-gray-600">Process-driven production designed for repeatable quality and predictable delivery.</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">Quality Commitment</h2>
          <p className="mt-3 text-sm text-gray-600">
            Every order is reviewed for print readiness, material fit, and production accuracy. If there is a manufacturing issue,
            we will reprint or replace according to policy.
          </p>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-gray-900 p-8 text-white">
          <h2 className="text-2xl font-semibold">Start your next project</h2>
          <p className="mt-3 text-sm text-gray-200">Talk to our team about timelines, materials, and volume pricing.</p>
          <Link href="/shop" className="mt-5 inline-block rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900">
            Start Your Project
          </Link>
        </section>
      </div>
    </main>
  );
}
