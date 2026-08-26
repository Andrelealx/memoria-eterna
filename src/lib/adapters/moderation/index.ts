// Moderação de conteúdo (seção 18). Sem serviço externo no MVP, NÃO há análise
// por IA: o adapter padrão é "noop" (aprova tudo) e a moderação efetiva é feita
// por denúncia + revisão administrativa + estados de bloqueio.

export interface ModerationResult {
  approved: boolean;
  flags: string[];
}

export interface ContentModerationAdapter {
  readonly name: string;
  moderate(input: { text?: string; mimeType?: string }): Promise<ModerationResult>;
}

/** Adapter padrão do MVP: não alega análise por IA; apenas aprova. */
export class NoopModerationAdapter implements ContentModerationAdapter {
  readonly name = "noop";

  async moderate(): Promise<ModerationResult> {
    return { approved: true, flags: [] };
  }
}
