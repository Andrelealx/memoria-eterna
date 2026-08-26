import { prisma } from "@/lib/db";

export const metadata = { title: "Templates" };

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({ include: { category: true } });

  return (
    <div>
      <h1 className="font-serif text-3xl">Templates</h1>
      <ul className="mt-6 space-y-3">
        {templates.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-4">
            <div>
              <p className="font-serif text-lg">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.category.name} · v{t.version}</p>
            </div>
            <span className="text-xs text-muted-foreground">{t.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
