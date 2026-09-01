import type { Metadata } from "next";
import { CreationWizard } from "@/components/wizard/creation-wizard";
import { listActiveTemplates } from "@/lib/server/templates";
import { listActivePlans } from "@/lib/server/plans";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Criar presente",
};

// A finalização de fotos e a geração assistida podem envolver processamento
// remoto; a Vercel Hobby permite até 60 segundos por Server Action.
export const maxDuration = 60;

export default async function CriarPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const [{ template }, templates, plans] = await Promise.all([
    searchParams,
    listActiveTemplates(),
    listActivePlans(),
  ]);
  const env = getEnv();
  const aiEnabled =
    Boolean(env.DEEPSEEK_API_KEY) ||
    (process.env.NODE_ENV !== "production" && env.DEV_FAKE_AI_ENABLED);
  return (
    <CreationWizard
      templates={templates}
      plans={plans}
      initialTemplateSlug={template}
      aiEnabled={aiEnabled}
    />
  );
}
