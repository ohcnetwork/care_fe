import { ESLintUtils } from "@typescript-eslint/utils";

export const requireOnInvalidForUseFormReturn = ESLintUtils.RuleCreator(
  () => "",
)({
  name: "require-handleSubmit-onInvalid",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require onInvalid handler when handleSubmit is called on UseFormReturn",
    },
    schema: [],
    messages: {
      missingOnInvalid:
        "form.handleSubmit requires an onInvalid handler when form is UseFormReturn.",
    },
  },
  defaultOptions: [],
  create(context) {
    const services = context.parserServices;
    if (!services?.program || !services?.esTreeNodeToTSNodeMap) {
      return {};
    }

    const checker = services.program.getTypeChecker();

    return {
      JSXAttribute(node) {
        if (node.name.name !== "onSubmit") return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") {
          return;
        }

        const expr = node.value.expression;
        if (
          expr.type !== "CallExpression" ||
          expr.callee.type !== "MemberExpression"
        ) {
          return;
        }

        // form.handleSubmit(...)
        const callee = expr.callee;
        if (callee.property?.type !== "Identifier") return;
        if (callee.property.name !== "handleSubmit") return;

        if (expr.arguments.length >= 2) return;

        // 🔍 Resolve TS type of `form`
        const object = callee.object;
        const tsNode = services.esTreeNodeToTSNodeMap.get(object);

        const type = checker.getTypeAtLocation(tsNode);
        const symbol = type.getSymbol();

        if (!symbol) return;

        const isUseFormReturn =
          symbol.getName() === "UseFormReturn" ||
          checker.typeToString(type).includes("UseFormReturn");

        if (!isUseFormReturn) return;

        context.report({
          node,
          messageId: "missingOnInvalid",
        });
      },
    };
  },
});
