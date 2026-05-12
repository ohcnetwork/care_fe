/**
 * Bridge that exposes the component-override registry to federated plugs.
 *
 * Plugs cannot import host modules directly, so we hang a tiny surface off
 * `window.__careOverrides`. The host's `addOverride` function is forwarded
 * verbatim — see `register()` / `addOverride()` in `@/lib/override` for the
 * full API.
 */
import { addOverride } from "./registry";

declare global {
  interface Window {
    __careOverrides?: {
      addComponent: typeof addOverride;
    };
  }
}

if (typeof window !== "undefined") {
  window.__careOverrides = {
    addComponent: addOverride,
  };
}
