import type { FillAssistantHandle } from "./types";

/**
 * Drivability for Playwright (design doc §6/§10: "drive the window-exposed
 * handle like a voice assistant"). Gated to test/dev contexts only — a
 * real deployment never serves from `localhost`, and this repo's
 * Playwright suite always does: `playwright.config.ts`'s `webServer` runs
 * `npm run preview`, a genuine PRODUCTION build (`import.meta.env.DEV` is
 * `false` there, baked in at build time — see this repo's CLAUDE.md), at
 * `http://localhost:4000`. Gating on `DEV` alone would never unlock for
 * Playwright at all, so the hostname check is the real gate for that path;
 * `DEV` stays for `npm run dev`. Judgment call, documented here so a
 * reviewer can tighten it (e.g. a dedicated build-time flag) if this
 * repo's Playwright serving setup ever changes.
 *
 * `import.meta.env` itself (not just `.DEV`) is read defensively: outside
 * Vite — a jsdom `node --test` harness importing this module transitively
 * (`useFillAssistantSession.ts` -> here) — `import.meta.env` is
 * `undefined` (the same hazard `structured/types/files/model.ts` documents
 * for `@careConfig`), and `import.meta.env.DEV` would throw instead of
 * just reading `false`.
 */
function testBridgeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const env = (import.meta as { env?: { DEV?: boolean } }).env;
  if (env?.DEV) return true;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export interface FillAssistantTestBridge {
  /** Every currently mounted fill session's handle, keyed by a random id
   *  minted at mount. A MAP, deliberately — never a single slot. Two fill
   *  sessions mounted at once (the defect this whole batch replaces the
   *  old module-global action registry to fix) must both be reachable,
   *  independently, not have the second overwrite the first. */
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
