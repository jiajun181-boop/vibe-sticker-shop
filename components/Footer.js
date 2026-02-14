"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createT } from "@/lib/i18n";

function FooterColumn({ title, links, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-800 md:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 md:pointer-events-none md:py-0"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          {title}
        </p>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform md:hidden ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <ul className={`space-y-2 text-sm overflow-hidden transition-all duration-200 md:mt-3 md:max-h-none md:pb-0 ${open ? "max-h-40 pb-4" : "max-h-0"}`}>
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="transition-colors duration-200 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        { label: "info@lunarprint.ca", href: "mailto:info@lunarprint.ca" },
        { label: "647-783-4728", href: "tel:+16477834728" },
        { label: "11 Progress Ave #21, Scarborough", href: "https://maps.google.com/?q=11+Progress+Ave+%2321+Scarborough+ON+M1P+4S7" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-12">
        {/* Brand header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="La Lunar Printing" width={40} height={40} className="h-10 w-10 invert opacity-90" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white leading-tight">La Lunar Printing</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mt-0.5">{t("footer.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <span className="text-[11px] uppercase tracking-[0.15em]">{t("footer.madeIn")}</span>
            <span className="text-xs">🇨🇦</span>
          </div>
        </div>

        {/* Collapsible on mobile, grid on desktop */}
        <div className="md:grid md:grid-cols-5 md:gap-10">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Business Essential &mdash; Essential to Your Brand &mdash; From Concept to Delivery
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-gray-800 pt-6 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-gray-700 px-2 py-1">Visa</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">Mastercard</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">Amex</span>
            <span className="rounded-md border border-gray-700 px-2 py-1">E-Transfer</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/returns" className="hover:text-white transition-colors">Return Policy</Link>
          </div>
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
