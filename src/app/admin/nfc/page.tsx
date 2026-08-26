import { prisma } from "@/lib/db";
import { NFC_TAG_TRANSITIONS } from "@/lib/domain/state-machine";
import { NFC_TAG_LABELS, formatDate } from "@/lib/labels";
import { generateQrDataUrl, nfcUrl } from "@/lib/server/qr";
import { GenerateTag } from "@/components/admin/generate-tag";
import { TagActions } from "@/components/admin/tag-actions";

export const metadata = { title: "Tags NFC" };

export default async function AdminNfcPage() {
  const tags = await prisma.nfcTag.findMany({
    orderBy: { createdAt: "desc" },
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
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Tags NFC</h1>
        <GenerateTag />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ tag, qr, allowed }) => (
          <div key={tag.id} className="rounded-3xl border border-border bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-sm">{nfcUrl(tag.publicToken)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {NFC_TAG_LABELS[tag.status] ?? tag.status} · {formatDate(tag.createdAt)}
                </p>
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
      {tags.length === 0 && <p className="mt-6 text-muted-foreground">Nenhuma tag ainda.</p>}
    </div>
  );
}
