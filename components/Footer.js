import Link from "next/link";

const columns = [
  {
    title: "About",
    links: [
      { label: "Company", href: "/about" },
      { label: "Our Story", href: "/about" },
      { label: "Careers", href: "/about" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Stickers", href: "/shop" },
      { label: "Labels", href: "/shop" },
      { label: "Signage", href: "/shop" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Templates", href: "/about" },
      { label: "Specs", href: "/about" },
      { label: "FAQ", href: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Order Status", href: "/contact" },
      { label: "Shipping", href: "/contact" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "support@vibestickers.com", href: "mailto:support@vibestickers.com" },
      { label: "+1 (416) 555-0199", href: "tel:+14165550199" },
      { label: "Toronto, ON", href: "/about" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          {columns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                {column.title}
              </p>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors duration-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gray-800 pt-6 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-gray-700 px-2 py-1">Visa</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">Mastercard</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">Amex</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">PayPal</span>
          </div>
          <p>© {new Date().getFullYear()} Vibe Sticker Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
