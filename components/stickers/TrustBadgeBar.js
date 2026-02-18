"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

const CheckIcon = () => (
  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TruckIcon = () => (
  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

export default function TrustBadgeBar() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-5">
      {[
        { Icon: CheckIcon, key: "stickerOrder.badgeWaterproof" },
        { Icon: TruckIcon, key: "stickerOrder.badgeShipping" },
        { Icon: CheckIcon, key: "stickerOrder.badgeProof" },
      ].map(({ Icon, key }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-gray-700)] shadow-sm ring-1 ring-[var(--color-gray-200)]"
        >
          <Icon />
          {t(key)}
        </span>
      ))}
    </div>
  );
}
