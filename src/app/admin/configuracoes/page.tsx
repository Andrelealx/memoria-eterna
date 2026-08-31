import { brand } from "@/lib/brand";
import { getEnv } from "@/lib/env";

export const metadata = { title: "Configurações" };

export default function AdminConfigPage() {
  const env = getEnv();

  const rows: [string, string][] = [
    ["Nome da marca (trabalho)", brand.name],
    ["Domínio", brand.domain],
    ["App URL", brand.url],
    ["Fake payment (dev)", env.DEV_FAKE_PAYMENT_ENABLED ? "ativo" : "inativo"],
    ["Mercado Pago configurado", env.MERCADO_PAGO_ACCESS_TOKEN ? "sim" : "não"],
    ["Resend configurado", env.RESEND_API_KEY ? "sim" : "não"],
    ["Supabase configurado", env.SUPABASE_SERVICE_ROLE_KEY ? "sim" : "não"],
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">Configurações</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Estas são configurações somente leitura (algumas virão de variáveis de ambiente).
      </p>

      <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-3 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
