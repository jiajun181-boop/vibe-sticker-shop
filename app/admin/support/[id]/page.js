import { redirect } from "next/navigation";

export default async function LegacySupportDetailPage({
  params,
}) {
  const { id } = await params;
  redirect(`/admin/customers/support/${id}`);
}
