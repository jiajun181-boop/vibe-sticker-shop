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
    return <p className="text-xs font-medium text-emerald-700">{t("footer.subscribed")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("footer.emailPlaceholder")}
        className="min-w-0 flex-1 rounded-lg border border-[var(--color-gray-300)] bg-white px-3 py-2 text-xs text-[var(--color-gray-700)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-moon-blue)] focus:outline-none"
        required
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-[var(--color-moon-gold)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50"
      >
        {t("footer.subscribe")}
      </button>
    </form>
  );
}

function FooterColumn({ title, links, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--color-gray-200)] md:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 md:pointer-events-none md:py-0"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-gray-500)]">{title}</p>
        <svg
          className={`h-4 w-4 text-[var(--color-gray-400)] transition-transform md:hidden ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <ul
        className={`overflow-hidden space-y-2 text-sm transition-all duration-200 md:mt-3 md:max-h-none md:pb-0 ${open ? "max-h-60 pb-4" : "max-h-0"}`}
      >
        {links.map((link) =>
          link.href.startsWith("tel:") || link.href.startsWith("mailto:") || link.external ? (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-[var(--color-gray-600)] transition-colors duration-200 hover:text-[var(--color-moon-blue)]"
              >
                {link.label}
              </a>
            </li>
          ) : (
            <li key={link.label}>
              <Link href={link.href} className="text-[var(--color-gray-600)] transition-colors duration-200 hover:text-[var(--color-moon-blue)]">
                {link.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  );
}

/* ── SVG icons ── */
function InstagramIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11a3 3 0 110-6 3 3 0 010 6z" />
    </svg>
  );
}

function WeChatIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 01-.253-1.727c0-3.65 3.387-6.608 7.564-6.608.226 0 .447.012.668.03C16.755 4.985 13.035 2.188 8.691 2.188zm-2.79 4.401a1.188 1.188 0 11.001 2.377 1.188 1.188 0 010-2.377zm5.235 0a1.188 1.188 0 11.001 2.377 1.188 1.188 0 010-2.377zM16.312 9.5c-3.645 0-6.6 2.532-6.6 5.656 0 3.123 2.955 5.656 6.6 5.656a8.35 8.35 0 002.35-.337.72.72 0 01.596.08l1.578.923a.27.27 0 00.14.045.245.245 0 00.24-.245c0-.06-.024-.12-.04-.177l-.323-1.228a.49.49 0 01.177-.553C22.753 18.405 23.5 16.706 23.5 15.156c0-3.124-2.723-5.656-7.188-5.656zm-2.49 3.263a.988.988 0 11.002 1.976.988.988 0 010-1.976zm4.982 0a.988.988 0 11.002 1.976.988.988 0 010-1.976z" />
    </svg>
  );
}

/* ── Payment card icons ── */
function VisaIcon() {
  return (
    <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M19.5 21h-3l1.9-11.5h3L19.5 21zm8-11.5l-2.8 7.9-.3-1.6-1-5.3s-.1-1-1.4-1H18l-.1.3s1.5.3 3.2 1.4l2.7 10.3h3.1l4.7-12h-3.1zm12.3 11.5h2.7l-2.4-11.5h-2.4c-.9 0-1.3.5-1.3.5L32 21h3.1l.6-1.7h3.8l.3 1.7zm-3.3-4l1.6-4.3.9 4.3h-2.5zM28 13.3l.4-2.4s-1.3-.5-2.6-.5c-1.5 0-4.9.6-4.9 3.7 0 2.9 4 2.9 4 4.4s-3.6 1.2-4.8.3l-.4 2.5s1.3.6 3.3.6 5-1 5-3.8-4-3.2-4-4.4c0-1.3 2.7-1.1 4-.4z" fill="white" />
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#252525" />
      <circle cx="19" cy="16" r="8" fill="#EB001B" />
      <circle cx="29" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 9.8a8 8 0 010 12.4 8 8 0 000-12.4z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#2E77BC" />
      <text x="24" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial">AMEX</text>
    </svg>
  );
}

function ETransferIcon() {
  return (
    <svg className="h-5 w-8" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#F5A623" />
      <text x="24" y="18" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">e-Transfer</text>
    </svg>
  );
}

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/lunarprinting",
    icon: InstagramIcon,
    hoverClass: "hover:border-pink-400 hover:bg-pink-50 hover:text-pink-500",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/lunarprinting",
    icon: FacebookIcon,
    hoverClass: "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600",
  },
  {
    label: "Google Maps",
    href: "https://maps.google.com/?q=11+Progress+Ave+%2321+Scarborough+ON+M1P+4S7",
    icon: MapPinIcon,
    hoverClass: "hover:border-red-400 hover:bg-red-50 hover:text-red-500",
  },
  {
    label: "WeChat",
    href: null, // not a link
    icon: WeChatIcon,
    title: "WeChat: lunarprinting",
  },
];

export default function Footer({ locale = "en" }) {
  const t = createT(locale);

  const columns = [
    {
      title: t("footer.products"),
      links: [
        { label: t("footer.marketingPrints"), href: "/shop/marketing-business-print" },
        { label: t("footer.stickersLabels"), href: "/shop/stickers-labels-decals" },
        { label: t("footer.signsBoards"), href: "/shop/signs-rigid-boards" },
        { label: t("footer.bannersDisplays"), href: "/shop/banners-displays" },
        { label: t("footer.canvasPrints"), href: "/shop/canvas-prints" },
        { label: t("footer.windowsWallsFloors"), href: "/shop/windows-walls-floors" },
        { label: t("footer.vehicleBranding"), href: "/shop/vehicle-graphics-fleet" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { label: t("footer.artworkGuidelines"), href: "/artwork-guidelines" },
        { label: t("footer.requestQuote"), href: "/quote" },
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.designServices"), href: "/design-services" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: t("footer.contactUs"), href: "/contact" },
        { label: t("footer.orderStatus"), href: "/track-order" },
        { label: t("footer.shipping"), href: "/returns" },
        { label: t("footer.wholesale"), href: "/wholesale" },
        { label: t("footer.company"), href: "/about" },
      ],
    },
    {
      title: t("footer.getInTouch"),
      links: [
        { label: "info@lunarprint.ca", href: "mailto:info@lunarprint.ca" },
        { label: "647-783-4728 (EN)", href: "tel:+16477834728" },
        { label: "647-886-9288 (中文)", href: "tel:+16478869288" },
        {
          label: "11 Progress Ave #21, Scarborough",
          href: "https://maps.google.com/?q=11+Progress+Ave+%2321+Scarborough+ON+M1P+4S7",
          external: true,
        },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-[var(--color-gray-200)] bg-[var(--color-paper-white)] text-[var(--color-gray-700)]">
      {/* Gradient top transition */}
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-moon-gold)] to-transparent opacity-30" />
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-12">
        {/* Logo + tagline */}
        <div className="mb-8 flex flex-col gap-4 border-b border-[var(--color-gray-200)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-lunarprint.png" alt="La Lunar Printing" width={40} height={40} className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-gray-800)] leading-tight">La Lunar Printing</p>
              <p className="mt-0.5 label-sm uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("footer.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[var(--color-gray-500)]">
            <span className="label-sm uppercase tracking-[0.14em]">{t("footer.madeIn")}</span>
            <span className="rounded-md border border-[var(--color-gray-300)] px-2 py-0.5 label-xs font-semibold">CA</span>
          </div>
        </div>

        {/* 4-column grid */}
        <div className="md:grid md:grid-cols-4 md:gap-10">
          {columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        {/* Newsletter + Social */}
        <div className="mt-8 border-t border-[var(--color-gray-200)] pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("footer.newsletterTitle")}</p>
              <NewsletterForm t={t} />
            </div>
            <div className="flex items-center gap-3">
              <span className="mr-1 text-xs text-[var(--color-gray-500)]">{t("footer.followUs")}</span>
              {socialLinks.map((s) =>
                s.href ? (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-gray-300)] text-[var(--color-gray-500)] transition-colors ${s.hoverClass}`}
                    aria-label={s.label}
                  >
                    <s.icon />
                  </a>
                ) : (
                  <span
                    key={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-gray-300)] text-[var(--color-gray-500)] cursor-default"
                    title={s.title}
                  >
                    <s.icon />
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar: payment + legal + copyright */}
        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--color-gray-200)] pt-6 text-xs text-[var(--color-gray-500)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <VisaIcon />
            <MastercardIcon />
            <AmexIcon />
            <ETransferIcon />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-[var(--color-moon-blue)]">{t("footer.privacy")}</Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--color-moon-blue)]">{t("footer.terms")}</Link>
            <Link href="/refund-policy" className="transition-colors hover:text-[var(--color-moon-blue)]">{t("footer.refund")}</Link>
          </div>
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
