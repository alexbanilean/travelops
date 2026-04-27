export type AgentLogScope =
  | "planning"
  | "finance"
  | "planning-api"
  | "finance-api"
  | "planning-stream"
  | "finance-stream"
  | "budget-copilot"
  | "budget-copilot-api"
  | "budget-copilot-stream"
  | "event-assistant"
  | "event-assistant-api"
  | "event-assistant-stream"
  | "gemini-rate-limit";

/**
 * ISO timestamp + fixed prefix so dev server logs are easy to grep:
 *   rg travelops:planning
 */
export function createAgentLogger(scope: AgentLogScope) {
  const prefix = `[travelops:${scope}]`;

  function line(msg: string) {
    return `${new Date().toISOString()} ${prefix} ${msg}`;
  }

  return {
    info(msg: string, data?: Record<string, unknown>) {
      if (data && Object.keys(data).length > 0) {
        console.info(line(msg), data);
      } else {
        console.info(line(msg));
      }
    },
    warn(msg: string, data?: Record<string, unknown>) {
      if (data && Object.keys(data).length > 0) {
        console.warn(line(msg), data);
      } else {
        console.warn(line(msg));
      }
    },
  };
}
