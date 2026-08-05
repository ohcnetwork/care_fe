import type { FillAssistantHandle } from "./types";

/**
 * Playwright drivability: exposes mounted fill-session handles on `window` in
 * dev or localhost contexts. The localhost gate is needed because Playwright
 * runs against a production build where `import.meta.env.DEV` is false.
 * `import.meta.env` is read defensively for non-Vite test imports.
 */
function testBridgeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const env = (import.meta as { env?: { DEV?: boolean } }).env;
  if (env?.DEV) return true;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export interface FillAssistantTestBridge {
  /** Every currently mounted fill session's handle, keyed by a random id
   *  minted at mount. A MAP, deliberately — never a single slot: two fill
   *  sessions mounted at once must both be reachable, independently, not
   *  have the second overwrite the first. */
  sessions: Map<string, FillAssistantHandle>;
  list(): Array<{ sessionId: string; handle: FillAssistantHandle }>;
}

declare global {
  interface Window {
    __CARE_FILL_ASSISTANT__?: FillAssistantTestBridge;
  }
}

function bridge(): FillAssistantTestBridge {
  if (!window.__CARE_FILL_ASSISTANT__) {
    const sessions = new Map<string, FillAssistantHandle>();
    window.__CARE_FILL_ASSISTANT__ = {
      sessions,
      list: () =>
        Array.from(sessions.entries()).map(([sessionId, handle]) => ({
          sessionId,
          handle,
        })),
    };
  }
  return window.__CARE_FILL_ASSISTANT__;
}

/**
 * Registers one session's handle on `window` for the lifetime of its
 * mount. A no-op (with a no-op cleanup) outside the test/dev gate — the
 * bridge object itself never exists in a real deployment, so there is
 * nothing on `window` for a production page to leak.
 */
export function registerTestBridgeSession(
  handle: FillAssistantHandle,
): () => void {
  if (!testBridgeEnabled()) return () => {};
  const sessionId = crypto.randomUUID();
  bridge().sessions.set(sessionId, handle);
  return () => {
    // Re-reads `window.__CARE_FILL_ASSISTANT__` rather than closing over
    // the earlier `bridge()` call's object: harmless either way today
    // (the bridge object is created once and never replaced), but keeps
    // this cleanup correct even if that ever changes.
    window.__CARE_FILL_ASSISTANT__?.sessions.delete(sessionId);
  };
}
