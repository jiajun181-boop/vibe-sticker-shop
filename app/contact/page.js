import { getServerT } from "@/lib/i18n/server";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "Contact Us - La Lunar Printing Inc.",
    description: "Get in touch with our team for quotes, support, or questions about custom printing services.",
  };
}

export default async function ContactPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="rounded-3xl border border-gray-200 bg-white p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("contact.badge")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("contact.title")}</h1>
          <p className="mt-4 text-sm text-gray-600">{t("contact.subtitle")}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
            Your Print Partner &mdash; Essential to Your Brand
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <ContactForm />

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 space-y-4">
              <h2 className="text-lg font-semibold">{t("contact.info.title")}</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">{t("contact.info.address")}</p>
                    <p>Toronto, ON, Canada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">{t("contact.info.phone")}</p>
                    <a href="tel:+14165550199" className="hover:text-gray-900">+1 (416) 555-0199</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">{t("contact.info.email")}</p>
                    <a href="mailto:orders@lunarprint.ca" className="hover:text-gray-900">orders@lunarprint.ca</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-8">
              <h2 className="text-lg font-semibold">{t("contact.hours.title")}</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>{t("contact.hours.weekdays")}</span>
                  <span className="font-semibold text-gray-900">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("contact.hours.saturday")}</span>
                  <span className="font-semibold text-gray-900">10:00 AM - 3:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("contact.hours.sunday")}</span>
                  <span className="font-semibold text-gray-900">{t("contact.hours.closed")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
