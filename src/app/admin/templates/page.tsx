import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { TemplateToggle } from "@/components/admin/template-toggle";

export const metadata = { title: "Templates" };

export default async function AdminTemplatesPage() {
  const templates = await prisma.template.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Templates</h1>
      <ul className="mt-6 space-y-3">
        {templates.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4">
            <div>
              <p className="font-serif text-lg">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.category.name} · v{t.version}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge variant={t.status === "ACTIVE" ? "success" : "muted"}>{t.status}</Badge>
              <TemplateToggle templateId={t.id} active={t.status === "ACTIVE"} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
