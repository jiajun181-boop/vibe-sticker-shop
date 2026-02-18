import AccountNav from "./AccountNav";

export const metadata = {
  title: "My Account | La Lunar Printing Inc.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }) {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <AccountNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
