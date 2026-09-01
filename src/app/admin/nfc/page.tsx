import Link from "next/link";
import type { NfcTagStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NFC_TAG_TRANSITIONS } from "@/lib/domain/state-machine";
import { NFC_TAG_LABELS, formatDate, statusVariant } from "@/lib/labels";
import { generateQrDataUrl, nfcUrl } from "@/lib/server/qr";
import { GenerateTag } from "@/components/admin/generate-tag";
import { TagActions } from "@/components/admin/tag-actions";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Tags NFC" };

const STATUSES = Object.keys(NFC_TAG_LABELS);
const PAGE_SIZE = 60;

export default async function AdminNfcPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const where: Prisma.NfcTagWhereInput =
    status && STATUSES.includes(status) ? { status: status as NfcTagStatus } : {};

  const tags = await prisma.nfcTag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { project: true },
  });

  const rows = await Promise.all(
    tags.map(async (t) => ({
      tag: t,
      qr: await generateQrDataUrl(nfcUrl(t.publicToken)),
      allowed: NFC_TAG_TRANSITIONS[t.status as keyof typeof NFC_TAG_TRANSITIONS] ?? [],
    })),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">Tags NFC</h1>
        <GenerateTag />
      </div>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {NFC_TAG_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
        {status && (
          <Link
            href="/admin/nfc"
            className="text-muted-foreground hover:text-primary self-center text-sm underline"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ tag, qr, allowed }) => (
          <div key={tag.id} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm">{nfcUrl(tag.publicToken)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={statusVariant(tag.status)}>{NFC_TAG_LABELS[tag.status] ?? tag.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(tag.createdAt)}</span>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR Code" className="h-16 w-16 rounded" />
            </div>
            <div className="mt-4">
              <TagActions tagId={tag.id} allowed={allowed} />
            </div>
          </div>
        ))}
      </div>
      {tags.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {status ? "Nenhuma tag encontrada com esse filtro." : "Nenhuma tag ainda."}
        </p>
      )}
      {tags.length === PAGE_SIZE && (
        <p className="mt-4 text-xs text-muted-foreground">
          Mostrando as {PAGE_SIZE} tags mais recentes. Filtre por status para achar tags mais antigas.
        </p>
      )}
    </div>
  );
}
