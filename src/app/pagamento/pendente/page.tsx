import type { Metadata } from "next";
import { PendingPayment } from "@/components/checkout/pending-payment";

export const metadata: Metadata = { title: "Pagamento pendente" };

export default async function PendentePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <PendingPayment orderId={order ?? ""} />;
}
