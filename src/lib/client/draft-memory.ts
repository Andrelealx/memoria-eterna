export const DRAFT_HISTORY_KEY = "foryoupage:drafts";
export const LEGACY_DRAFT_TOKEN_STORAGE_KEY = "foryoupage:draftToken";
export const CHECKOUT_STORAGE_KEY_PREFIX = "foryoupage:checkout";
export const MAX_LOCAL_DRAFTS = 5;

export type DraftStep = 0 | 1 | 2 | 3 | 4 | 5;

export type DraftMemoryEntry = {
  token: string;
  title: string;
  templateSlug: string;
  updatedAt: string;
  lastStep: DraftStep;
};

export type DraftMemoryInput = Omit<DraftMemoryEntry, "updatedAt"> & {
  updatedAt?: string | Date;
};

export type LegacyDraftDefaults = Partial<Omit<DraftMemoryInput, "token">>;

export type DraftMemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const DEFAULT_DRAFT_TITLE = "Presente em criação";
const MAX_TOKEN_LENGTH = 256;
const MAX_TITLE_LENGTH = 160;
const MAX_TEMPLATE_SLUG_LENGTH = 100;

function browserStorage(): DraftMemoryStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorage(storage: DraftMemoryStorage | null | undefined): DraftMemoryStorage | null {
  return storage === undefined ? browserStorage() : storage;
}

function safeGet(storage: DraftMemoryStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: DraftMemoryStorage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage: DraftMemoryStorage, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const token = value.trim();
  if (!token || token.length > MAX_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }

  return token;
}

function normalizeText(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength) || fallback;
}

function normalizeIsoDate(value: unknown, fallback?: Date): string | null {
  const date =
    value instanceof Date ? value : typeof value === "string" ? new Date(value) : fallback;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function isDraftStep(value: unknown): value is DraftStep {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredDraft(value: unknown): DraftMemoryEntry | null {
  if (!isRecord(value)) return null;

  const token = normalizeToken(value.token);
  const updatedAt = normalizeIsoDate(value.updatedAt);
  if (
    !token ||
    typeof value.title !== "string" ||
    typeof value.templateSlug !== "string" ||
    !updatedAt ||
    !isDraftStep(value.lastStep)
  ) {
    return null;
  }

  return {
    token,
    title: normalizeText(value.title, DEFAULT_DRAFT_TITLE, MAX_TITLE_LENGTH),
    templateSlug: normalizeText(value.templateSlug, "", MAX_TEMPLATE_SLUG_LENGTH),
    updatedAt,
    lastStep: value.lastStep,
  };
}

function normalizeInput(input: DraftMemoryInput, now: Date): DraftMemoryEntry | null {
  const token = normalizeToken(input.token);
  if (!token) return null;

  return {
    token,
    title: normalizeText(input.title, DEFAULT_DRAFT_TITLE, MAX_TITLE_LENGTH),
    templateSlug: normalizeText(input.templateSlug, "", MAX_TEMPLATE_SLUG_LENGTH),
    updatedAt: normalizeIsoDate(input.updatedAt, now) ?? now.toISOString(),
    lastStep: isDraftStep(input.lastStep) ? input.lastStep : 0,
  };
}

function newestFirst(drafts: DraftMemoryEntry[]): DraftMemoryEntry[] {
  return drafts.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function deduplicateAndLimit(drafts: DraftMemoryEntry[]): DraftMemoryEntry[] {
  const seen = new Set<string>();

  return newestFirst(drafts)
    .filter((draft) => {
      if (seen.has(draft.token)) return false;
      seen.add(draft.token);
      return true;
    })
    .slice(0, MAX_LOCAL_DRAFTS);
}

function readStoredDrafts(storage: DraftMemoryStorage): DraftMemoryEntry[] {
  const raw = safeGet(storage, DRAFT_HISTORY_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return deduplicateAndLimit(parsed.map(parseStoredDraft).filter((draft) => draft !== null));
  } catch {
    return [];
  }
}

function persistDrafts(storage: DraftMemoryStorage, drafts: DraftMemoryEntry[]): boolean {
  return safeSet(storage, DRAFT_HISTORY_KEY, JSON.stringify(deduplicateAndLimit(drafts)));
}

/**
 * Moves the single-token legacy memory into the current list. The old key is
 * only removed after the new list is safely persisted.
 */
export function migrateLegacyDraft(
  storage?: DraftMemoryStorage | null,
  defaults: LegacyDraftDefaults = {},
): DraftMemoryEntry | null {
  const target = resolveStorage(storage);
  if (!target) return null;

  const legacyValue = safeGet(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY);
  if (legacyValue === null) return null;

  const token = normalizeToken(legacyValue);
  if (!token) {
    safeRemove(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY);
    return null;
  }

  const drafts = readStoredDrafts(target);
  const existing = drafts.find((draft) => draft.token === token);
  if (existing) {
    safeRemove(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY);
    return existing;
  }

  const migrated = normalizeInput(
    {
      token,
      title: defaults.title ?? DEFAULT_DRAFT_TITLE,
      templateSlug: defaults.templateSlug ?? "",
      updatedAt: defaults.updatedAt,
      lastStep: defaults.lastStep ?? 0,
    },
    new Date(),
  );
  if (!migrated || !persistDrafts(target, [migrated, ...drafts])) return null;

  safeRemove(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY);
  return migrated;
}

export function listDraftMemories(storage?: DraftMemoryStorage | null): DraftMemoryEntry[] {
  const target = resolveStorage(storage);
  if (!target) return [];

  migrateLegacyDraft(target);
  return readStoredDrafts(target);
}

export function getDraft(
  token: string,
  storage?: DraftMemoryStorage | null,
): DraftMemoryEntry | null {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) return null;
  return listDraftMemories(storage).find((draft) => draft.token === normalizedToken) ?? null;
}

export function upsertDraftMemory(
  storage: DraftMemoryStorage | null | undefined,
  input: DraftMemoryInput,
): DraftMemoryEntry | null {
  const target = resolveStorage(storage);
  if (!target) return null;

  migrateLegacyDraft(target);
  const normalized = normalizeInput(input, new Date());
  if (!normalized) return null;

  const drafts = readStoredDrafts(target).filter((draft) => draft.token !== normalized.token);
  return persistDrafts(target, [normalized, ...drafts]) ? normalized : null;
}

export function removeDraftMemory(
  storage: DraftMemoryStorage | null | undefined,
  token: string,
): boolean {
  const target = resolveStorage(storage);
  const normalizedToken = normalizeToken(token);
  if (!target || !normalizedToken) return false;

  const legacyToken = normalizeToken(safeGet(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY));
  const drafts = readStoredDrafts(target);
  const stored = drafts.some((draft) => draft.token === normalizedToken);

  if (stored) {
    const remaining = drafts.filter((draft) => draft.token !== normalizedToken);
    if (!persistDrafts(target, remaining)) return false;
  }

  const legacy = legacyToken === normalizedToken;
  if (legacy && !safeRemove(target, LEGACY_DRAFT_TOKEN_STORAGE_KEY)) return false;
  return stored || legacy;
}

export function checkoutStorageKey(token: string): string {
  const normalizedToken = normalizeToken(token);
  if (!normalizedToken) throw new TypeError("Token de rascunho inválido");
  return `${CHECKOUT_STORAGE_KEY_PREFIX}:${normalizedToken}`;
}
