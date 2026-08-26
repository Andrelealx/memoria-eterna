"use server";

import { prisma } from "@/lib/db";
import { sanitizeText } from "@/lib/domain/sanitize";

// Denúncia de conteúdo (seções 5, 18).

export async function submitReport(input: {
  projectId: string;
  reason: string;
  description?: string;
  contact?: string;
}): Promise<{ ok: boolean }> {
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) return { ok: true }; // não vaza existência

  await prisma.abuseReport.create({
    data: {
      projectId: project.id,
      reason: sanitizeText(input.reason, 120),
      description: input.description ? sanitizeText(input.description, 2000) : null,
      contact: input.contact ? sanitizeText(input.contact, 200) : null,
      status: "OPEN",
    },
  });

  return { ok: true };
}
