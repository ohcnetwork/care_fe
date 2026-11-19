# raviger to TanStack Router codemod

This codemod converts two kinds of call sites from raviger to TanStack Router.

| Before                                                    | After                                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `<Link href={`/facility/${id}/settings`} />`              | `<Link to="/facility/$facilityId/settings" params={{ facilityId: id }} />`                      |
| `navigate(`/facility/${id}/settings`, { replace: true })` | `navigate({ to: "/facility/$facilityId/settings", params: { facilityId: id }, replace: true })` |

`Link` comes from `@tanstack/react-router`. `navigate` comes from the typed
helper `@/lib/router/navigate` (`src/lib/router/navigate.ts`). TypeScript
checks `to` and `params` against `src/routeTree.gen.ts`.

The codemod changes a site only when the change is safe. It leaves every
other site on the raviger shim and lists it with a reason code.

## When to run it

Run it after all route areas are in `src/routes/`. A link can have a type only
when its target route exists in `src/routeTree.gen.ts`. A target that exists
only in the `/_app/_legacy` subtree, or only as a splat route (`/$`), stays on
the shim.

Run it at a time when no route area has a `useRoutes` table with a `basePath`.
A raviger `Link` that has a leading `/` adds the nested base path to its href
(unless `basePath="/"` is set). The codemod cannot see this base path. It
reads each `/…` href as an absolute URL.

## Commands

Run all commands from the repository root. They use `npx jscodeshift@17`.
Do not add jscodeshift to `package.json`.

```bash
# 1. Test the transform on the fixtures.
node scripts/codemods/test.mjs

# 2. Dry run. It writes a JSON summary and no source file.
node scripts/codemods/dry-run.mjs --out=codemod-dryrun.json

# 3. Apply to all of src/.
npx --yes jscodeshift@17 --silent --cpus=3 \
  --transform=scripts/codemods/raviger-to-tanstack.js \
  --parser=tsx --extensions=ts,tsx \
  --ignore-pattern='**/routeTree.gen.ts' \
  --report=codemod-report.jsonl \
  src

# 4. Format the changed files, then check the types.
git diff --name-only | xargs npx prettier --write
npx tsc --noEmit
```

To limit the run to one area, pass a path and `--targetPrefix`. The prefix
limits the targets that the codemod converts:

```bash
npx --yes jscodeshift@17 --silent --cpus=3 \
  --transform=scripts/codemods/raviger-to-tanstack.js \
  --parser=tsx --extensions=ts,tsx \
  --ignore-pattern='**/billing/**' \
  --targetPrefix='/facility/$facilityId/settings' \
  --report=codemod-report.jsonl \
  src/pages/Facility/settings
```

## Options

| Option            | Meaning                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `--routeTree`     | Path of the route tree. Default: `src/routeTree.gen.ts`.                 |
| `--targetPrefix`  | Comma-separated route prefixes. The codemod converts only these targets. |
| `--report`        | File that gets one JSON line for each site (converted or skipped).       |
| `--literalParams` | Set to `false` to stop a plain static segment from filling a `$param`.   |
| `--typecheck`     | Set to `false` to turn the type check off (see below).                   |
| `--tsconfig`      | The tsconfig for the type check. Default: `tsconfig.json`.               |

## What the codemod converts

An `href` or a `navigate` URL is convertible when all of these are true:

- It is a string literal, or a template literal.
- It starts with `/`.
- Each static segment equals a static route segment.
- Each `${expr}` fills a whole segment, and that segment is a `$param`.
- Exactly one route that is not legacy and not a splat matches.
- A query string, if present, is plain literal text (`?a=b&c=d`). It becomes
  `search={{ a: "b", c: "d" }}`.

A plain static segment can also fill a `$param` segment when no other route
matches (`/patient/${id}/updates` fills `$tab` with `"updates"`). The URL is
the same text, so the router matches the same page. The report marks these
sites with `literalParams`.

`<Link basePath="/">` loses the `basePath` prop. A TanStack `Link` never uses a
base path.

## Type check

A TanStack `params` value must be a `string`. The old template literal
accepted any value. The codemod builds a TypeScript program from
`tsconfig.json`, once for each worker. It converts a site only when each
`${expr}` has a type that is `string`, a string literal, or `any`. A value
such as `string | undefined` or `number` keeps the site on the shim. The
report shows the type in `detail`. A narrowed value (`if (slug) …`) passes.

The check adds about 10 seconds to a run on `src/`. Use `--typecheck=false` to
turn it off. Then run `npx tsc --noEmit` and fix the errors by hand.

## What the codemod skips

| Reason                       | Meaning                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `relative-url`               | The URL has no leading `/`. It depends on the shim base path.             |
| `external-url`               | The URL has a scheme (`https:`, `tel:`) or starts with `//`.              |
| `non-literal-url`            | The URL is a variable, a call, a concatenation, or a number.              |
| `dynamic-prefix`             | A template starts with `${…}`.                                            |
| `partial-segment-expression` | `${…}` does not fill a whole segment (`${id}.json`).                      |
| `query-with-expression`      | The query string has `${…}`.                                              |
| `query-not-trivial`          | The query string is not plain `a=b` pairs.                                |
| `hash-in-url`                | The URL has a `#`.                                                        |
| `trailing-slash`             | The path ends with `/`.                                                   |
| `empty-segment`              | The path has `//`.                                                        |
| `no-matching-route`          | No route that is not legacy and not a splat matches.                      |
| `ambiguous-route`            | More than one route matches.                                              |
| `outside-target-scope`       | The target is outside `--targetPrefix`.                                   |
| `active-link`                | The site uses `ActiveLink`.                                               |
| `spread-props`               | The `Link` has `{...props}`.                                              |
| `exact-prop`                 | The `Link` has `exact`.                                                   |
| `active-class-prop`          | The `Link` has `activeClass` or `exactActiveClass`.                       |
| `base-path-prop`             | The `Link` has a `basePath` other than `"/"`.                             |
| `query-prop`, `state-prop`   | The `Link` has `query` or `state`.                                        |
| `disabled-prop`              | The `Link` has `disabled`. A TanStack `Link` treats it differently.       |
| `param-type-not-string`      | A `${expr}` is not typed as `string` (for example `string \| undefined`). |
| `no-href`                    | The `Link` has no `href`.                                                 |
| `unsupported-options`        | `navigate` has options other than `{ replace: true \| false }`.           |
| `unsupported-arguments`      | `navigate` has no argument, or more than two.                             |
| `file-uses-nested-router`    | The file imports `useRoutes` or `RouterProvider` from raviger.            |
| `unsupported-import-style`   | The file has a default or namespace import from raviger.                  |
| `name-conflict`              | The file already uses the names that the codemod needs.                   |

## Names in files that keep some raviger sites

A file can have sites that the codemod converts and sites that it skips. Then
the converted sites use `Link` and `navigate`. The codemod renames the
remaining raviger names to `RavigerLink` and `ravigerNavigate`. Search for
these names to find the sites to convert by hand.

## Files

- `raviger-to-tanstack.js`: the jscodeshift transform.
- `route-table.js`: reads the route tree and matches a URL to a route.
- `type-check.js`: asks the TypeScript checker for the type of each `${expr}`.
- `test.mjs`: runs the fixtures in `__testfixtures__/`. Use `--update` to
  write the expected files.
- `dry-run.mjs`: dry run and JSON summary.
- `__testfixtures__/`: `<name>.input.txt`, `<name>.output.txt`,
  `<name>.report.txt`, and an optional `<name>.options.json`. The fixtures use
  a `.txt` extension so that the linter and the formatter ignore them. The
  expected output is the raw transform output. The formatter is not part of
  the test.
