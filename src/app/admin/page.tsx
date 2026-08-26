import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";

export const metadata = { title: "Admin" };

function sinceDays(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AdminDashboard() {
  const [ordersToday, orders7d, orders30d, approvedAgg, physicalByStatus, tagsToWrite, tagsToTest, reportsOpen, projectsProcessing] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: sinceDays(1) } } }),
      prisma.order.count({ where: { createdAt: { gte: sinceDays(7) } } }),
      prisma.order.count({ where: { createdAt: { gte: sinceDays(30) } } }),
      prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
      prisma.physicalOrder.groupBy({ by: ["status"], _count: true }),
      prisma.nfcTag.count({ where: { status: "GENERATED" } }),
      prisma.nfcTag.count({ where: { status: "WRITTEN" } }),
      prisma.abuseReport.count({ where: { status: "OPEN" } }),
      prisma.project.count({ where: { status: "PROCESSING" } }),
    ]);

  const revenue = approvedAgg._sum.amount ?? 0;
  const paidOrders = await prisma.order.count({ where: { status: "PAID" } });

  const cards = [
    { label: "Pedidos hoje", value: String(ordersToday) },
    { label: "Pedidos (7 dias)", value: String(orders7d) },
    { label: "Pedidos (30 dias)", value: String(orders30d) },
    { label: "Receita aprovada", value: formatBRL(revenue) },
    { label: "Ticket médio", value: paidOrders > 0 ? formatBRL(Math.round(revenue / paidOrders)) : "—" },
    { label: "Projetos processando", value: String(projectsProcessing) },
    { label: "Tags a gravar", value: String(tagsToWrite) },
    { label: "Tags a testar", value: String(tagsToTest) },
    { label: "Denúncias pendentes", value: String(reportsOpen) },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-white p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-serif text-3xl">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-xl">Pedidos físicos por etapa</h2>
      {physicalByStatus.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nenhum pedido físico ainda.</p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {physicalByStatus.map((p) => (
            <li key={p.status} className="flex justify-between rounded-xl border border-border bg-white px-4 py-2 text-sm">
              <span>{p.status}</span>
              <span className="font-medium">{p._count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
