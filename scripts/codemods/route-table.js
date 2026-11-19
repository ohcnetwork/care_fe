"use strict";

/**
 * Route table for the raviger codemod.
 *
 * The table comes from the generated route tree (`src/routeTree.gen.ts`).
 * `FileRoutesByTo` gives the valid `to` values. `FileRoutesById` tells which
 * routes are legacy routes (the `/_app/_legacy` subtree) and which are splat
 * routes (`/$`). A link can only be typed when its target is a route that is
 * not legacy and not a splat.
 */

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_ROUTE_TREE = "src/routeTree.gen.ts";
const LEGACY_PREFIX = "/_app/_legacy";
const PLAIN_VALUE = /^[A-Za-z0-9_.~-]+$/;

function readInterfaceKeys(source, name) {
  const block = source.match(
    new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`),
  );
  if (!block) {
    throw new Error(`The route tree has no "${name}" interface.`);
  }
  return [...block[1].matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]);
}

/** Turns a route id into the URL pattern. Pathless segments (`_app`) drop out. */
function idToPattern(id) {
  if (id === "/") return "/";
  const segments = id.split("/").filter(Boolean);
  const visible = segments.filter((segment) => !segment.startsWith("_"));
  if (visible.length === 0) return null;
  return "/" + visible.join("/");
}

function createRoute(pattern, legacy) {
  const segments = pattern === "/" ? [] : pattern.slice(1).split("/");
  return {
    to: pattern,
    segments,
    legacy,
    splat: segments[segments.length - 1] === "$",
  };
}

function loadRouteTable(routeTreePath) {
  const file = path.resolve(process.cwd(), routeTreePath || DEFAULT_ROUTE_TREE);
  const source = fs.readFileSync(file, "utf8");
  const validTo = new Set(readInterfaceKeys(source, "FileRoutesByTo"));
  const byPattern = new Map();

  for (const id of readInterfaceKeys(source, "FileRoutesById")) {
    const pattern = idToPattern(id);
    if (pattern === null) continue;
    const legacy = id === LEGACY_PREFIX || id.startsWith(LEGACY_PREFIX + "/");
    // A pattern can have a layout route and an index route. One route that is
    // not legacy is enough to make the pattern a valid target.
    const known = byPattern.get(pattern);
    if (!known || (known.legacy && !legacy)) {
      byPattern.set(pattern, createRoute(pattern, legacy));
    }
  }

  const missing = [...validTo].filter((to) => !byPattern.has(to));
  if (missing.length > 0) {
    throw new Error(
      `The route ids do not explain these "to" values: ${missing.join(", ")}`,
    );
  }

  return {
    file,
    routes: [...byPattern.values()].filter((route) => validTo.has(route.to)),
  };
}

function isParamSegment(routeSegment) {
  return routeSegment.startsWith("$") && routeSegment !== "$";
}

function matchesFully(route, hrefSegments, allowLiteralParams) {
  if (route.segments.length !== hrefSegments.length) return false;
  return route.segments.every((routeSegment, position) => {
    const hrefSegment = hrefSegments[position];
    if (isParamSegment(routeSegment)) {
      return (
        hrefSegment.kind === "expr" ||
        (allowLiteralParams && PLAIN_VALUE.test(hrefSegment.value))
      );
    }
    return hrefSegment.kind === "static" && hrefSegment.value === routeSegment;
  });
}

function matchesSplat(route, hrefSegments) {
  const prefix = route.segments.slice(0, -1);
  if (hrefSegments.length < prefix.length) return false;
  return prefix.every((routeSegment, position) => {
    const hrefSegment = hrefSegments[position];
    if (isParamSegment(routeSegment)) return hrefSegment.kind === "expr";
    return hrefSegment.kind === "static" && hrefSegment.value === routeSegment;
  });
}

/** Static segments beat param segments, from left to right (as the router does). */
function compareSpecificity(left, right) {
  for (let position = 0; position < left.segments.length; position += 1) {
    const leftStatic = !isParamSegment(left.segments[position]);
    const rightStatic = !isParamSegment(right.segments[position]);
    if (leftStatic !== rightStatic) return leftStatic ? -1 : 1;
  }
  return 0;
}

function toParams(route, hrefSegments) {
  return route.segments.flatMap((routeSegment, position) => {
    if (!isParamSegment(routeSegment)) return [];
    const hrefSegment = hrefSegments[position];
    const name = routeSegment.slice(1);
    return hrefSegment.kind === "expr"
      ? [{ name, index: hrefSegment.index }]
      : [{ name, literal: hrefSegment.value }];
  });
}

/**
 * Finds the one route that an href maps onto.
 *
 * A static href segment must equal a static route segment. An expression
 * segment (`{ kind: "expr", index }`) must sit on a `$param` segment.
 *
 * With `allowLiteralParams`, a plain static segment can also fill a `$param`
 * segment (`/patient/${id}/updates` fills `$tab` with "updates"). This is the
 * second choice. The URL that the router builds is the same text.
 *
 * Returns one of:
 * - `{ status: "match", route, params: [{ name, index } | { name, literal }] }`
 * - `{ status: "ambiguous", candidates: string[] }`
 * - `{ status: "none", matchedOnly: "legacy" | "splat" | "nothing" }`
 */
function matchHref(table, hrefSegments, allowLiteralParams = false) {
  const usable = table.routes.filter((route) => !route.legacy && !route.splat);
  let candidates = usable.filter((route) =>
    matchesFully(route, hrefSegments, false),
  );
  if (candidates.length === 0 && allowLiteralParams) {
    candidates = usable.filter((route) =>
      matchesFully(route, hrefSegments, true),
    );
    candidates.sort(compareSpecificity);
    candidates = candidates.filter(
      (route) => compareSpecificity(route, candidates[0]) === 0,
    );
  }
  if (candidates.length === 1) {
    const route = candidates[0];
    return { status: "match", route, params: toParams(route, hrefSegments) };
  }
  if (candidates.length > 1) {
    return {
      status: "ambiguous",
      candidates: candidates.map((route) => route.to),
    };
  }
  const legacy = table.routes.some(
    (route) =>
      route.legacy &&
      !route.splat &&
      matchesFully(route, hrefSegments, allowLiteralParams),
  );
  if (legacy) return { status: "none", matchedOnly: "legacy" };
  const splat = table.routes.some(
    (route) => route.splat && matchesSplat(route, hrefSegments),
  );
  return { status: "none", matchedOnly: splat ? "splat" : "nothing" };
}

module.exports = { loadRouteTable, matchHref };
