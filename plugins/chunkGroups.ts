import type { Rolldown } from "vite";

/**
 * Matches modules of the given top-level packages (regex source fragments),
 * but not copies nested in another package's node_modules.
 */
export function nodeModules(...packages: string[]) {
  return new RegExp(
    `^(?!.*node_modules.*node_modules).*node_modules[\\\\/](?:${packages.join("|")})[\\\\/]`,
  );
}

const isAppModule = (id: string) => !id.includes("node_modules");

/**
 * Manual chunk groups. Without them Rolldown emits one chunk per distinct set
 * of importing routes, which with ~200 lazy routes means hundreds of tiny
 * chunks, and the entry has to preload ~90 of them.
 *
 * - Everything the entry imports statically (`$initial`) goes into a handful
 *   of chunks: react, i18n and tanstack-query (long-term cacheable vendor
 *   chunks), the remaining initial vendor code, initial app code that lazy
 *   routes also import (`app`), and the rest of the initial app code, which
 *   stays in the entry chunk. Keeping `app` out of the entry chunk matters
 *   for caching: every route chunk imports from it, so if it changed on
 *   every edit to App.tsx or the login page, so would every route chunk.
 * - Icons, date libraries and API route definitions are tiny modules shared
 *   by many routes; each family goes into a single chunk instead of one chunk
 *   per combination of routes.
 * - Everything else keeps Rolldown's default per-route splitting. Avoid
 *   `entriesAware` merging here: it merges small groups into arbitrary
 *   neighbours and has pulled 200+ KB of unrelated code into AppRouter.
 */
export const chunkGroups: Rolldown.CodeSplittingGroup[] = [
  {
    name: "react",
    test: nodeModules("react", "react-dom", "scheduler"),
    priority: 50,
  },
  {
    name: "i18n",
    test: nodeModules(
      "i18next(?:-[^\\\\/]+)?",
      "react-i18next",
      "html-parse-stringify",
      "void-elements",
    ),
    tags: ["$initial"],
    priority: 40,
  },
  {
    name: "query",
    test: nodeModules("@tanstack[\\\\/][^\\\\/]+"),
    tags: ["$initial"],
    priority: 40,
  },
  {
    name: "vendor",
    test: /node_modules[\\/]/,
    tags: ["$initial"],
    priority: 30,
  },
  {
    name: "app",
    test: isAppModule,
    tags: ["$initial"],
    minShareCount: 2,
    priority: 20,
  },
  {
    name: "icons",
    test: nodeModules("lucide-react"),
    priority: 10,
  },
  {
    name: "date",
    test: nodeModules("date-fns", "dayjs"),
    priority: 10,
  },
  {
    name: "api",
    test: /[\\/]src[\\/]types[\\/].+Api\.tsx?$/,
    priority: 10,
  },
];
