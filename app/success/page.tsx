import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed | La Lunar Printing Inc.",
  robots: { index: false, follow: false },
};

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    st?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const statusToken = params.st;

  if (!sessionId) {
    redirect("/");
  }
  return <SuccessClient sessionId={sessionId} statusToken={statusToken || ""} />;
}
