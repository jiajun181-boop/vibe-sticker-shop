"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

const navItems = [
  { key: "account.nav.dashboard", href: "/account" },
  { key: "account.nav.orders", href: "/account/orders" },
  { key: "account.nav.addresses", href: "/account/addresses" },
  { key: "account.nav.profile", href: "/account/profile", b2bOnly: true },
  { key: "account.nav.favorites", href: "/account/favorites" },
  { key: "account.nav.templates", href: "/account/templates", label: "Templates" },
  { key: "account.nav.support", href: "/account/support", label: "Support" },
];

export default function AccountNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const isB2b = user?.accountType === "B2B";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <aside className="w-full shrink-0 md:w-56">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
        {t("account.title")}
      </h2>
      <nav className="mt-4 flex flex-row gap-1 overflow-x-auto md:flex-col">
        {navItems.filter((item) => !item.b2bOnly || isB2b).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-gray-100)] text-[var(--color-gray-900)]"
                  : "text-[var(--color-gray-500)] hover:bg-[var(--color-gray-50)] hover:text-[var(--color-gray-900)]"
              }`}
            >
              {t(item.key)}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--color-gray-500)] transition-colors hover:bg-[var(--color-gray-50)] hover:text-red-600"
        >
          {t("account.nav.logout")}
        </button>
      </nav>
    </aside>
  );
}
