import { describe, expect, it } from "vitest";
import {
  CHECKOUT_STORAGE_KEY_PREFIX,
  DRAFT_HISTORY_KEY,
  LEGACY_DRAFT_TOKEN_STORAGE_KEY,
  MAX_LOCAL_DRAFTS,
  checkoutStorageKey,
  getDraft,
  listDraftMemories,
  migrateLegacyDraft,
  removeDraftMemory,
  upsertDraftMemory,
  type DraftMemoryStorage,
} from "./draft-memory";

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function draft(token: string, day: number) {
  return {
    token,
    title: `Presente ${token}`,
    templateSlug: "amor-minimalista",
    updatedAt: `2026-08-${String(day).padStart(2, "0")}T12:00:00.000Z`,
    lastStep: 2 as const,
  };
}

describe("draft memory", () => {
  it("insere, atualiza e ordena rascunhos pela atividade mais recente", () => {
    const storage = new MemoryStorage();

    upsertDraftMemory(storage, draft("primeiro_token", 1));
    upsertDraftMemory(storage, draft("segundo_token", 2));
    upsertDraftMemory(storage, {
      ...draft("primeiro_token", 3),
      title: "Título atualizado",
      lastStep: 5,
    });

    expect(listDraftMemories(storage)).toEqual([
      expect.objectContaining({
        token: "primeiro_token",
        title: "Título atualizado",
        lastStep: 5,
        updatedAt: "2026-08-03T12:00:00.000Z",
      }),
      expect.objectContaining({ token: "segundo_token" }),
    ]);
    expect(getDraft("primeiro_token", storage)?.templateSlug).toBe("amor-minimalista");
  });

  it("mantém somente os cinco rascunhos mais recentes", () => {
    const storage = new MemoryStorage();

    for (let day = 1; day <= MAX_LOCAL_DRAFTS + 2; day += 1) {
      upsertDraftMemory(storage, draft(`token_${day}`, day));
    }

    expect(listDraftMemories(storage).map(({ token }) => token)).toEqual([
      "token_7",
      "token_6",
      "token_5",
      "token_4",
      "token_3",
    ]);
  });

  it("migra o token legado uma única vez e só o apaga depois de persistir", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_DRAFT_TOKEN_STORAGE_KEY, "token_legado_123");

    const migrated = migrateLegacyDraft(storage, {
      title: "Nosso presente",
      templateSlug: "nossa-historia",
      updatedAt: "2026-08-29T10:00:00.000Z",
      lastStep: 3,
    });

    expect(migrated).toEqual({
      token: "token_legado_123",
      title: "Nosso presente",
      templateSlug: "nossa-historia",
      updatedAt: "2026-08-29T10:00:00.000Z",
      lastStep: 3,
    });
    expect(storage.getItem(LEGACY_DRAFT_TOKEN_STORAGE_KEY)).toBeNull();
    expect(listDraftMemories(storage)).toEqual([migrated]);
    expect(migrateLegacyDraft(storage)).toBeNull();
  });

  it("faz a migração automaticamente ao listar ou buscar", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_DRAFT_TOKEN_STORAGE_KEY, "token_auto_123");

    const result = getDraft("token_auto_123", storage);

    expect(result).toEqual(
      expect.objectContaining({
        token: "token_auto_123",
        title: "Presente em criação",
        templateSlug: "",
        lastStep: 0,
      }),
    );
    expect(result?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("remove apenas o rascunho solicitado", () => {
    const storage = new MemoryStorage();
    upsertDraftMemory(storage, draft("token_a", 1));
    upsertDraftMemory(storage, draft("token_b", 2));

    expect(removeDraftMemory(storage, "token_b")).toBe(true);
    expect(removeDraftMemory(storage, "token_inexistente")).toBe(false);
    expect(listDraftMemories(storage).map(({ token }) => token)).toEqual(["token_a"]);
  });

  it("ignora JSON e registros corrompidos e se recupera no próximo upsert", () => {
    const storage = new MemoryStorage();
    storage.setItem(DRAFT_HISTORY_KEY, "{json quebrado");

    expect(listDraftMemories(storage)).toEqual([]);
    expect(upsertDraftMemory(storage, draft("token_recuperado", 4))).not.toBeNull();
    expect(listDraftMemories(storage).map(({ token }) => token)).toEqual(["token_recuperado"]);

    storage.setItem(
      DRAFT_HISTORY_KEY,
      JSON.stringify([draft("token_valido", 5), null, { token: "incompleto" }]),
    );
    expect(listDraftMemories(storage).map(({ token }) => token)).toEqual(["token_valido"]);
  });

  it("não propaga falhas do Storage para a interface", () => {
    const unavailableStorage: DraftMemoryStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };

    expect(listDraftMemories(unavailableStorage)).toEqual([]);
    expect(getDraft("token_seguro", unavailableStorage)).toBeNull();
    expect(upsertDraftMemory(unavailableStorage, draft("token_seguro", 1))).toBeNull();
    expect(removeDraftMemory(unavailableStorage, "token_seguro")).toBe(false);
  });

  it("gera uma chave de checkout isolada por token", () => {
    expect(checkoutStorageKey("token_abc-123")).toBe(
      `${CHECKOUT_STORAGE_KEY_PREFIX}:token_abc-123`,
    );
    expect(() => checkoutStorageKey(" ")).toThrowError("Token de rascunho inválido");
  });
});
