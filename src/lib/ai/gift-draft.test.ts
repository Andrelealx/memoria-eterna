import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import {
  aiGiftDraftRequestSchema,
  generateDemoGiftDraft,
  generatedGiftDraftSchema,
} from "./gift-draft";

describe("rascunho de presente com IA", () => {
  it("valida um relato com contexto suficiente", () => {
    const parsed = aiGiftDraftRequestSchema.safeParse({
      prompt: "Quero criar um presente para minha amiga com as histórias das nossas viagens.",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.tone).toBe("automatico");
      expect(parsed.data.detailLevel).toBe("equilibrado");
    }
    expect(aiGiftDraftRequestSchema.safeParse({ prompt: "Muito curto" }).success).toBe(false);
    expect(
      aiGiftDraftRequestSchema.safeParse({
        prompt: "Quero criar um presente para minha amiga com muitas lembranças especiais.",
        tone: "agressivo",
      }).success,
    ).toBe(false);
  });

  it("gera uma demonstração válida sem inventar fatos estruturados", () => {
    const draft = generateDemoGiftDraft(
      "Quero homenagear minha cachorra Mel, que transformou a nossa casa com seu jeito brincalhão.",
    );
    const parsed = generatedGiftDraftSchema.parse(draft);
    const template = DEFAULT_TEMPLATES.find((item) => item.slug === parsed.templateSlug);

    expect(parsed.niche).toBe("pet");
    expect(parsed.recipientName).toBe("Mel");
    expect(template?.niche).toBe("pet");
    expect(template?.presets.colorSchemes).toContain(parsed.colorScheme);
    expect(parsed.moments).toEqual([]);
  });

  it("respeita o catálogo ativo mesmo quando o nicho sugerido não está disponível", () => {
    const activeTemplates = DEFAULT_TEMPLATES.filter((template) => template.niche === "amizade");
    const draft = generateDemoGiftDraft(
      "Quero homenagear minha cachorra Mel, que trouxe muita alegria para a nossa família.",
      { templates: activeTemplates },
    );

    expect(draft.niche).toBe("amizade");
    expect(activeTemplates.some((template) => template.slug === draft.templateSlug)).toBe(true);
  });

  it("rejeita datas impossíveis mesmo quando o formato parece ISO", () => {
    expect(
      generatedGiftDraftSchema.safeParse({
        niche: "romance",
        templateSlug: "romance-classico",
        relationshipDate: "2026-99-99",
        colorScheme: "vinho",
      }).success,
    ).toBe(false);
  });

  it("aproveita o nome de quem cria quando ele aparece explicitamente", () => {
    const draft = generateDemoGiftDraft(
      "Meu nome é Bruno e quero criar um presente para minha esposa Marina com nossas lembranças.",
    );
    expect(draft.creatorName).toBe("Bruno");
    expect(draft.recipientName).toBe("Marina");
  });
});
