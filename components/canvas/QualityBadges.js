"use client";

const badges = [
  {
    title: "Epson SC9100",
    description: "Professional wide-format printer",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.234l.008.005"
        />
      </svg>
    ),
  },
  {
    title: "Pigment Ink",
    description: "100+ year fade resistance",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2.25c0 0-5.25 6.75-5.25 10.5a5.25 5.25 0 0010.5 0C17.25 9 12 2.25 12 2.25z"
        />
      </svg>
    ),
  },
  {
    title: "Museum Quality",
    description: "Acid-free canvas, kiln-dried bars",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: "Vivid Colors",
    description: "10-color UltraChrome ink system",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125V11.25a1.5 1.5 0 01-.439 1.06L6.75 15.621"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 8.625c0-.621.504-1.125 1.125-1.125h.375a1.125 1.125 0 011.125 1.125v.375c0 .621-.504 1.125-1.125 1.125h-.375a1.125 1.125 0 01-1.125-1.125v-.375z"
        />
      </svg>
    ),
  },
];

export default function QualityBadges({ className = "" }) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}
    >
      {badges.map((badge) => (
        <div
          key={badge.title}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-center"
        >
          <div className="text-gray-700">{badge.icon}</div>
          <p className="text-sm font-bold leading-tight text-gray-900">
            {badge.title}
          </p>
          <p className="text-xs leading-snug text-gray-500">
            {badge.description}
          </p>
        </div>
      ))}
    </div>
  );
}
