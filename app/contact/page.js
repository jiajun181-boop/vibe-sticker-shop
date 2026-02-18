import { getServerT } from "@/lib/i18n/server";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "Contact Us | La Lunar Printing Inc.",
    description: "Get in touch with our team for quotes, support, or questions about custom printing services in Toronto.",
    alternates: { canonical: `${SITE_URL}/contact` },
  };
}

export default async function ContactPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-4 py-14 text-[var(--color-gray-800)] sm:px-6">
      <div className="mx-auto max-w-[1400px] space-y-10 2xl:px-4">
        <header className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gray-500)]">{t("contact.badge")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("contact.title")}</h1>
          <p className="mt-4 text-sm text-[var(--color-gray-600)]">{t("contact.subtitle")}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
            {t("common.brandTagline")}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-8 space-y-4">
              <h2 className="text-lg font-semibold">{t("contact.info.title")}</h2>
              <div className="space-y-4 text-sm text-[var(--color-gray-600)]">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[var(--color-gray-900)]">{t("contact.info.address")}</p>
                    <p>11 Progress Ave #21</p>
                    <p>Scarborough, ON M1P 4S7, Canada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[var(--color-gray-900)]">{t("contact.info.phone")}</p>
                    <a href="tel:+16477834728" className="hover:text-[var(--color-gray-900)]">647-783-4728 (English)</a>
                    <br />
                    <a href="tel:+16478869288" className="hover:text-[var(--color-gray-900)]">647-886-9288 (Chinese)</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[var(--color-gray-900)]">{t("contact.info.email")}</p>
                    <a href="mailto:info@lunarprint.ca" className="hover:text-[var(--color-gray-900)]">info@lunarprint.ca</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-gray-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-[var(--color-gray-900)]">WeChat</p>
                    <p>lunarprinting</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-8">
              <h2 className="text-lg font-semibold">{t("contact.hours.title")}</h2>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-gray-600)]">
                <div className="flex justify-between">
                  <span>{t("contact.hours.weekdays")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">10:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("contact.hours.saturday")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">{t("contact.hours.closed")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("contact.hours.sunday")}</span>
                  <span className="font-semibold text-[var(--color-gray-900)]">{t("contact.hours.closed")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-2 overflow-hidden">
              <iframe
                title="La Lunar Printing Inc. Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2881.5!2d-79.2645!3d43.7735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89d4ce80c1f5c26d%3A0x0!2s11+Progress+Ave+%2321%2C+Scarborough%2C+ON+M1P+4S7!5e0!3m2!1sen!2sca!4v1700000000000"
                width="100%"
                height="280"
                style={{ border: 0, borderRadius: "1.25rem" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=11+Progress+Ave+%2321,+Scarborough,+ON+M1P+4S7"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-gray-900)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {t("contact.getDirections")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

