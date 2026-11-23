/**
 * Plug → host bridge for the component-override registry.
 *
 * Federated plug bundles run in their own module graph and cannot import
 * from `@/lib/override` directly. To let them register overrides, we expose
 * a minimal surface on `window.__careOverrides`:
 *
 *   window.__careOverrides.addComponent(key, { component, condition?, … })
 *
 * Imported once as a side effect from `./index.ts` so the global is in
 * place before any plug manifest evaluates.
 */
import { addOverride } from "./registry";

declare global {
  interface Window {
    __careOverrides?: {
      /** Register a component override. Mirrors `addOverride` from the registry. */
      addComponent: typeof addOverride;
    };
  }
}

if (typeof window !== "undefined") {
  window.__careOverrides = {
    addComponent: addOverride,
  };
}
