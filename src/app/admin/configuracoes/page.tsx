import { headers } from "next/headers";
import { brand } from "@/lib/brand";
import { getEnv } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import type { StatusVariant } from "@/lib/labels";

export const metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

type CheckResult = {
  label: string;
  ok: boolean;
  detail: string;
};

async function checkAppUrl(configuredUrl: string, requestHost: string | null): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // 1) A URL configurada bate com o host que está de fato servindo esta página?
  let configuredHost: string | null = null;
  try {
    configuredHost = new URL(configuredUrl).host;
  } catch {
    results.push({
      label: "NEXT_PUBLIC_APP_URL é uma URL válida",
      ok: false,
      detail: `"${configuredUrl}" não é uma URL válida.`,
    });
    return results;
  }

  if (requestHost) {
    const matches = configuredHost.toLowerCase() === requestHost.toLowerCase();
    results.push({
      label: "Domínio configurado bate com o domínio acessado",
      ok: matches,
      detail: matches
        ? `NEXT_PUBLIC_APP_URL (${configuredHost}) confere com o host desta requisição (${requestHost}).`
        : `NEXT_PUBLIC_APP_URL está como "${configuredHost}", mas esta página está sendo acessada por "${requestHost}". Emails e links gerados pelo servidor podem apontar para o domínio errado.`,
    });
  }

  // 2) A URL configurada responde diretamente, sem redirecionar? (Mercado Pago não segue redirects em webhooks)
  try {
    const res = await fetch(configuredUrl, { redirect: "manual", cache: "no-store" });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      results.push({
        label: "URL configurada não redireciona",
        ok: false,
        detail: `${configuredUrl} respondeu com redirecionamento (${res.status}) para "${location ?? "?"}". Isso já causou falha real no webhook do Mercado Pago (ele não segue redirects). Ajuste NEXT_PUBLIC_APP_URL para o domínio final, sem "www" faltando ou sobrando.`,
      });
    } else {
      results.push({
        label: "URL configurada não redireciona",
        ok: res.ok,
        detail: res.ok
          ? `${configuredUrl} respondeu diretamente com status ${res.status}, sem redirecionamento.`
          : `${configuredUrl} respondeu com status ${res.status}.`,
      });
    }
  } catch (e) {
    results.push({
      label: "URL configurada não redireciona",
      ok: false,
      detail: `Não foi possível checar ${configuredUrl}: ${e instanceof Error ? e.message : "erro desconhecido"}.`,
    });
  }

  return results;
}

function variantFor(ok: boolean): StatusVariant {
  return ok ? "success" : "error";
}

export default async function AdminConfigPage() {
  const env = getEnv();
  const h = await headers();
  const requestHost = h.get("host");

  const urlChecks = await checkAppUrl(brand.url, requestHost);
  const allOk = urlChecks.every((c) => c.ok);

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

      <div
        className={`mt-6 rounded-2xl border px-5 py-4 ${
          allOk ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <Badge variant={variantFor(allOk)}>{allOk ? "Configuração OK" : "Alarme de configuração"}</Badge>
          <span className="text-sm font-medium">
            {allOk
              ? "Domínio e URL configurados batem com o ambiente ao vivo."
              : "Encontramos inconsistências entre a URL configurada e o domínio real."}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {urlChecks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              <Badge variant={variantFor(c.ok)} className="mt-0.5 shrink-0">
                {c.ok ? "ok" : "falha"}
              </Badge>
              <div>
                <p className="font-medium">{c.label}</p>
                <p className="text-muted-foreground">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

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
