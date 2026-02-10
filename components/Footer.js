import Link from "next/link";
import { createT } from "@/lib/i18n";

export default function Footer({ locale = "en" }) {
  const t = createT(locale);

  const columns = [
    {
      title: t("footer.about"),
      links: [
        { label: t("footer.company"), href: "/about" },
        { label: t("footer.ourStory"), href: "/about" },
        { label: t("footer.careers"), href: "/about" },
      ],
    },
    {
      title: t("footer.products"),
      links: [
        { label: t("footer.stickers"), href: "/shop" },
        { label: t("footer.labels"), href: "/shop" },
        { label: t("footer.signage"), href: "/shop" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { label: t("footer.templates"), href: "/about" },
        { label: t("footer.specs"), href: "/about" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.contact"), href: "/contact" },
        { label: t("footer.orderStatus"), href: "/contact" },
        { label: t("footer.shipping"), href: "/contact" },
      ],
    },
    {
      title: t("footer.contact"),
      links: [
        { label: "support@vibestickers.com", href: "mailto:support@vibestickers.com" },
        { label: "+1 (416) 555-0199", href: "tel:+14165550199" },
        { label: "Toronto, ON", href: "/about" },
      ],
    },
  ];

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
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
