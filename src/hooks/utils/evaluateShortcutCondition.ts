import type { ShortcutConditions } from "@/hooks/useKeyboardShortcuts";

/**
 * The safe evaluator for the `when` clause of a keyboard shortcut.
 *
 * The evaluator accepts only this grammar:
 * - the literal `always`
 * - the literals `true` and `false`
 * - an identifier that names a key in {@link ShortcutConditions}
 * - the operators `!`, `&&` and `||`
 * - parentheses
 *
 * The evaluator reads each value from the conditions object. It never builds a
 * string of code. It never calls `eval` or `new Function`. Thus an unsafe value
 * in the conditions object cannot inject code.
 *
 * If the clause contains a token that is not in the grammar, the evaluator
 * writes a warning and returns `false`.
 */

type Token =
  | { type: "identifier"; value: string }
  | { type: "not" }
  | { type: "and" }
  | { type: "or" }
  | { type: "open" }
  | { type: "close" };

const DEFAULT_CONDITIONS = {
  canEdit: false,
  canCreate: false,
  readOnly: false,
  questionnairesEnabled: false,
};

class ShortcutConditionError extends Error {}

/** Splits the clause into tokens. Throws if the clause has an unknown token. */
function tokenize(clause: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < clause.length) {
    const character = clause[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ type: "open" });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ type: "close" });
      index += 1;
      continue;
    }

    if (character === "!") {
      tokens.push({ type: "not" });
      index += 1;
      continue;
    }

    if (clause.startsWith("&&", index)) {
      tokens.push({ type: "and" });
      index += 2;
      continue;
    }

    if (clause.startsWith("||", index)) {
      tokens.push({ type: "or" });
      index += 2;
      continue;
    }

    const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(clause.slice(index));
    if (identifier) {
      tokens.push({ type: "identifier", value: identifier[0] });
      index += identifier[0].length;
      continue;
    }

    throw new ShortcutConditionError(
      `Unknown character "${character}" at position ${index}.`,
    );
  }

  return tokens;
}

/**
 * Reads the value of one identifier.
 * Throws if the identifier is not a key of the conditions.
 */
function readIdentifier(name: string, conditions: ShortcutConditions): boolean {
  if (name === "true") return true;
  if (name === "false") return false;

  if (Object.prototype.hasOwnProperty.call(conditions, name)) {
    return Boolean(conditions[name]);
  }

  if (Object.prototype.hasOwnProperty.call(DEFAULT_CONDITIONS, name)) {
    return DEFAULT_CONDITIONS[name as keyof typeof DEFAULT_CONDITIONS];
  }

  throw new ShortcutConditionError(`Unknown condition "${name}".`);
}

/**
 * Reads the tokens and calculates the result.
 * The parser goes down through `||`, then `&&`, then `!`, then a value.
 */
function parse(tokens: Token[], conditions: ShortcutConditions): boolean {
  let position = 0;

  function peek(): Token | undefined {
    return tokens[position];
  }

  function parseValue(): boolean {
    const token = tokens[position];

    if (!token) {
      throw new ShortcutConditionError("The clause stops too early.");
    }

    if (token.type === "not") {
      position += 1;
      return !parseValue();
    }

    if (token.type === "open") {
      position += 1;
      const result = parseOr();
      const next = tokens[position];
      if (!next || next.type !== "close") {
        throw new ShortcutConditionError("A closed parenthesis is missing.");
      }
      position += 1;
      return result;
    }

    if (token.type === "identifier") {
      position += 1;
      return readIdentifier(token.value, conditions);
    }

    throw new ShortcutConditionError(
      "The clause has an operator in a wrong place.",
    );
  }

  function parseAnd(): boolean {
    let result = parseValue();
    while (peek()?.type === "and") {
      position += 1;
      const right = parseValue();
      result = result && right;
    }
    return result;
  }

  function parseOr(): boolean {
    let result = parseAnd();
    while (peek()?.type === "or") {
      position += 1;
      const right = parseAnd();
      result = result || right;
    }
    return result;
  }

  const result = parseOr();

  if (position !== tokens.length) {
    throw new ShortcutConditionError("The clause has extra tokens at the end.");
  }

  return result;
}

/**
 * Calculates the `when` clause of a keyboard shortcut.
 *
 * @param whenClause The clause from the shortcut configuration.
 * @param conditions The current conditions of the screen.
 * @returns `true` if the shortcut is active. `false` if it is not active, or if
 * the clause is not valid.
 */
export function evaluateShortcutCondition(
  whenClause: string,
  conditions: ShortcutConditions,
): boolean {
  const clause = whenClause.trim();

  if (clause === "always") return true;

  try {
    return parse(tokenize(clause), conditions);
  } catch (error) {
    console.warn(
      `Failed to evaluate shortcut condition: ${whenClause}`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
