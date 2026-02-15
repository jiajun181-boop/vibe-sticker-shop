"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createT } from "@/lib/i18n";

function NewsletterForm({ t }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("sending");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Footer Subscriber",
          email: email.trim(),
          message: "Newsletter signup via footer",
        }),
      });
    } catch {}
    setStatus("done");
  }

  if (status === "done") {
    return <p className="text-xs font-medium text-emerald-300">{t("footer.subscribed")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("footer.emailPlaceholder")}
        className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-slate-300/60 focus:border-[#d9b35b] focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-[#d9b35b] px-4 py-2 text-xs font-semibold text-[#0f2742] transition-colors hover:bg-[#e4c37a] disabled:opacity-50"
      >
        {t("footer.subscribe")}
      </button>
    </form>
  );
}

function FooterColumn({ title, links, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 md:pointer-events-none md:py-0"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300/80">{title}</p>
        <svg
          className={`h-4 w-4 text-slate-300/60 transition-transform md:hidden ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <ul
        className={`overflow-hidden space-y-2 text-sm transition-all duration-200 md:mt-3 md:max-h-none md:pb-0 ${open ? "max-h-40 pb-4" : "max-h-0"}`}
      >
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-slate-200/85 transition-colors duration-200 hover:text-white">
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
        { label: t("footer.designServices"), href: "/design-services" },
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
        { label: t("footer.artworkGuidelines"), href: "/artwork-guidelines" },
        { label: t("footer.specs"), href: "/design-services" },
        { label: t("footer.faq"), href: "/faq" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.contact"), href: "/contact" },
        { label: t("footer.orderStatus"), href: "/track-order" },
        { label: t("footer.shipping"), href: "/faq" },
      ],
    },
    {
      title: t("footer.contact"),
      links: [
        { label: "info@lunarprint.ca", href: "mailto:info@lunarprint.ca" },
        { label: "647-783-4728", href: "tel:+16477834728" },
        {
          label: "11 Progress Ave #21, Scarborough",
          href: "https://maps.google.com/?q=11+Progress+Ave+%2321+Scarborough+ON+M1P+4S7",
        },
      ],
    },
  ];

  return (
    <footer className="bg-[#101b2d] text-slate-200">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-12">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-lunarprint.png" alt="La Lunar Printing" width={40} height={40} className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white leading-tight">La Lunar Printing</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-300/60">{t("footer.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300/70">
            <span className="text-[11px] uppercase tracking-[0.15em]">{t("footer.madeIn")}</span>
            <span className="rounded-md border border-white/20 px-2 py-0.5 text-[10px] font-semibold">CA</span>
          </div>
        </div>

        <div className="md:grid md:grid-cols-5 md:gap-10">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/75">{t("footer.newsletterTitle")}</p>
              <NewsletterForm t={t} />
            </div>
            <div className="flex items-center gap-3">
              <span className="mr-1 text-xs text-slate-300/60">{t("footer.followUs")}</span>
              <a
                href="https://www.instagram.com/lunarprinting"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200/80 transition-colors hover:border-[#d9b35b] hover:text-white"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/lunarprinting"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200/80 transition-colors hover:border-[#d9b35b] hover:text-white"
                aria-label="Facebook"
              >
                Facebook
              </a>
              <span className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200/75" title="WeChat: lunarprinting">
                WeChat
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-300/70 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/20 px-2 py-1">Visa</span>
            <span className="rounded-md border border-white/20 px-2 py-1">Mastercard</span>
            <span className="rounded-md border border-white/20 px-2 py-1">Amex</span>
            <span className="rounded-md border border-white/20 px-2 py-1">E-Transfer</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link href="/refund-policy" className="transition-colors hover:text-white">Refund Policy</Link>
          </div>
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
