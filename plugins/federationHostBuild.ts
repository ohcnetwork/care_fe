import type { Plugin } from "vite";

type TransformFn = Extract<
  NonNullable<Plugin["transform"]>,
  (...args: never[]) => unknown
>;
type OutputOptionsFn = Extract<
  NonNullable<Plugin["outputOptions"]>,
  (...args: never[]) => unknown
>;

/**
 * Wraps the production @originjs/vite-plugin-federation plugin of a host
 * (an app with `remotes` and no `exposes`) so that it stops rewriting the
 * host's own imports of shared packages.
 *
 * Unwrapped, the plugin turns every `import React from "react"` in host code
 * into `const React = await importShared("react")`. That top-level await
 * makes Rolldown skip its chunk optimisations, and since the shared packages
 * are then fetched by a dynamic import at run time, they cannot be preloaded
 * and load as a waterfall.
 *
 * The host does not need the rewrite. Remotes get shared packages from the
 * share scope the host hands to `remote.init()` (built in the
 * `__federation__` virtual module); each entry there dynamically imports the
 * emitted `__federation_shared_<name>` chunk. Those chunks are part of the
 * same module graph as the host's static imports, so the browser instantiates
 * each package once and remotes get the host's React, QueryClient, i18next
 * instance, etc.
 *
 * The wrapped plugin still emits the `__federation_shared_*` chunks and still
 * transforms its own virtual modules and any module importing from one of
 * `remoteNames` (`<remote>/...`).
 */
export function federationHostBuild(
  federationPlugin: Plugin,
  remoteNames: string[],
): Plugin {
  const transform = federationPlugin.transform as TransformFn | undefined;
  const outputOptions = federationPlugin.outputOptions as
    OutputOptionsFn | undefined;
  if (typeof transform !== "function") {
    throw new Error("federationHostBuild: federation plugin has no transform");
  }
  const remoteImport = remoteNames.length
    ? new RegExp(
        `["'](?:${remoteNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})/`,
      )
    : null;
  let sharedChunksEmitted = false;

  return {
    ...federationPlugin,
    transform(code, id, options) {
      // The plugin emits the `__federation_shared_*` chunks on its first
      // transform call; an empty module triggers that without rewriting
      // anything.
      if (!sharedChunksEmitted) {
        sharedChunksEmitted = true;
        transform.call(this, "", "\0federation-host-build", options);
      }

      if (id.includes("__federation") || remoteImport?.test(code)) {
        return transform.call(this, code, id, options);
      }

      return null;
    },
    outputOptions(options) {
      const result = outputOptions?.call(this, options) ?? options;
      // The plugin always installs a `manualChunks` function, which only
      // places the `dependencies` of shared packages (not used by a host).
      // It conflicts with `codeSplitting` groups, so drop it when those are
      // configured.
      if (result.codeSplitting) {
        delete (result as { manualChunks?: unknown }).manualChunks;
      }
      return result;
    },
  };
}
