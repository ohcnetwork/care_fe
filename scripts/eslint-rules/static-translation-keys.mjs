/**
 * ESLint rule: do not construct translation keys at runtime.
 *
 * Keys passed to `t()` / `i18n.t()` / `i18next.t()` or to a `<Trans i18nKey>`
 * prop must not be built from template literals with expressions or from
 * string concatenation. A built key never appears literally in the source, so
 * `scripts/check-locale.mjs` cannot tell that it is used and would flag (or
 * delete) it as unused.
 *
 * Instead of
 *   t(`status__${status}`)
 * write an explicit lookup so every key appears literally in the source:
 *   const LABELS = {
 *     active: t("status__active"),
 *     inactive: t("status__inactive"),
 *   } satisfies Record<Status, string>;
 *
 * Passing a variable (`t(item.title)`) is allowed because its value is a
 * string defined somewhere else in the source, where the locale check sees
 * it. Plural keys use `t("items", { count })`; en.json holds `items_one` /
 * `items_other`, and only the base key has to be static.
 */

const TRANSLATION_OBJECTS = new Set(["i18n", "i18next"]);

function unwrap(node) {
  let current = node;
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "TSSatisfiesExpression" ||
      current.type === "ChainExpression")
  ) {
    current = current.expression;
  }
  return current;
}

/** True when the key is assembled at runtime from several parts. */
function isConstructedKey(node) {
  const n = unwrap(node);
  if (!n) return false;
  switch (n.type) {
    case "TemplateLiteral":
      return n.expressions.length > 0;
    case "BinaryExpression":
      return n.operator === "+";
    case "ConditionalExpression":
      return isConstructedKey(n.consequent) || isConstructedKey(n.alternate);
    case "LogicalExpression":
      return isConstructedKey(n.left) || isConstructedKey(n.right);
    default:
      return false;
  }
}

function isTranslationCall(callee) {
  if (callee.type === "Identifier") return callee.name === "t";
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === "t" &&
    callee.object.type === "Identifier"
  ) {
    return TRANSLATION_OBJECTS.has(callee.object.name);
  }
  return false;
}

const MESSAGE =
  "Do not build translation keys at runtime (template literal or concatenation): the keys never appear literally, so unused-key detection cannot see them. Use a lookup object whose values are literal t(...) calls, e.g. { open: t('status__open') } satisfies Record<Status, string>.";

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow constructing translation keys passed to t() / i18nKey at runtime",
    },
    schema: [],
    messages: { dynamicKey: MESSAGE },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isTranslationCall(node.callee)) return;
        const [key] = node.arguments;
        if (!key || key.type === "SpreadElement") return;
        if (isConstructedKey(key)) {
          context.report({ node: key, messageId: "dynamicKey" });
        }
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "i18nKey")
          return;
        const value = node.value;
        if (
          value &&
          value.type === "JSXExpressionContainer" &&
          value.expression.type !== "JSXEmptyExpression" &&
          isConstructedKey(value.expression)
        ) {
          context.report({ node: value, messageId: "dynamicKey" });
        }
      },
    };
  },
};
