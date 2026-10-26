import type { Plugin } from "vite";

export function manualChunks(id: string): string | undefined {
  const path = id.replaceAll("\\", "/");

  // Leave virtual modules and federation's shared dependencies to federation.
  if (path.startsWith("\0") || !path.includes("/node_modules/")) {
    return;
  }

  const groups = [
    ["charts", ["recharts", "recharts-scale"]],
    ["flow", ["reactflow", "@reactflow/"]],
    ["pdf-viewer", ["react-pdf", "pdfjs-dist"]],
    ["pdf-export", ["jspdf"]],
    ["fhirpath", ["fhirpath"]],
    ["motion", ["framer-motion", "motion-dom", "motion-utils"]],
  ] as const;

  for (const [name, packages] of groups) {
    if (
      packages.some((pkg) =>
        path.includes(`/node_modules/${pkg.replace(/\/$/, "")}/`),
      )
    ) {
      return `vendor-${name}`;
    }
  }
}

export function explicitManualChunks(): Plugin {
  return {
    name: "explicit-manual-chunks",
    outputOptions: {
      order: "post",
      handler(options) {
        const manualChunks = options.manualChunks;
        if (typeof manualChunks !== "function") return;

        // Preserve federation's wrapped classifier, but prevent Rolldown from
        // absorbing shared helpers (React, clsx, preload) into heavy vendors.
        options.codeSplitting = {
          groups: [
            {
              name: (id, context) =>
                manualChunks(id, {
                  getModuleInfo: (moduleId) => context.getModuleInfo(moduleId),
                }),
              includeDependenciesRecursively: false,
            },
          ],
        };
        delete options.manualChunks;
        return options;
      },
    },
  };
}
