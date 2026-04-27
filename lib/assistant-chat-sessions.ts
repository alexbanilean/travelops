import type { PersistedChatTurn } from "@/lib/assistant-chat-types";

const SESSIONS_KEY_V1 = (eventId: string) => `travelops:assistant-sessions:v1:${eventId}`;
const LEGACY_THREAD_KEY = (eventId: string) => `travelops:assistant-thread:${eventId}`;

/** Max characters shown in the session picker (never show raw ids). */
const MAX_LABEL_LEN = 34;

export type AssistantChatSession = {
  id: string;
  /** Full title for tooltips / future use (may include longer first-line text). */
  title: string;
  /** Short, scannable label for dropdowns and the trigger. */
  label: string;
  updatedAt: number;
  messages: PersistedChatTurn[];
};

export type AssistantSessionsStateV1 = {
  activeSessionId: string;
  sessions: AssistantChatSession[];
};

const MAX_SESSIONS = 20;
export const MAX_MESSAGES_PER_SESSION = 40;

/** Raw session row from JSON (may omit `label`; normalized later). */
type SessionParseRow = {
  id: string;
  title: string;
  updatedAt: number;
  messages: PersistedChatTurn[];
};

function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultSessionTitle(): string {
  return `Chat · ${new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function defaultSessionLabel(): string {
  return `New · ${new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

/** First user-visible line (strip merged snapshot block if present). */
function firstUserPreview(messages: PersistedChatTurn[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "";
  const beforeSnapshot = firstUser.content.split(/\n\n---\n\n/)[0] ?? firstUser.content;
  return beforeSnapshot.replace(/\s+/g, " ").trim();
}

export function titleFromMessages(messages: PersistedChatTurn[]): string {
  const preview = firstUserPreview(messages);
  if (preview) {
    return preview.length > 56 ? `${preview.slice(0, 54)}…` : preview;
  }
  return defaultSessionTitle();
}

export function formatShortSessionLabel(title: string, messages: PersistedChatTurn[]): string {
  const preview = firstUserPreview(messages);
  const base = (preview || title).replace(/\s+/g, " ").trim();
  if (!base) return defaultSessionLabel();
  if (base.length <= MAX_LABEL_LEN) return base;
  return `${base.slice(0, MAX_LABEL_LEN - 1)}…`;
}

function ensureSessionShape(s: SessionParseRow): AssistantChatSession {
  const title = typeof s.title === "string" ? s.title : defaultSessionTitle();
  return {
    id: s.id,
    title,
    label: formatShortSessionLabel(title, s.messages),
    updatedAt: s.updatedAt,
    messages: s.messages,
  };
}

function parseLegacyThreadJson(raw: string): PersistedChatTurn[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is PersistedChatTurn =>
          row != null &&
          typeof row === "object" &&
          (row as PersistedChatTurn).role !== undefined &&
          ((row as PersistedChatTurn).role === "user" ||
            (row as PersistedChatTurn).role === "assistant") &&
          typeof (row as PersistedChatTurn).content === "string"
      )
      .slice(-MAX_MESSAGES_PER_SESSION);
  } catch {
    return [];
  }
}

function normalizeState(raw: AssistantSessionsStateV1): AssistantSessionsStateV1 {
  const sessions = (raw.sessions ?? [])
    .filter(
      (s) =>
        s != null &&
        typeof s === "object" &&
        typeof (s as SessionParseRow).id === "string" &&
        typeof (s as SessionParseRow).title === "string" &&
        typeof (s as SessionParseRow).updatedAt === "number" &&
        Array.isArray((s as SessionParseRow).messages)
    )
    .map((s) => {
      const row = s as SessionParseRow;
      return {
        ...row,
        messages: row.messages
          .filter(
            (m): m is PersistedChatTurn =>
              m != null &&
              typeof m === "object" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-MAX_MESSAGES_PER_SESSION),
      };
    })
    .map((s) => ensureSessionShape(s))
    .slice(-MAX_SESSIONS);

  if (sessions.length === 0) {
    const id = newSessionId();
    const title = defaultSessionTitle();
    return {
      activeSessionId: id,
      sessions: [
        {
          id,
          title,
          label: defaultSessionLabel(),
          updatedAt: Date.now(),
          messages: [],
        },
      ],
    };
  }

  const activeOk = sessions.some((s) => s.id === raw.activeSessionId);
  if (activeOk) {
    return { activeSessionId: raw.activeSessionId, sessions };
  }
  const newest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0]!;
  return { activeSessionId: newest.id, sessions };
}

/**
 * Loads persisted sessions. On the server returns an empty shell — never reads
 * `localStorage` or generates ids (avoids SSR/client hydration mismatches).
 */
export function loadSessionsState(eventId: string): AssistantSessionsStateV1 {
  if (typeof window === "undefined") {
    return { activeSessionId: "", sessions: [] };
  }
  try {
    const rawV1 = localStorage.getItem(SESSIONS_KEY_V1(eventId));
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as AssistantSessionsStateV1;
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.sessions)) {
        return normalizeState(parsed);
      }
    }

    const legacyKey = LEGACY_THREAD_KEY(eventId);
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const messages = parseLegacyThreadJson(legacyRaw);
      const id = newSessionId();
      const title = titleFromMessages(messages);
      const state: AssistantSessionsStateV1 = {
        activeSessionId: id,
        sessions: [
          {
            id,
            title,
            label: formatShortSessionLabel(title, messages),
            updatedAt: Date.now(),
            messages,
          },
        ],
      };
      persistSessionsState(eventId, state);
      localStorage.removeItem(legacyKey);
      return state;
    }
  } catch {
    /* ignore */
  }

  const id = newSessionId();
  const title = defaultSessionTitle();
  return {
    activeSessionId: id,
    sessions: [
      {
        id,
        title,
        label: defaultSessionLabel(),
        updatedAt: Date.now(),
        messages: [],
      },
    ],
  };
}

export function persistSessionsState(eventId: string, state: AssistantSessionsStateV1): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = normalizeState(state);
    localStorage.setItem(SESSIONS_KEY_V1(eventId), JSON.stringify(normalized));
  } catch {
    /* quota / private mode */
  }
}

export function updateActiveSessionMessages(
  state: AssistantSessionsStateV1,
  messages: PersistedChatTurn[]
): AssistantSessionsStateV1 {
  const clipped = messages.slice(-MAX_MESSAGES_PER_SESSION);
  const sessions = state.sessions.map((s) => {
    if (s.id !== state.activeSessionId) return s;
    const title =
      clipped.length > 0 && (s.title.startsWith("Chat ·") || s.title === "Current chat")
        ? titleFromMessages(clipped)
        : s.title;
    const label = formatShortSessionLabel(title, clipped);
    return { ...s, messages: clipped, title, label, updatedAt: Date.now() };
  });
  return { ...state, sessions };
}

/** Archive current transcript into the list and start a fresh empty session. */
export function startNewChatSession(eventId: string, state: AssistantSessionsStateV1): AssistantSessionsStateV1 {
  const normalized = normalizeState(state);
  const id = newSessionId();
  const title = defaultSessionTitle();
  const label = defaultSessionLabel();
  const next: AssistantSessionsStateV1 = {
    activeSessionId: id,
    sessions: [
      ...normalized.sessions.map((s) =>
        s.id === normalized.activeSessionId
          ? { ...s, messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION), updatedAt: Date.now() }
          : s
      ),
      { id, title, label, updatedAt: Date.now(), messages: [] },
    ].slice(-MAX_SESSIONS),
  };
  persistSessionsState(eventId, next);
  return normalizeState(next);
}

export function switchActiveSession(
  eventId: string,
  state: AssistantSessionsStateV1,
  sessionId: string
): AssistantSessionsStateV1 | null {
  if (!state.sessions.some((s) => s.id === sessionId)) return null;
  const next = { ...state, activeSessionId: sessionId };
  persistSessionsState(eventId, next);
  return normalizeState(next);
}

export function sortedSessions(state: AssistantSessionsStateV1): AssistantChatSession[] {
  return [...state.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}
