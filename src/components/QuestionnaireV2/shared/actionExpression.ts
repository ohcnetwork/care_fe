/**
 * The bridge between the action editor's structured rules and the raw
 * expression strings the backend stores and evaluates.
 *
 * The backend evaluates `condition` (and any `{{ … }}` instruction param)
 * with `evalidate` over a whitelist of Python nodes: names, constants,
 * subscripts, comparisons, `in`/`not in`, `and`/`or`/`not`, arithmetic and
 * f-strings — NO attribute access (`patient.age` is rejected; it must be
 * `patient["age"]`), NO list literals, NO calls. Question answers are the
 * names `q_<link_id>` (present only when answered), context values are
 * subscript chains from the submission root (`patient["age"]`).
 *
 * The editor emits one canonical subset and only ever parses that subset
 * back: clauses of the form `ref OP literal` or `literal in ref` /
 * `literal not in ref`, joined by a single connective. Anything else a
 * human wrote (parentheses, arithmetic, f-strings) is a "custom expression"
 * — kept verbatim, edited as text, never rewritten.
 *
 * Refs are represented as dotted paths on this side (`q_fever`,
 * `patient.age`) and compiled to Python on the way out.
 */

export type ActionRuleOperator =
  "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in";

export type ActionRuleValue = string | number | boolean;

export interface ActionRule {
  /** `q_<link_id>` for an answer, or a context path such as `patient.age`. */
  ref: string;
  operator: ActionRuleOperator;
  value: ActionRuleValue;
}

export type ActionRuleBehavior = "all" | "any";

export interface ParsedCondition {
  rules: ActionRule[];
  behavior: ActionRuleBehavior;
}

export const ACTION_RULE_OPERATORS: readonly ActionRuleOperator[] = [
  "==",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "in",
  "not in",
];

/** The literal the backend's `Action.condition` needs to fire on every
 *  submission — an EMPTY condition never fires. */
export const ALWAYS_CONDITION = "True";

const QUESTION_REF_PREFIX = "q_";

/** A link_id usable as a condition variable: `q_` + link_id must be a Python
 *  identifier, so only `[A-Za-z0-9_]` survive (the studio's default
 *  `Q-xxxxxxxx` link ids carry a hyphen and cannot be referenced). */
export function isIdentifierSafeLinkId(linkId: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(linkId);
}

export function questionRef(linkId: string): string {
  return QUESTION_REF_PREFIX + linkId;
}

/** The link_id a `q_…` ref names (`q_weight.value` included — record
 *  answers are addressed through their `value` key), or undefined for
 *  context refs. */
export function linkIdOfRef(ref: string): string | undefined {
  const [root] = ref.split(".");
  return root.startsWith(QUESTION_REF_PREFIX)
    ? root.slice(QUESTION_REF_PREFIX.length)
    : undefined;
}

// ---------------------------------------------------------------------------
// Tokenizer — position-preserving so `remapQuestionRefs` can rewrite names
// without touching string literals or anything it does not understand.

type Token =
  | { kind: "string"; value: string; start: number; end: number }
  | { kind: "number"; value: number; start: number; end: number }
  | { kind: "ident"; value: string; start: number; end: number }
  | { kind: "op"; value: string; start: number; end: number }
  /** An f-string (`f"temp {q_temp}"`): the `{…}` replacement fields are
   *  expressions in their own right, tokenized with absolute positions so
   *  reference scans and remaps reach into them. */
  | { kind: "fstring"; fields: Token[]; start: number; end: number }
  | { kind: "other"; value: string; start: number; end: number };

const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;
const TWO_CHAR_OPS = ["==", "!=", ">=", "<="];
const ONE_CHAR_OPS = "><[]()+-*/%,";

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const start = index;
      const scanned = scanQuoted(source, index);
      if (!scanned.closed) {
        tokens.push({
          kind: "other",
          value: source.slice(start),
          start,
          end: source.length,
        });
        break;
      }
      const decoded = decodeStringLiteral(scanned.body, char);
      tokens.push(
        decoded === undefined
          ? {
              kind: "other",
              value: source.slice(start, scanned.end),
              start,
              end: scanned.end,
            }
          : { kind: "string", value: decoded, start, end: scanned.end },
      );
      index = scanned.end;
      continue;
    }
    if (DIGIT.test(char)) {
      const start = index;
      let cursor = index;
      while (cursor < source.length && DIGIT.test(source[cursor])) cursor += 1;
      if (
        source[cursor] === "." &&
        cursor + 1 < source.length &&
        DIGIT.test(source[cursor + 1])
      ) {
        cursor += 1;
        while (cursor < source.length && DIGIT.test(source[cursor])) {
          cursor += 1;
        }
      }
      tokens.push({
        kind: "number",
        value: Number(source.slice(start, cursor)),
        start,
        end: cursor,
      });
      index = cursor;
      continue;
    }
    if (IDENT_START.test(char)) {
      const start = index;
      let cursor = index;
      while (cursor < source.length && IDENT_PART.test(source[cursor])) {
        cursor += 1;
      }
      const word = source.slice(start, cursor);
      const quote = source[cursor];
      if ((word === "f" || word === "F") && (quote === '"' || quote === "'")) {
        const scanned = scanQuoted(source, cursor);
        if (!scanned.closed) {
          tokens.push({
            kind: "other",
            value: source.slice(start),
            start,
            end: source.length,
          });
          break;
        }
        tokens.push({
          kind: "fstring",
          fields: tokenizeReplacementFields(
            source,
            cursor + 1,
            scanned.end - 1,
          ),
          start,
          end: scanned.end,
        });
        index = scanned.end;
        continue;
      }
      tokens.push({ kind: "ident", value: word, start, end: cursor });
      index = cursor;
      continue;
    }
    const pair = source.slice(index, index + 2);
    if (TWO_CHAR_OPS.includes(pair)) {
      tokens.push({ kind: "op", value: pair, start: index, end: index + 2 });
      index += 2;
      continue;
    }
    if (ONE_CHAR_OPS.includes(char)) {
      tokens.push({ kind: "op", value: char, start: index, end: index + 1 });
      index += 1;
      continue;
    }
    tokens.push({ kind: "other", value: char, start: index, end: index + 1 });
    index += 1;
  }
  return tokens;
}

/** Reads a quoted literal starting at `quoteIndex`, honouring backslash
 *  escapes; `body` is the raw text between the quotes. */
function scanQuoted(
  source: string,
  quoteIndex: number,
): { body: string; end: number; closed: boolean } {
  const quote = source[quoteIndex];
  let cursor = quoteIndex + 1;
  while (cursor < source.length) {
    const current = source[cursor];
    if (current === "\\") {
      cursor += 2;
      continue;
    }
    if (current === quote) {
      return {
        body: source.slice(quoteIndex + 1, cursor),
        end: cursor + 1,
        closed: true,
      };
    }
    cursor += 1;
  }
  return {
    body: source.slice(quoteIndex + 1),
    end: source.length,
    closed: false,
  };
}

/** The `{expr}` replacement fields of an f-string body (`{{`/`}}` are
 *  literal braces), each tokenized with positions relative to `source`. */
function tokenizeReplacementFields(
  source: string,
  bodyStart: number,
  bodyEnd: number,
): Token[] {
  const fields: Token[] = [];
  let cursor = bodyStart;
  while (cursor < bodyEnd) {
    const pair = source.slice(cursor, cursor + 2);
    if (pair === "{{" || pair === "}}") {
      cursor += 2;
      continue;
    }
    if (source[cursor] !== "{") {
      cursor += 1;
      continue;
    }
    let depth = 1;
    let end = cursor + 1;
    while (end < bodyEnd && depth > 0) {
      if (source[end] === "{") depth += 1;
      else if (source[end] === "}") depth -= 1;
      if (depth > 0) end += 1;
    }
    if (depth !== 0) {
      // An unterminated replacement field: surfaced as a stray token so
      // `lintExpression` reports it and `parseCondition` rejects it.
      fields.push({
        kind: "other",
        value: "{",
        start: cursor,
        end: cursor + 1,
      });
      break;
    }
    // Python allows `{expr!r:spec}` — only the expression part is scanned.
    const field = source.slice(cursor + 1, end);
    const expressionLength = field.search(/[!:]/);
    const expression =
      expressionLength === -1 ? field : field.slice(0, expressionLength);
    for (const token of tokenize(expression)) {
      fields.push(shiftToken(token, cursor + 1));
    }
    cursor = end + 1;
  }
  return fields;
}

function shiftToken(token: Token, offset: number): Token {
  const shifted = {
    ...token,
    start: token.start + offset,
    end: token.end + offset,
  };
  return shifted.kind === "fstring"
    ? { ...shifted, fields: shifted.fields.map((f) => shiftToken(f, offset)) }
    : shifted;
}

/** Every token in source order, descending into f-string fields. */
function* walkTokens(tokens: Token[]): Generator<Token> {
  for (const token of tokens) {
    if (token.kind === "fstring") {
      yield* walkTokens(token.fields);
    } else {
      yield token;
    }
  }
}

/** Decodes the body of a Python string literal. Double-quoted bodies go
 *  through JSON (the same escapes, and exactly what `compile` emits);
 *  single-quoted ones are accepted only when trivially convertible. */
function decodeStringLiteral(body: string, quote: string): string | undefined {
  try {
    if (quote === '"') return JSON.parse(`"${body}"`) as string;
    if (body.includes("\\") || body.includes('"')) return undefined;
    return body;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Compile

/** `patient.age` → `patient["age"]`. Inside an f-string body the keys are
 *  single-quoted so the template stays valid on every Python the backend
 *  might run (same-quote reuse inside replacement fields needs 3.12). */
export function compileRef(ref: string, quote: '"' | "'" = '"'): string {
  const [root, ...keys] = ref.split(".");
  return (
    root +
    keys
      .map((key) => (quote === '"' ? `[${JSON.stringify(key)}]` : `['${key}']`))
      .join("")
  );
}

function compileLiteral(value: ActionRuleValue): string {
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }
  return JSON.stringify(value);
}

function compileRule(rule: ActionRule): string {
  const ref = compileRef(rule.ref);
  const literal = compileLiteral(rule.value);
  if (rule.operator === "in" || rule.operator === "not in") {
    return `${literal} ${rule.operator} ${ref}`;
  }
  return `${ref} ${rule.operator} ${literal}`;
}

/** Rules → the backend expression. No rules → `True` (always fires). */
export function compileCondition(
  rules: ActionRule[],
  behavior: ActionRuleBehavior,
): string {
  if (rules.length === 0) return ALWAYS_CONDITION;
  return rules.map(compileRule).join(behavior === "any" ? " or " : " and ");
}

/** A whole-value instruction param that evaluates `ref` at run time. */
export function compileTemplate(ref: string): string {
  return `{{ ${compileRef(ref)} }}`;
}

// ---------------------------------------------------------------------------
// Parse (canonical subset only)

/** `ident ( "[" string "]" )*` → dotted path, consuming from `from`. */
function isOp(token: Token | undefined, value: string): boolean {
  return token?.kind === "op" && token.value === value;
}

function readRef(
  tokens: Token[],
  from: number,
): { ref: string; next: number } | null {
  const head = tokens[from];
  if (!head || head.kind !== "ident" || isKeyword(head.value)) return null;
  const segments = [head.value];
  let cursor = from + 1;
  while (
    isOp(tokens[cursor], "[") &&
    tokens[cursor + 1]?.kind === "string" &&
    isOp(tokens[cursor + 2], "]")
  ) {
    const key = (tokens[cursor + 1] as Extract<Token, { kind: "string" }>)
      .value;
    if (!IDENT_START.test(key[0] ?? "") || !/^[A-Za-z0-9_]+$/.test(key)) {
      return null;
    }
    segments.push(key);
    cursor += 3;
  }
  return { ref: segments.join("."), next: cursor };
}

function readLiteral(
  tokens: Token[],
  from: number,
): { value: ActionRuleValue; next: number } | null {
  const token = tokens[from];
  if (!token) return null;
  if (token.kind === "string") return { value: token.value, next: from + 1 };
  if (token.kind === "number") return { value: token.value, next: from + 1 };
  if (
    token.kind === "op" &&
    token.value === "-" &&
    tokens[from + 1]?.kind === "number"
  ) {
    return {
      value: -(tokens[from + 1] as Extract<Token, { kind: "number" }>).value,
      next: from + 2,
    };
  }
  if (token.kind === "ident" && token.value === "True") {
    return { value: true, next: from + 1 };
  }
  if (token.kind === "ident" && token.value === "False") {
    return { value: false, next: from + 1 };
  }
  return null;
}

const KEYWORDS = new Set(["and", "or", "not", "in", "True", "False", "None"]);

function isKeyword(word: string): boolean {
  return KEYWORDS.has(word);
}

const COMPARISON_OPERATORS = new Set(["==", "!=", ">", ">=", "<", "<="]);

function isWord(token: Token | undefined, word: string): boolean {
  return token?.kind === "ident" && token.value === word;
}

function parseClause(tokens: Token[]): ActionRule | null {
  // `literal in ref` / `literal not in ref`
  const literalFirst = readLiteral(tokens, 0);
  if (literalFirst) {
    let cursor = literalFirst.next;
    let operator: ActionRuleOperator | undefined;
    if (isWord(tokens[cursor], "in")) {
      operator = "in";
      cursor += 1;
    } else if (
      isWord(tokens[cursor], "not") &&
      isWord(tokens[cursor + 1], "in")
    ) {
      operator = "not in";
      cursor += 2;
    }
    if (operator) {
      const ref = readRef(tokens, cursor);
      if (!ref || ref.next !== tokens.length) return null;
      return { ref: ref.ref, operator, value: literalFirst.value };
    }
  }
  // `ref OP literal`
  const ref = readRef(tokens, 0);
  if (!ref) return null;
  const opToken = tokens[ref.next];
  if (
    !opToken ||
    opToken.kind !== "op" ||
    !COMPARISON_OPERATORS.has(opToken.value)
  ) {
    return null;
  }
  const literal = readLiteral(tokens, ref.next + 1);
  if (!literal || literal.next !== tokens.length) return null;
  return {
    ref: ref.ref,
    operator: opToken.value as ActionRuleOperator,
    value: literal.value,
  };
}

/**
 * The structured reading of a stored condition, or null when it is not in
 * the canonical subset the editor emits (the caller then shows it as a
 * custom expression). `True` reads as "no rules".
 */
export function parseCondition(expression: string): ParsedCondition | null {
  const tokens = tokenize(expression);
  if (tokens.length === 0) return null;
  if (
    tokens.some((token) => token.kind === "other" || token.kind === "fstring")
  ) {
    return null;
  }
  if (tokens.length === 1 && isWord(tokens[0], "True")) {
    return { rules: [], behavior: "all" };
  }

  const groups: Token[][] = [[]];
  let behavior: ActionRuleBehavior | undefined;
  for (const token of tokens) {
    if (
      token.kind === "ident" &&
      (token.value === "and" || token.value === "or")
    ) {
      const next: ActionRuleBehavior = token.value === "and" ? "all" : "any";
      if (behavior && behavior !== next) return null;
      behavior = next;
      groups.push([]);
      continue;
    }
    groups[groups.length - 1].push(token);
  }

  const rules: ActionRule[] = [];
  for (const group of groups) {
    const rule = parseClause(group);
    if (!rule) return null;
    rules.push(rule);
  }
  return { rules, behavior: behavior ?? "all" };
}

export type ParsedTemplate =
  { kind: "ref"; ref: string } | { kind: "expression"; expression: string };

/** Reads a `{{ … }}` param: a bare ref the picker can display, a custom
 *  expression, or null when the value is a plain literal. */
export function parseTemplate(value: unknown): ParsedTemplate | null {
  if (typeof value !== "string") return null;
  // Exact, untrimmed: the backend's check is `startswith("{{") and
  // endswith("}}")` on the raw value — a leading space makes it text.
  const match = /^\{\{([\s\S]*)\}\}$/.exec(value);
  if (!match) return null;
  const inner = match[1].trim();
  const tokens = tokenize(inner);
  const ref = tokens.length > 0 ? readRef(tokens, 0) : null;
  if (ref && ref.next === tokens.length) return { kind: "ref", ref: ref.ref };
  return { kind: "expression", expression: inner };
}

// ---------------------------------------------------------------------------
// Message templates — instruction params with answers spliced into text.
//
// The editor works on plain text with `{ref}` tokens ("Fever, temp {q_temp}");
// the wire value is the whole-value f-string template the backend evaluates
// (`{{ f"Fever, temp {q_temp}" }}`). Text without tokens is stored verbatim.

const MESSAGE_TOKEN =
  /\{([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\}/g;

export function messageToken(ref: string): string {
  return `{${ref}}`;
}

/** The refs a message text splices in, in order of appearance. */
export function messageTokens(text: string): string[] {
  return [...text.matchAll(MESSAGE_TOKEN)].map((match) => match[1]);
}

function escapeFStringLiteral(segment: string): string {
  return segment
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\{/g, "{{")
    .replace(/\}/g, "}}");
}

/** Editor text → stored param value. */
export function compileMessageTemplate(text: string): string {
  if (!MESSAGE_TOKEN.test(text)) return text;
  MESSAGE_TOKEN.lastIndex = 0;
  let body = "";
  let cursor = 0;
  for (const match of text.matchAll(MESSAGE_TOKEN)) {
    body += escapeFStringLiteral(text.slice(cursor, match.index));
    body += `{${compileRef(match[1], "'")}}`;
    cursor = match.index + match[0].length;
  }
  body += escapeFStringLiteral(text.slice(cursor));
  return `{{ f"${body}" }}`;
}

export type ParsedMessageTemplate =
  { kind: "text"; text: string } | { kind: "expression"; expression: string };

/** Decodes one f-string body back to editor text, or undefined when a
 *  replacement field holds something other than a bare ref. */
function decodeFStringBody(body: string): string | undefined {
  let text = "";
  let cursor = 0;
  while (cursor < body.length) {
    const pair = body.slice(cursor, cursor + 2);
    if (pair === "{{" || pair === "}}") {
      text += pair[0];
      cursor += 2;
      continue;
    }
    const char = body[cursor];
    if (char === "{") {
      const close = body.indexOf("}", cursor);
      if (close === -1) return undefined;
      const field = body.slice(cursor + 1, close);
      const tokens = tokenize(field);
      const ref = tokens.length > 0 ? readRef(tokens, 0) : null;
      if (!ref || ref.next !== tokens.length) return undefined;
      text += messageToken(ref.ref);
      cursor = close + 1;
      continue;
    }
    if (char === "\\" && cursor + 1 < body.length) {
      const next = body[cursor + 1];
      const decoded =
        next === "n" ? "\n" : next === "r" ? "\r" : next === "t" ? "\t" : next;
      text += ['"', "\\", "n", "r", "t", "'"].includes(next)
        ? decoded
        : char + next;
      cursor += 2;
      continue;
    }
    text += char;
    cursor += 1;
  }
  return text;
}

/** Stored param value → editor text, or the raw expression when it is
 *  not something the token editor can show. */
export function parseMessageTemplate(value: unknown): ParsedMessageTemplate {
  if (typeof value !== "string") return { kind: "text", text: "" };
  const template = parseTemplate(value);
  if (!template) return { kind: "text", text: value };
  if (template.kind === "ref") {
    return { kind: "text", text: messageToken(template.ref) };
  }
  const tokens = tokenize(template.expression);
  if (tokens.length === 1 && tokens[0].kind === "fstring") {
    const raw = template.expression.trim();
    const body = raw.slice(2, -1);
    const text = decodeFStringBody(body);
    if (text !== undefined) return { kind: "text", text };
  }
  return { kind: "expression", expression: template.expression };
}

// ---------------------------------------------------------------------------
// Lint — the backend validates nothing about an expression at save time;
// a typo would surface as a 500 on every submission instead.

export type ExpressionProblem = "syntax" | "attribute";

/**
 * Cheap static checks over a hand-written expression: characters the
 * grammar has no place for (an unterminated string, `;`, `.`),
 * unbalanced brackets, and attribute access — `patient.age` — which
 * evalidate rejects where `patient["age"]` works.
 */
export function lintExpression(expression: string): ExpressionProblem | null {
  const tokens = tokenize(expression);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (
      token.kind === "other" &&
      token.value === "." &&
      tokens[index - 1]?.kind === "ident" &&
      tokens[index + 1]?.kind === "ident"
    ) {
      return "attribute";
    }
  }
  const stack: string[] = [];
  let previous: Token | undefined;
  for (const token of walkTokens(tokens)) {
    if (token.kind === "other") return "syntax";
    // `is` / `is not`, list and tuple literals: evalidate rejects them all.
    if (token.kind === "ident" && token.value === "is") return "syntax";
    if (token.kind === "op") {
      const opensLiteral =
        token.value === "[" &&
        !(
          previous &&
          ((previous.kind === "op" &&
            (previous.value === "]" || previous.value === ")")) ||
            (previous.kind === "ident" && !isKeyword(previous.value)))
        );
      if (opensLiteral) return "syntax";
      if (token.value === "(" || token.value === "[") stack.push(token.value);
      if (token.value === ")" && stack.pop() !== "(") return "syntax";
      if (token.value === "]" && stack.pop() !== "[") return "syntax";
    }
    previous = token;
  }
  return stack.length === 0 ? null : "syntax";
}

/**
 * A link id the expression engine can name, derived from an existing one:
 * every character outside `[A-Za-z0-9_]` becomes `_`, with a numeric
 * suffix when that collides with another question in the tree.
 */
export function referenceableLinkId(
  linkId: string,
  taken: ReadonlySet<string>,
): string {
  const base = linkId.replace(/[^A-Za-z0-9_]/g, "_") || "Q";
  if (base === linkId || !taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

// ---------------------------------------------------------------------------
// Reference inspection and rewriting

/** Every `q_<link_id>` name an expression reads — canonical or not. */
export function referencedLinkIds(expression: string): string[] {
  const seen = new Set<string>();
  for (const token of walkTokens(tokenize(expression))) {
    if (token.kind !== "ident") continue;
    const linkId = linkIdOfRef(token.value);
    if (linkId) seen.add(linkId);
  }
  return [...seen];
}

/** Rewrites `q_<old>` names per `linkIdMap`, leaving string literals and
 *  everything else byte-identical. */
export function remapQuestionRefs(
  expression: string,
  linkIdMap: ReadonlyMap<string, string>,
): string {
  let output = "";
  let cursor = 0;
  for (const token of walkTokens(tokenize(expression))) {
    if (token.kind !== "ident") continue;
    const linkId = linkIdOfRef(token.value);
    const replacement = linkId ? linkIdMap.get(linkId) : undefined;
    if (!replacement) continue;
    output += expression.slice(cursor, token.start) + questionRef(replacement);
    cursor = token.end;
  }
  return output + expression.slice(cursor);
}

/** The `{{ … }}` inner expression of a param, rewritten and re-wrapped. */
function remapTemplateParam(
  value: unknown,
  linkIdMap: ReadonlyMap<string, string>,
): unknown {
  if (typeof value !== "string") return value;
  const match = /^(\s*\{\{)([\s\S]*)(\}\}\s*)$/.exec(value);
  if (!match) return value;
  return match[1] + remapQuestionRefs(match[2], linkIdMap) + match[3];
}

/** Every answer reference inside an action (its condition plus any
 *  templated param) — for validation and the clone remap. */
export function actionReferencedLinkIds(action: {
  condition: string;
  instructions: { params: Record<string, unknown> }[];
}): string[] {
  const seen = new Set(referencedLinkIds(action.condition));
  for (const instruction of action.instructions) {
    for (const value of Object.values(instruction.params)) {
      const template = parseTemplate(value);
      if (!template) continue;
      const inner =
        template.kind === "ref" ? template.ref : template.expression;
      for (const linkId of referencedLinkIds(inner)) seen.add(linkId);
    }
  }
  return [...seen];
}

/** Clone support: follow `regenerateQuestionIds`' link_id map through every
 *  condition and templated param so the copy's actions still point at the
 *  copy's questions. */
export function remapActionLinkIds<
  T extends {
    condition: string;
    instructions: { params: Record<string, unknown> }[];
  },
>(actions: T[], linkIdMap: ReadonlyMap<string, string>): T[] {
  return actions.map((action) => ({
    ...action,
    condition: remapQuestionRefs(action.condition, linkIdMap),
    instructions: action.instructions.map((instruction) => ({
      ...instruction,
      params: Object.fromEntries(
        Object.entries(instruction.params).map(([key, value]) => [
          key,
          remapTemplateParam(value, linkIdMap),
        ]),
      ),
    })),
  }));
}
