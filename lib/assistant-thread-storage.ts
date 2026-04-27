import type { PersistedChatTurn } from "@/lib/assistant-chat-types";
import {
  loadSessionsState,
  persistSessionsState,
  sortedSessions,
  startNewChatSession,
  switchActiveSession,
  updateActiveSessionMessages,
  type AssistantChatSession,
  type AssistantSessionsStateV1,
} from "@/lib/assistant-chat-sessions";

export type { PersistedChatTurn, AssistantChatSession, AssistantSessionsStateV1 };

export function loadAssistantThread(eventId: string): PersistedChatTurn[] {
  const state = loadSessionsState(eventId);
  const s = state.sessions.find((x) => x.id === state.activeSessionId);
  return s?.messages ?? [];
}

export function saveAssistantThread(eventId: string, messages: PersistedChatTurn[]): void {
  const state = loadSessionsState(eventId);
  persistSessionsState(eventId, updateActiveSessionMessages(state, messages));
}

export function loadAssistantSessionsState(eventId: string): AssistantSessionsStateV1 {
  return loadSessionsState(eventId);
}

export function listAssistantSessionsSorted(eventId: string): AssistantChatSession[] {
  return sortedSessions(loadSessionsState(eventId));
}

export function assistantNewSession(eventId: string): AssistantSessionsStateV1 {
  return startNewChatSession(eventId, loadSessionsState(eventId));
}

export function assistantSelectSession(
  eventId: string,
  sessionId: string
): AssistantSessionsStateV1 | null {
  return switchActiveSession(eventId, loadSessionsState(eventId), sessionId);
}
