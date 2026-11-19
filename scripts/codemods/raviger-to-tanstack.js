"use strict";

/**
 * jscodeshift codemod: raviger `Link` and `navigate` -> TanStack Router.
 *
 * It converts:
 *   <Link href={`/facility/${id}/settings`} />
 *     -> <Link to="/facility/$facilityId/settings" params={{ facilityId: id }} />
 *   navigate(`/facility/${id}/settings`, { replace: true })
 *     -> navigate({ to: "/facility/$facilityId/settings", params: { ... }, replace: true })
 *
 * `Link` comes from "@tanstack/react-router". `navigate` comes from the typed
 * helper "@/lib/router/navigate".
 *
 * A site is converted only when it is safe. The codemod leaves every other
 * site on the raviger shim and lists it with a reason code. See README.md for
 * the reason codes, the options, and the commands.
 *
 * Options (jscodeshift passes `--name=value` flags as options):
 *   routeTree     Path of the route tree. Default: src/routeTree.gen.ts
 *   targetPrefix  Comma-separated route prefixes. Convert only the targets
 *                 whose route path starts with one of them.
 *   report        File that gets one JSON line for each site.
 *   tsconfig      The tsconfig for the type check. Default: tsconfig.json
 *   typecheck     "false" turns the type check off. By default, the codemod
 *                 skips a site when a `${expr}` is not typed as `string`.
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadRouteTable, matchHref } = require("./route-table");
const { getTypeChecker } = require("./type-check");

const RAVIGER = "raviger";
const ROUTER_MODULE = "@tanstack/react-router";
const NAVIGATE_MODULE = "@/lib/router/navigate";
const MARKER = "\uE000";
const WHOLE_MARKER = /^\uE000(\d+)\uE000$/;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const PLAIN_QUERY_TEXT = /^[A-Za-z0-9_.~-]*$/;

const BLOCKING_LINK_PROPS = {
  exact: "exact-prop",
  activeClass: "active-class-prop",
  exactActiveClass: "active-class-prop",
  query: "query-prop",
  state: "state-prop",
  disabled: "disabled-prop",
};

let cachedTable;
function getTable(routeTree) {
  if (!cachedTable || cachedTable.requested !== routeTree) {
    cachedTable = { requested: routeTree, table: loadRouteTable(routeTree) };
  }
  return cachedTable.table;
}

// ---------------------------------------------------------------------------
// URL analysis
// ---------------------------------------------------------------------------

function stringValue(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  return null;
}

/** Turns a string or a template literal into text with `${expr}` markers. */
function readUrl(node) {
  const text = stringValue(node);
  if (text !== null) return { flat: text, exprs: [] };
  if (node && node.type === "TemplateLiteral") {
    let flat = "";
    for (let index = 0; index < node.quasis.length; index += 1) {
      const cooked = node.quasis[index].value.cooked;
      if (cooked === null || cooked === undefined) return null;
      flat += cooked;
      if (index < node.expressions.length) {
        flat += MARKER + index + MARKER;
      }
    }
    return { flat, exprs: node.expressions };
  }
  return null;
}

function decodeQueryText(text) {
  if (!PLAIN_QUERY_TEXT.test(text)) return null;
  return text;
}

/** Reads `a=b&c=d`. Returns null unless every key and value is plain text. */
function parseLiteralQuery(query) {
  const pairs = [];
  for (const part of query.split("&")) {
    const equals = part.indexOf("=");
    if (equals <= 0) return null;
    const key = decodeQueryText(part.slice(0, equals));
    const value = decodeQueryText(part.slice(equals + 1));
    if (key === null || value === null) return null;
    if (pairs.some(([known]) => known === key)) return null;
    pairs.push([key, value]);
  }
  return pairs;
}

function skip(reason, detail, url) {
  return { ok: false, reason, detail, url };
}

/**
 * Maps the URL text onto one route.
 * Returns `{ ok: true, to, params, search }` or `{ ok: false, reason }`.
 */
function analyzeUrl(urlInfo, table, targetPrefixes, allowLiteralParams) {
  const { flat, exprs } = urlInfo;
  if (flat.includes("#")) return skip("hash-in-url");

  const queryStart = flat.indexOf("?");
  const pathText = queryStart === -1 ? flat : flat.slice(0, queryStart);
  const queryText = queryStart === -1 ? null : flat.slice(queryStart + 1);

  if (!pathText.startsWith("/") || pathText.startsWith("//")) {
    if (SCHEME.test(pathText) || pathText.startsWith("//")) {
      return skip("external-url");
    }
    if (pathText.startsWith(MARKER)) return skip("dynamic-prefix");
    return skip("relative-url");
  }

  let search = [];
  if (queryText !== null) {
    if (queryText.includes(MARKER)) return skip("query-with-expression");
    const pairs = parseLiteralQuery(queryText);
    if (pairs === null) return skip("query-not-trivial");
    search = pairs;
  }

  const rawSegments = pathText === "/" ? [] : pathText.slice(1).split("/");
  const lastIndex = rawSegments.length - 1;
  const segments = [];
  for (let position = 0; position <= lastIndex; position += 1) {
    const text = rawSegments[position];
    if (text === "") {
      return skip(position === lastIndex ? "trailing-slash" : "empty-segment");
    }
    if (!text.includes(MARKER)) {
      segments.push({ kind: "static", value: text });
      continue;
    }
    const whole = text.match(WHOLE_MARKER);
    if (!whole) return skip("partial-segment-expression");
    segments.push({ kind: "expr", index: Number(whole[1]) });
  }

  const result = matchHref(table, segments, allowLiteralParams);
  // The URL with `*` for each `${expr}`. The report groups sites by it.
  const url =
    "/" +
    segments
      .map((segment) => (segment.kind === "expr" ? "*" : segment.value))
      .join("/");
  if (result.status === "ambiguous") {
    return skip("ambiguous-route", result.candidates.join(" | "), url);
  }
  if (result.status === "none") {
    return skip(
      "no-matching-route",
      `matches only: ${result.matchedOnly}`,
      url,
    );
  }
  if (
    targetPrefixes.length > 0 &&
    !targetPrefixes.some((prefix) => result.route.to.startsWith(prefix))
  ) {
    return skip("outside-target-scope", result.route.to);
  }

  return {
    ok: true,
    to: result.route.to,
    params: result.params.map(({ name, index, literal }) =>
      literal === undefined ? { name, expr: exprs[index] } : { name, literal },
    ),
    search,
  };
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

module.exports = function transform(file, api, options) {
  const j = api.jscodeshift;
  const table = getTable(options.routeTree);
  const targetPrefixes = String(options.targetPrefix || "")
    .split(",")
    .map((prefix) => prefix.trim())
    .filter(Boolean);
  const allowLiteralParams = options.literalParams !== "false";
  const relativeFile = path.relative(process.cwd(), file.path);
  const entries = [];

  function record(kind, node, status, extra) {
    entries.push({
      file: relativeFile,
      line: node && node.loc ? node.loc.start.line : null,
      kind,
      status,
      ...extra,
    });
  }

  function flush() {
    if (options.report && entries.length > 0) {
      const lines = entries
        .sort((left, right) => (left.line || 0) - (right.line || 0))
        .map((entry) => JSON.stringify(entry))
        .join("\n");
      fs.appendFileSync(options.report, lines + "\n");
    }
  }

  const root = j(file.source);
  const ravigerImports = root
    .find(j.ImportDeclaration, { source: { value: RAVIGER } })
    .filter((declaration) => declaration.node.importKind !== "type");
  if (ravigerImports.length === 0) return file.source;

  // --- Which raviger names does the file import? ---
  const imported = {}; // imported name -> local name
  let unsupportedImport = false;
  ravigerImports.forEach((declaration) => {
    (declaration.node.specifiers || []).forEach((specifier) => {
      if (specifier.type !== "ImportSpecifier") {
        unsupportedImport = true;
      } else if (specifier.importKind !== "type") {
        imported[specifier.imported.name] = specifier.local
          ? specifier.local.name
          : specifier.imported.name;
      }
    });
  });

  if (unsupportedImport) {
    record("file", null, "skipped", { reason: "unsupported-import-style" });
    flush();
    return file.source;
  }

  const linkLocal = imported.Link;
  const activeLinkLocal = imported.ActiveLink;
  const navigateLocal = imported.navigate;
  if (!linkLocal && !activeLinkLocal && !navigateLocal) return file.source;

  const fileSkipReason =
    imported.useRoutes || imported.RouterProvider
      ? "file-uses-nested-router"
      : null;

  // --- Find the sites ---
  const linkElements = linkLocal
    ? root.find(j.JSXElement).filter((element) => {
        const name = element.node.openingElement.name;
        return name.type === "JSXIdentifier" && name.name === linkLocal;
      })
    : null;
  const activeLinkElements = activeLinkLocal
    ? root.find(j.JSXElement).filter((element) => {
        const name = element.node.openingElement.name;
        return name.type === "JSXIdentifier" && name.name === activeLinkLocal;
      })
    : null;
  const navigateCalls = navigateLocal
    ? root.find(j.CallExpression).filter((call) => {
        const callee = call.node.callee;
        return (
          callee.type === "Identifier" &&
          callee.name === navigateLocal &&
          isGlobalBinding(call, navigateLocal)
        );
      })
    : null;

  if (activeLinkElements) {
    activeLinkElements.forEach((element) =>
      record("link", element.node, "skipped", { reason: "active-link" }),
    );
  }

  const linkPlans = [];
  if (linkElements) {
    linkElements.forEach((element) => {
      const plan = planLink(element.node);
      if (!fileSkipReason && plan.ok) {
        linkPlans.push({ element, plan });
        return;
      }
      record("link", element.node, "skipped", {
        reason: fileSkipReason || plan.reason,
        detail: fileSkipReason ? undefined : plan.detail,
        url: fileSkipReason ? undefined : plan.url,
      });
    });
  }

  const navigatePlans = [];
  if (navigateCalls) {
    navigateCalls.forEach((call) => {
      const plan = planNavigate(call.node);
      if (!fileSkipReason && plan.ok) {
        navigatePlans.push({ call, plan });
        return;
      }
      record("navigate", call.node, "skipped", {
        reason: fileSkipReason || plan.reason,
        detail: fileSkipReason ? undefined : plan.detail,
        url: fileSkipReason ? undefined : plan.url,
      });
    });
  }

  if (linkPlans.length === 0 && navigatePlans.length === 0) {
    flush();
    return file.source;
  }

  // --- Names ---
  const programScope = root.find(j.Program).get().scope;
  const topLevelNames = new Set(Object.keys(programScope.getBindings()));
  const convertedElements = new Set(
    linkPlans.map(({ element }) => element.node),
  );
  const convertedCallees = new Set(
    navigatePlans.map(({ call }) => call.node.callee),
  );

  const existingRouterImport = findValueImport(ROUTER_MODULE);
  const existingHelperImport = findValueImport(NAVIGATE_MODULE);

  const names = {};
  if (linkPlans.length > 0) {
    names.link = chooseNames({
      ravigerLocal: linkLocal,
      desired: "Link",
      fallback: "RouterLink",
      leftoverName: "RavigerLink",
      existing: existingLocal(existingRouterImport, "Link"),
      remaining: countRemainingLinkUses(),
    });
  }
  if (navigatePlans.length > 0) {
    names.navigate = chooseNames({
      ravigerLocal: navigateLocal,
      desired: "navigate",
      fallback: "navigateTo",
      leftoverName: "ravigerNavigate",
      existing: existingLocal(existingHelperImport, "navigate"),
      remaining: countRemainingNavigateUses(),
    });
  }
  if (
    (names.link && names.link.conflict) ||
    (names.navigate && names.navigate.conflict)
  ) {
    const reason = "name-conflict";
    linkPlans.forEach(({ element }) =>
      record("link", element.node, "skipped", { reason }),
    );
    navigatePlans.forEach(({ call }) =>
      record("navigate", call.node, "skipped", { reason }),
    );
    flush();
    return file.source;
  }

  // --- Apply ---
  if (names.link) {
    if (names.link.renameLeftover) {
      renameLeftoverLinks(names.link.leftoverName);
    }
    linkPlans.forEach(({ element, plan }) =>
      applyLink(element.node, plan, names.link.local),
    );
    linkPlans.forEach(({ element, plan }) =>
      record("link", element.node, "converted", convertedInfo(plan)),
    );
  }
  if (names.navigate) {
    if (names.navigate.renameLeftover) {
      renameLeftoverNavigate(names.navigate.leftoverName);
    }
    navigatePlans.forEach(({ call, plan }) =>
      applyNavigate(call.node, plan, names.navigate.local),
    );
    navigatePlans.forEach(({ call, plan }) =>
      record("navigate", call.node, "converted", convertedInfo(plan)),
    );
  }
  flush();
  return rewriteImports(root.toSource({ quote: "double" }));

  // -------------------------------------------------------------------------
  // Planning
  // -------------------------------------------------------------------------

  /** A `params` value must be a string. Returns a skip result, or null. */
  function checkParamTypes(params) {
    const expressions = params.filter((param) => param.expr !== undefined);
    if (expressions.length === 0) return null;
    const checker = getTypeChecker(options);
    if (!checker) return null;
    for (const { name, expr } of expressions) {
      const result = checker.isString(file.path, expr.start, expr.end);
      if (!result.ok)
        return skip("param-type-not-string", `${name}: ${result.text}`);
    }
    return null;
  }

  function convertedInfo(plan) {
    const literalParams = plan.params
      .filter((param) => param.literal !== undefined)
      .map((param) => param.name);
    return literalParams.length > 0
      ? { to: plan.to, literalParams }
      : { to: plan.to };
  }

  function planLink(element) {
    const attributes = element.openingElement.attributes || [];
    let hrefAttribute = null;
    let basePathAttribute = null;
    for (const attribute of attributes) {
      if (attribute.type === "JSXSpreadAttribute") {
        return skip("spread-props");
      }
      if (attribute.name.type !== "JSXIdentifier") continue;
      const name = attribute.name.name;
      if (name === "href") hrefAttribute = attribute;
      else if (name === "basePath") {
        // `basePath="/"` only switches the nested base path off. A TanStack
        // `Link` never uses a base path, so the prop can go.
        const value =
          attribute.value && attribute.value.type === "JSXExpressionContainer"
            ? attribute.value.expression
            : attribute.value;
        if (stringValue(value) !== "/") return skip("base-path-prop");
        basePathAttribute = attribute;
      } else if (BLOCKING_LINK_PROPS[name]) {
        return skip(BLOCKING_LINK_PROPS[name]);
      }
    }
    if (!hrefAttribute || !hrefAttribute.value) return skip("no-href");

    const value =
      hrefAttribute.value.type === "JSXExpressionContainer"
        ? hrefAttribute.value.expression
        : hrefAttribute.value;
    const urlInfo = readUrl(value);
    if (!urlInfo) return skip("non-literal-url");

    const analysis = analyzeUrl(
      urlInfo,
      table,
      targetPrefixes,
      allowLiteralParams,
    );
    if (!analysis.ok) return analysis;
    const typeProblem = checkParamTypes(analysis.params);
    if (typeProblem) return typeProblem;
    return { ...analysis, hrefAttribute, basePathAttribute };
  }

  function planNavigate(call) {
    const args = call.arguments;
    if (args.length < 1 || args.length > 2) {
      return skip("unsupported-arguments");
    }
    const urlInfo = readUrl(args[0]);
    if (!urlInfo) return skip("non-literal-url");

    let replace = null;
    if (args.length === 2) {
      const optionsNode = args[1];
      if (optionsNode.type !== "ObjectExpression") {
        return skip("unsupported-options");
      }
      for (const property of optionsNode.properties) {
        const key =
          property.type === "ObjectProperty" || property.type === "Property"
            ? property.computed
              ? null
              : property.key.name || stringValue(property.key)
            : null;
        const isBoolean =
          property.value &&
          (property.value.type === "BooleanLiteral" ||
            (property.value.type === "Literal" &&
              typeof property.value.value === "boolean"));
        if (key !== "replace" || !isBoolean || replace !== null) {
          return skip(
            "unsupported-options",
            key === null ? "complex property" : key,
          );
        }
        replace = property.value.value;
      }
    }

    const analysis = analyzeUrl(
      urlInfo,
      table,
      targetPrefixes,
      allowLiteralParams,
    );
    if (!analysis.ok) return analysis;
    const typeProblem = checkParamTypes(analysis.params);
    if (typeProblem) return typeProblem;
    return { ...analysis, replace };
  }

  // -------------------------------------------------------------------------
  // Rewriting
  //
  // New code comes from a small piece of source text. recast keeps the text
  // of such a node as it is. This gives compact output without blank lines.
  // -------------------------------------------------------------------------

  function parseExpression(text) {
    const parsed = j(`const __codemod = ${text};`);
    return parsed.find(j.VariableDeclarator).paths()[0].node.init;
  }

  function expressionText(expr) {
    const text = j(expr).toSource();
    return expr.type === "SequenceExpression" ? `(${text})` : text;
  }

  function paramsText(params) {
    const items = params.map(({ name, expr, literal }) => {
      if (literal !== undefined) return `${name}: ${JSON.stringify(literal)}`;
      const text = expressionText(expr);
      return text === name ? name : `${name}: ${text}`;
    });
    return `{ ${items.join(", ")} }`;
  }

  function searchText(search) {
    const items = search.map(([key, value]) => {
      const name = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
        ? key
        : JSON.stringify(key);
      return `${name}: ${JSON.stringify(value)}`;
    });
    return `{ ${items.join(", ")} }`;
  }

  function applyLink(element, plan, localName) {
    let text = `to=${JSON.stringify(plan.to)}`;
    if (plan.params.length > 0) text += ` params={${paramsText(plan.params)}}`;
    if (plan.search.length > 0) text += ` search={${searchText(plan.search)}}`;
    const added = parseExpression(`<A ${text} />`).openingElement.attributes;

    const next = [];
    for (const attribute of element.openingElement.attributes) {
      if (attribute === plan.basePathAttribute) continue;
      if (attribute === plan.hrefAttribute) next.push(...added);
      else next.push(attribute);
    }
    element.openingElement.attributes = next;
    element.openingElement.name = j.jsxIdentifier(localName);
    if (element.closingElement) {
      element.closingElement.name = j.jsxIdentifier(localName);
    }
  }

  function applyNavigate(call, plan, localName) {
    const items = [`to: ${JSON.stringify(plan.to)}`];
    if (plan.params.length > 0)
      items.push(`params: ${paramsText(plan.params)}`);
    if (plan.search.length > 0)
      items.push(`search: ${searchText(plan.search)}`);
    if (plan.replace !== null) items.push(`replace: ${plan.replace}`);
    const created = parseExpression(`${localName}({ ${items.join(", ")} })`);
    call.callee = created.callee;
    call.arguments = created.arguments;
  }

  // -------------------------------------------------------------------------
  // Names and references
  // -------------------------------------------------------------------------

  function isGlobalBinding(path, name) {
    const scope = path.scope && path.scope.lookup(name);
    return !!scope && scope.isGlobal;
  }

  /** True when the identifier path is a use of the binding (not a key). */
  function isReference(path) {
    const parent = path.parent && path.parent.node;
    const node = path.node;
    if (!parent) return true;
    switch (parent.type) {
      case "ImportSpecifier":
      case "ImportDefaultSpecifier":
      case "ImportNamespaceSpecifier":
        return false;
      case "MemberExpression":
      case "OptionalMemberExpression":
        return parent.property !== node || parent.computed === true;
      case "ObjectProperty":
      case "Property":
      case "ObjectMethod":
      case "ClassProperty":
      case "ClassMethod":
      case "TSPropertySignature":
      case "TSMethodSignature":
        return parent.key !== node || parent.computed === true;
      case "TSQualifiedName":
        return parent.right !== node;
      default:
        return true;
    }
  }

  function referencePaths(name) {
    // `j.Identifier` also matches `JSXIdentifier`. JSX names have their own
    // handling.
    return root
      .find(j.Identifier, { name })
      .filter(
        (path) =>
          path.node.type === "Identifier" &&
          isReference(path) &&
          isGlobalBinding(path, name),
      );
  }

  function countRemainingLinkUses() {
    const skippedElements = linkElements.size() - convertedElements.size;
    let other = referencePaths(linkLocal).size();
    root.find(j.JSXIdentifier, { name: linkLocal }).forEach((path) => {
      const parent = path.parent.node;
      const isElementName =
        (parent.type === "JSXOpeningElement" ||
          parent.type === "JSXClosingElement") &&
        parent.name === path.node;
      if (!isElementName) other += 1;
    });
    return skippedElements + other;
  }

  function countRemainingNavigateUses() {
    return referencePaths(navigateLocal)
      .filter((path) => !convertedCallees.has(path.node))
      .size();
  }

  function existingLocal(declaration, importedName) {
    if (!declaration) return null;
    const specifier = (declaration.node.specifiers || []).find(
      (item) =>
        item.type === "ImportSpecifier" &&
        item.importKind !== "type" &&
        item.imported.name === importedName,
    );
    return specifier ? specifier.local.name : null;
  }

  function findValueImport(source) {
    const found = root
      .find(j.ImportDeclaration, { source: { value: source } })
      .filter(
        (declaration) =>
          declaration.node.importKind !== "type" &&
          !(declaration.node.specifiers || []).some(
            (specifier) => specifier.type === "ImportNamespaceSpecifier",
          ),
      );
    return found.size() > 0 ? found.paths()[0] : null;
  }

  /**
   * Chooses the local name of the new import. When the raviger import has the
   * same name and some raviger uses stay, the stays get `leftoverName`.
   */
  function chooseNames({
    ravigerLocal,
    desired,
    fallback,
    leftoverName,
    existing,
    remaining,
  }) {
    const taken = (name) => topLevelNames.has(name);
    let local = existing;
    if (!local) {
      if (!taken(desired) || desired === ravigerLocal) local = desired;
      else if (!taken(fallback)) local = fallback;
      else return { conflict: true };
    }
    if (local !== ravigerLocal) {
      return { local, remaining, renameLeftover: false };
    }
    // The new name equals the raviger name.
    if (remaining === 0) {
      return { local, remaining, renameLeftover: false };
    }
    if (taken(leftoverName)) return { conflict: true };
    return { local, remaining, renameLeftover: true, leftoverName };
  }

  function renameLeftoverLinks(leftoverName) {
    linkElements.forEach((element) => {
      if (convertedElements.has(element.node)) return;
      element.node.openingElement.name = j.jsxIdentifier(leftoverName);
      if (element.node.closingElement) {
        element.node.closingElement.name = j.jsxIdentifier(leftoverName);
      }
    });
    referencePaths(linkLocal).forEach((path) =>
      renameIdentifier(path, leftoverName),
    );
  }

  function renameLeftoverNavigate(leftoverName) {
    referencePaths(navigateLocal)
      .filter((path) => !convertedCallees.has(path.node))
      .forEach((path) => renameIdentifier(path, leftoverName));
  }

  function renameIdentifier(path, newName) {
    const parent = path.parent.node;
    if (
      (parent.type === "ObjectProperty" || parent.type === "Property") &&
      parent.shorthand
    ) {
      // `{ navigate }` becomes `{ navigate: ravigerNavigate }`.
      if (parent.value === path.node) {
        parent.shorthand = false;
        parent.value = j.identifier(newName);
      }
      return;
    }
    path.node.name = newName;
  }

  // -------------------------------------------------------------------------
  // Imports
  //
  // The import edits are text edits on the printed source. recast would lose
  // blank lines between import groups, and the formatter would then sort the
  // imports of the whole file.
  // -------------------------------------------------------------------------

  function specifierText(specifier) {
    const importedName = specifier.imported.name;
    const localName = specifier.local ? specifier.local.name : importedName;
    const kind = specifier.importKind === "type" ? "type " : "";
    return importedName === localName
      ? `${kind}${importedName}`
      : `${kind}${importedName} as ${localName}`;
  }

  function importText(specifierTexts, source) {
    return `import { ${specifierTexts.join(", ")} } from ${JSON.stringify(source)};`;
  }

  /** Range of a whole line when the node is alone on its lines. */
  function lineRange(text, node) {
    let start = node.start;
    let end = node.end;
    const before = text.lastIndexOf("\n", start - 1) + 1;
    const after = text.indexOf("\n", end);
    const lineEnd = after === -1 ? text.length : after;
    if (
      text.slice(before, start).trim() === "" &&
      text.slice(end, lineEnd).trim() === ""
    ) {
      start = before;
      end = Math.min(lineEnd + 1, text.length);
    }
    return { start, end };
  }

  function rewriteImports(source) {
    const parsed = j(source);
    const body = parsed.find(j.Program).paths()[0].node.body;
    const declarations = body.filter(
      (node) => node.type === "ImportDeclaration",
    );
    const ravigerDeclarations = declarations.filter(
      (node) => node.source.value === RAVIGER && node.importKind !== "type",
    );
    const findDeclaration = (module) =>
      declarations.find(
        (node) =>
          node.source.value === module &&
          node.importKind !== "type" &&
          !(node.specifiers || []).some(
            (specifier) => specifier.type === "ImportNamespaceSpecifier",
          ),
      );

    const edits = [];
    const newLines = []; // import lines for modules that the file did not import
    const additions = [];
    if (names.link) {
      additions.push({
        module: ROUTER_MODULE,
        imported: "Link",
        local: names.link.local,
        placement: "raviger",
      });
    }
    if (names.navigate) {
      additions.push({
        module: NAVIGATE_MODULE,
        imported: "navigate",
        local: names.navigate.local,
        placement: "alias",
      });
    }

    // Fix the raviger declarations.
    const emptied = [];
    ravigerDeclarations.forEach((node) => {
      const specifierTexts = [];
      let changed = false;
      for (const specifier of node.specifiers || []) {
        const importedName = specifier.imported.name;
        const choice =
          importedName === "Link"
            ? names.link
            : importedName === "navigate"
              ? names.navigate
              : null;
        if (!choice || specifier.importKind === "type") {
          specifierTexts.push(specifierText(specifier));
          continue;
        }
        changed = true;
        if (choice.remaining === 0) continue;
        if (choice.renameLeftover) {
          specifierTexts.push(
            specifierText({
              imported: specifier.imported,
              local: { name: choice.leftoverName },
            }),
          );
        } else {
          specifierTexts.push(specifierText(specifier));
        }
      }
      if (specifierTexts.length === 0) emptied.push(node);
      else if (changed) {
        edits.push({
          start: node.start,
          end: node.end,
          text: importText(specifierTexts, RAVIGER),
        });
      }
    });

    // Add the new specifiers. A module that the file already imports gets
    // the specifier. Other modules get a new import line.
    const mergedInto = new Map(); // declaration -> specifier texts
    additions.forEach((addition) => {
      const existing = findDeclaration(addition.module);
      const line = importText(
        [
          addition.imported === addition.local
            ? addition.imported
            : `${addition.imported} as ${addition.local}`,
        ],
        addition.module,
      );
      if (!existing) {
        newLines.push({ line, placement: addition.placement });
        return;
      }
      const known = (existing.specifiers || []).find(
        (specifier) =>
          specifier.type === "ImportSpecifier" &&
          specifier.importKind !== "type" &&
          specifier.imported.name === addition.imported,
      );
      if (known) return;
      const texts = mergedInto.get(existing) || [
        ...(existing.specifiers || []).map(specifierText),
      ];
      texts.push(
        addition.imported === addition.local
          ? addition.imported
          : `${addition.imported} as ${addition.local}`,
      );
      mergedInto.set(existing, texts);
    });
    mergedInto.forEach((texts, node) => {
      edits.push({
        start: node.start,
        end: node.end,
        text: importText(texts, node.source.value),
      });
    });

    // New lines go where the file groups such imports: the router import
    // takes the place of the raviger import, and the helper import follows
    // the last "@/" import.
    const atRaviger = newLines
      .filter((item) => item.placement === "raviger")
      .map((item) => item.line);
    const afterAlias = newLines
      .filter((item) => item.placement === "alias")
      .map((item) => item.line);
    const aliasDeclarations = declarations.filter(
      (node) =>
        node.source.value.startsWith("@/") &&
        node.source.value !== NAVIGATE_MODULE,
    );
    if (aliasDeclarations.length === 0) atRaviger.push(...afterAlias);

    const first = ravigerDeclarations[0];
    let placed = false;
    emptied.forEach((node) => {
      if (!placed && atRaviger.length > 0) {
        edits.push({
          start: node.start,
          end: node.end,
          text: atRaviger.join("\n"),
        });
        placed = true;
        return;
      }
      edits.push({ ...lineRange(source, node), text: "" });
    });
    if (!placed && atRaviger.length > 0) {
      const { start } = lineRange(source, first);
      edits.push({ start, end: start, text: atRaviger.join("\n") + "\n" });
    }
    if (aliasDeclarations.length > 0 && afterAlias.length > 0) {
      const last = aliasDeclarations[aliasDeclarations.length - 1];
      edits.push({
        start: last.end,
        end: last.end,
        text: "\n" + afterAlias.join("\n"),
      });
    }

    return edits
      .sort((left, right) => right.start - left.start)
      .reduce(
        (text, edit) =>
          text.slice(0, edit.start) + edit.text + text.slice(edit.end),
        source,
      );
  }
};

module.exports.parser = "tsx";
