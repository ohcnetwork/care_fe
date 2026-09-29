/**
 * Bridge between the action editor's structured rules and the expression
 * strings the backend evaluates with `evalidate`.
 *
 * Backend grammar: names, constants, subscripts, comparisons (including
 * `is` / `is not`, `in` / `not in`), `and` / `or` / `not`, `+ - * / %`,
 * conditional expressions and f-strings. Rejected: attribute access
 * (`patient.age` must be `patient["age"]`), list/tuple/dict literals,
 * calls, `**`. Answers are the names `q_<link_id>`; context values are
 * subscript chains (`patient["age"]`). Refs are dotted paths on this side.
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

/** An EMPTY condition never fires; this one fires on every submission. */
export const ALWAYS_CONDITION = "True";

const QUESTION_REF_PREFIX = "q_";

/** `q_` + link_id must be a Python identifier. */
export function isIdentifierSafeLinkId(linkId: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(linkId);
}

export function questionRef(linkId: string): string {
  return QUESTION_REF_PREFIX + linkId;
}

/** The link_id a `q_…` ref (or `q_….value`) names; undefined for context refs. */
export function linkIdOfRef(ref: string): string | undefined {
  const [root] = ref.split(".");
  return root.startsWith(QUESTION_REF_PREFIX)
    ? root.slice(QUESTION_REF_PREFIX.length)
    : undefined;
}

// ---------------------------------------------------------------------------
// Tokenizer (position-preserving, so refs can be rewritten in place)

type Token =
  | { kind: "string"; value: string; start: number; end: number }
  /** A closed string literal outside the canonical subset (odd escapes,
   *  single quotes around `"`): valid Python, not an editor literal. */
  | { kind: "quoted"; start: number; end: number }
  | { kind: "number"; value: number; start: number; end: number }
  | { kind: "ident"; value: string; start: number; end: number }
  | { kind: "op"; value: string; start: number; end: number }
  /** `fields` holds the tokens of every `{…}` replacement field, positioned
   *  relative to the whole source. */
  | { kind: "fstring"; fields: Token[]; start: number; end: number }
  | { kind: "other"; value: string; start: number; end: number };

const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;
const FSTRING_PREFIX = /^([fF][rR]?|[rR][fF])$/;
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
          ? { kind: "quoted", start, end: scanned.end }
          : { kind: "string", value: decoded, start, end: scanned.end },
      );
      index = scanned.end;
      continue;
    }
    if (DIGIT.test(char)) {
      const start = index;
      let cursor = index;
      const readDigits = () => {
        while (cursor < source.length && DIGIT.test(source[cursor])) {
          cursor += 1;
        }
      };
      readDigits();
      if (source[cursor] === "." && DIGIT.test(source[cursor + 1] ?? "")) {
        cursor += 1;
        readDigits();
      }
      const exponent = /^[eE][+-]?[0-9]+/.exec(source.slice(cursor));
      if (exponent) cursor += exponent[0].length;
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
      if (FSTRING_PREFIX.test(word) && (quote === '"' || quote === "'")) {
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

/** Tokens of every `{expr}` replacement field in an f-string body. */
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
    const field = readReplacementField(source, cursor + 1, bodyEnd);
    if (!field) {
      // Unterminated field: a stray token so lint reports it and parse rejects it.
      fields.push({
        kind: "other",
        value: "{",
        start: cursor,
        end: cursor + 1,
      });
      break;
    }
    fields.push(...field.tokens);
    cursor = field.end;
  }
  return fields;
}

/**
 * Reads one replacement field starting after its `{`, following CPython:
 * the expression ends at a top-level `!` (conversion; `!=` is an operator)
 * or `:` (format spec, which may nest further fields) or the closing `}`.
 */
function readReplacementField(
  source: string,
  from: number,
  limit: number,
): { tokens: Token[]; end: number } | null {
  const tokens: Token[] = [];
  const brackets: string[] = [];
  const scanned = tokenize(source.slice(from, limit)).map((token) =>
    shiftToken(token, from),
  );
  for (let index = 0; index < scanned.length; index += 1) {
    const token = scanned[index];
    if (token.kind === "op" && (token.value === "(" || token.value === "[")) {
      brackets.push(token.value);
    } else if (
      token.kind === "op" &&
      (token.value === ")" || token.value === "]")
    ) {
      brackets.pop();
    } else if (token.kind === "other" && token.value === "{") {
      brackets.push("{");
    } else if (token.kind === "other" && token.value === "}") {
      if (brackets.length === 0) return { tokens, end: token.end };
      brackets.pop();
    } else if (
      token.kind === "other" &&
      brackets.length === 0 &&
      (token.value === "!" || token.value === ":")
    ) {
      let cursor = token.end;
      if (token.value === "!") {
        const conversion = scanned[index + 1];
        if (conversion?.kind !== "ident") return null;
        cursor = conversion.end;
        if (source[cursor] === "}") return { tokens, end: cursor + 1 };
        if (source[cursor] !== ":") return null;
        cursor += 1;
      }
      return readFormatSpec(source, cursor, limit, tokens);
    }
    tokens.push(token);
  }
  return null;
}

function readFormatSpec(
  source: string,
  from: number,
  limit: number,
  tokens: Token[],
): { tokens: Token[]; end: number } | null {
  let cursor = from;
  while (cursor < limit) {
    if (source[cursor] === "}") return { tokens, end: cursor + 1 };
    if (source[cursor] === "{") {
      const nested = readReplacementField(source, cursor + 1, limit);
      if (!nested) return null;
      tokens.push(...nested.tokens);
      cursor = nested.end;
      continue;
    }
    cursor += 1;
  }
  return null;
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

/** Double-quoted bodies share JSON's escapes (what `compile` emits);
 *  single-quoted ones only when trivially convertible. */
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

/** `patient.age` → `patient["age"]`. Inside an f-string body keys are
 *  single-quoted: same-quote reuse in replacement fields needs Python 3.12. */
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

function isOp(token: Token | undefined, value: string): boolean {
  return token?.kind === "op" && token.value === value;
}

/** `ident ( "[" string "]" )*` → dotted path. */
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
 * The structured reading of a stored condition, or null when it is outside
 * the canonical subset the editor emits. `True` reads as "no rules".
 */
export function parseCondition(expression: string): ParsedCondition | null {
  const tokens = tokenize(expression);
  if (tokens.length === 0) return null;
  if (
    tokens.some(
      (token) =>
        token.kind === "other" ||
        token.kind === "quoted" ||
        token.kind === "fstring",
    )
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

/** Reads a `{{ … }}` param: a bare ref, a custom expression, or null for a
 *  plain literal. */
export function parseTemplate(value: unknown): ParsedTemplate | null {
  if (typeof value !== "string") return null;
  // Untrimmed on purpose: the backend's check is on the raw value.
  const match = /^\{\{([\s\S]*)\}\}$/.exec(value);
  if (!match) return null;
  const inner = match[1].trim();
  const tokens = tokenize(inner);
  const ref = tokens.length > 0 ? readRef(tokens, 0) : null;
  if (ref && ref.next === tokens.length) return { kind: "ref", ref: ref.ref };
  return { kind: "expression", expression: inner };
}

// ---------------------------------------------------------------------------
// Message templates: editor text with `{ref}` tokens ↔ `{{ f"…" }}` params

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

/** Editor text → stored param value. Token-free text is stored verbatim. */
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

const FSTRING_ESCAPES: Record<string, string> = {
  '"': '"',
  "'": "'",
  "\\": "\\",
  n: "\n",
  r: "\r",
  t: "\t",
};

/** One f-string body → editor text, or undefined when it holds anything
 *  (a non-ref field, an escape) a re-save would not reproduce byte-for-byte. */
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
    if (char === "\\") {
      const decoded = FSTRING_ESCAPES[body[cursor + 1] ?? ""];
      if (decoded === undefined) return undefined;
      text += decoded;
      cursor += 2;
      continue;
    }
    text += char;
    cursor += 1;
  }
  return text;
}

/** Stored param value → editor text, or the raw expression when the token
 *  editor cannot show it. */
export function parseMessageTemplate(value: unknown): ParsedMessageTemplate {
  if (typeof value !== "string") return { kind: "text", text: "" };
  const template = parseTemplate(value);
  if (!template) return { kind: "text", text: value };
  if (template.kind === "ref") {
    return { kind: "text", text: messageToken(template.ref) };
  }
  const tokens = tokenize(template.expression);
  const raw = template.expression;
  if (
    tokens.length === 1 &&
    tokens[0].kind === "fstring" &&
    /^[fF]["']/.test(raw)
  ) {
    const text = decodeFStringBody(raw.slice(2, -1));
    if (text !== undefined) return { kind: "text", text };
  }
  return { kind: "expression", expression: template.expression };
}

// ---------------------------------------------------------------------------
// Lint (the backend validates nothing at save time; a typo would 500 on
// every submission)

export type ExpressionProblem = "syntax" | "attribute";

/**
 * Cheap static checks: stray characters, unbalanced brackets, list/tuple
 * literals (`,` has no place in the grammar), and attribute access.
 */
export function lintExpression(expression: string): ExpressionProblem | null {
  const tokens = [...walkTokens(tokenize(expression))];
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
  for (const token of tokens) {
    if (token.kind === "other") return "syntax";
    if (token.kind === "op") {
      const opensLiteral =
        token.value === "[" &&
        !(
          previous &&
          ((previous.kind === "op" &&
            (previous.value === "]" || previous.value === ")")) ||
            (previous.kind === "ident" && !isKeyword(previous.value)))
        );
      if (opensLiteral || token.value === ",") return "syntax";
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
 * non-identifier characters become `_`, with a numeric suffix on collision.
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

/** Every `q_<link_id>` name an expression reads, canonical or not. */
export function referencedLinkIds(expression: string): string[] {
  const seen = new Set<string>();
  for (const token of walkTokens(tokenize(expression))) {
    if (token.kind !== "ident") continue;
    const linkId = linkIdOfRef(token.value);
    if (linkId) seen.add(linkId);
  }
  return [...seen];
}

/** Rewrites `q_<old>` names per `linkIdMap`; everything else stays byte-identical. */
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

function remapTemplateParam(
  value: unknown,
  linkIdMap: ReadonlyMap<string, string>,
): unknown {
  if (typeof value !== "string") return value;
  const match = /^(\s*\{\{)([\s\S]*)(\}\}\s*)$/.exec(value);
  if (!match) return value;
  return match[1] + remapQuestionRefs(match[2], linkIdMap) + match[3];
}

/** Every answer reference inside an action: its condition plus templated params. */
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

/** Clone support: follow a link_id map through every condition and templated param. */
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
