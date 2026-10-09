import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ALWAYS_CONDITION,
  actionReferencedLinkIds,
  compileCondition,
  compileMessageTemplate,
  compileTemplate,
  isIdentifierSafeLinkId,
  linkIdOfRef,
  lintExpression,
  messageTokens,
  parseCondition,
  parseMessageTemplate,
  parseTemplate,
  referenceableLinkId,
  referencedLinkIds,
  remapActionLinkIds,
  remapQuestionRefs,
} from "./actionExpression";

describe("compileCondition", () => {
  it("emits True for no rules — an empty condition never fires", () => {
    assert.equal(compileCondition([], "all"), ALWAYS_CONDITION);
    assert.equal(compileCondition([], "any"), "True");
  });

  it("compiles every value shape the backend's cleaned answers take", () => {
    assert.equal(
      compileCondition(
        [
          { ref: "q_fever", operator: "==", value: true },
          { ref: "q_temp", operator: ">", value: 38.5 },
          { ref: "q_severity", operator: "!=", value: "severe" },
          { ref: "q_symptoms", operator: "in", value: "rash" },
          { ref: "q_symptoms", operator: "not in", value: "cough" },
          { ref: "q_count", operator: "<=", value: -2 },
        ],
        "all",
      ),
      'q_fever == True and q_temp > 38.5 and q_severity != "severe" and "rash" in q_symptoms and "cough" not in q_symptoms and q_count <= -2',
    );
  });

  it("compiles context paths as subscript chains (evalidate rejects attribute access)", () => {
    assert.equal(
      compileCondition(
        [{ ref: "patient.age", operator: ">=", value: 18 }],
        "any",
      ),
      'patient["age"] >= 18',
    );
  });

  it("addresses record answers (quantities, coded choices) through their value key", () => {
    const expression = compileCondition(
      [{ ref: "q_weight.value", operator: ">", value: 50 }],
      "all",
    );
    assert.equal(expression, 'q_weight["value"] > 50');
    assert.deepEqual(parseCondition(expression), {
      rules: [{ ref: "q_weight.value", operator: ">", value: 50 }],
      behavior: "all",
    });
    assert.deepEqual(referencedLinkIds(expression), ["weight"]);
  });

  it("joins with or for any-behaviour", () => {
    assert.equal(
      compileCondition(
        [
          { ref: "q_a", operator: "==", value: "x" },
          { ref: "q_b", operator: "==", value: "y" },
        ],
        "any",
      ),
      'q_a == "x" or q_b == "y"',
    );
  });

  it("JSON-quotes strings so quotes and backslashes survive", () => {
    assert.equal(
      compileCondition(
        [{ ref: "q_note", operator: "==", value: 'say "hi"\\now' }],
        "all",
      ),
      'q_note == "say \\"hi\\"\\\\now"',
    );
  });
});

describe("parseCondition", () => {
  it("round-trips everything compileCondition emits", () => {
    const rules = [
      { ref: "q_fever", operator: "==" as const, value: true },
      { ref: "patient.age", operator: ">=" as const, value: 18 },
      { ref: "q_severity", operator: "!=" as const, value: 'se"vere' },
      { ref: "q_symptoms", operator: "in" as const, value: "rash" },
      { ref: "q_symptoms", operator: "not in" as const, value: "cough" },
      { ref: "q_temp", operator: "<" as const, value: -0.5 },
    ];
    for (const behavior of ["all", "any"] as const) {
      const parsed = parseCondition(compileCondition(rules, behavior));
      assert.deepEqual(parsed, { rules, behavior });
    }
  });

  it("reads True as no rules", () => {
    assert.deepEqual(parseCondition("True"), { rules: [], behavior: "all" });
    assert.deepEqual(parseCondition("  True  "), {
      rules: [],
      behavior: "all",
    });
  });

  it("accepts single-quoted strings and loose whitespace a human typed", () => {
    assert.deepEqual(parseCondition("q_a=='x'   and   q_b >= 3"), {
      rules: [
        { ref: "q_a", operator: "==", value: "x" },
        { ref: "q_b", operator: ">=", value: 3 },
      ],
      behavior: "all",
    });
  });

  it("returns null for anything outside the canonical subset", () => {
    for (const expression of [
      "",
      "   ",
      "q_a == 'x' and q_b == 'y' or q_c == 'z'", // mixed connectives
      "(q_a == 'x')", // parentheses
      "q_temp * 2 > 70", // arithmetic
      "not q_flag", // unary
      "q_flag", // bare truthiness
      'q_a == "unterminated',
      "q_a == None",
      "q_a in ['x', 'y']", // list literal (evalidate rejects it too)
      "patient.age > 18", // attribute access (evalidate rejects it)
      'patient["not an ident"] > 1',
      "q_a ==",
      'f"{q_a}" == "x"',
      'q_a == "x" == "y"',
    ]) {
      assert.equal(parseCondition(expression), null, expression);
    }
  });
});

describe("templates", () => {
  it("compiles a whole-value template the backend evaluates", () => {
    assert.equal(compileTemplate("q_temp"), "{{ q_temp }}");
    assert.equal(compileTemplate("patient.age"), '{{ patient["age"] }}');
  });

  it("parses refs, custom expressions and plain literals apart", () => {
    assert.deepEqual(parseTemplate("{{ q_temp }}"), {
      kind: "ref",
      ref: "q_temp",
    });
    assert.deepEqual(parseTemplate('{{patient["age"]}}'), {
      kind: "ref",
      ref: "patient.age",
    });
    assert.deepEqual(parseTemplate('{{ f"temp {q_temp}" }}'), {
      kind: "expression",
      expression: 'f"temp {q_temp}"',
    });
    assert.equal(parseTemplate("plain text"), null);
    assert.equal(parseTemplate(42), null);
    assert.equal(parseTemplate("{{ partial }} text"), null);
    // The backend's check is untrimmed — a leading space means plain text.
    assert.equal(parseTemplate(" {{ q_temp }}"), null);
  });
});

describe("references", () => {
  it("lists q_ names, ignoring string literals and context refs", () => {
    assert.deepEqual(
      referencedLinkIds('q_a == "q_not_a_ref" and patient["age"] > q_b'),
      ["a", "b"],
    );
    assert.deepEqual(referencedLinkIds('f"{q_temp} and {q_temp}"'), ["temp"]);
  });

  it("collects references from the condition and templated params", () => {
    assert.deepEqual(
      actionReferencedLinkIds({
        condition: "q_fever == True",
        instructions: [
          {
            params: {
              message: '{{ f"temp {q_temp}" }}',
              other: "{{ q_note }}",
              literal: "q_ignored",
            },
          },
        ],
      }).sort(),
      ["fever", "note", "temp"],
    );
  });

  it("identifies identifier-safe link ids", () => {
    assert.equal(isIdentifierSafeLinkId("fever_1"), true);
    assert.equal(isIdentifierSafeLinkId("123"), true);
    assert.equal(isIdentifierSafeLinkId("Q-abc12345"), false);
    assert.equal(isIdentifierSafeLinkId("has space"), false);
    assert.equal(isIdentifierSafeLinkId(""), false);
    assert.equal(linkIdOfRef("q_fever"), "fever");
    assert.equal(linkIdOfRef("q_weight.value"), "weight");
    assert.equal(linkIdOfRef("patient.age"), undefined);
  });
});

describe("remapping", () => {
  const map = new Map([
    ["fever", "Q-new1"],
    ["temp", "Q-new2"],
  ]);

  it("rewrites only q_ names, leaving literals and unknown names alone", () => {
    assert.equal(
      remapQuestionRefs(
        'q_fever == "q_fever" and q_temp > 1 and q_other == 2',
        map,
      ),
      'q_Q-new1 == "q_fever" and q_Q-new2 > 1 and q_other == 2',
    );
  });

  it("follows the map through conditions and templated params of every action", () => {
    const [action] = remapActionLinkIds(
      [
        {
          condition: "q_fever == True",
          instructions: [
            {
              slug: "logging",
              context: "self",
              params: {
                message: '{{ f"temp {q_temp}" }}',
                plain: "q_temp stays",
                count: 3,
              },
            },
          ],
        },
      ],
      map,
    );
    assert.equal(action.condition, "q_Q-new1 == True");
    assert.deepEqual(action.instructions[0].params, {
      message: '{{ f"temp {q_Q-new2}" }}',
      plain: "q_temp stays",
      count: 3,
    });
  });
});

describe("message templates", () => {
  it("stores token-free text verbatim", () => {
    assert.equal(
      compileMessageTemplate("Plain {not a token 1}"),
      "Plain {not a token 1}",
    );
    assert.deepEqual(parseMessageTemplate("Plain"), {
      kind: "text",
      text: "Plain",
    });
    assert.deepEqual(parseMessageTemplate(undefined), {
      kind: "text",
      text: "",
    });
  });

  it("compiles tokens to a whole-value f-string and reads it back", () => {
    const text =
      'Fever, temp {q_temp} "high" \\ {patient.age}y {not a token} 100%';
    const compiled = compileMessageTemplate(text);
    assert.equal(
      compiled,
      `{{ f"Fever, temp {q_temp} \\"high\\" \\\\ {patient['age']}y {{not a token}} 100%" }}`,
    );
    assert.deepEqual(parseMessageTemplate(compiled), { kind: "text", text });
    assert.deepEqual(referencedLinkIds(compiled), ["temp"]);
  });

  it("shows a bare ref template as a single token", () => {
    assert.deepEqual(parseMessageTemplate("{{ q_temp }}"), {
      kind: "text",
      text: "{q_temp}",
    });
    assert.equal(compileMessageTemplate("{q_temp}"), '{{ f"{q_temp}" }}');
  });

  it("hands anything else to the expression editor", () => {
    assert.deepEqual(parseMessageTemplate('{{ f"{q_temp * 2}" }}'), {
      kind: "expression",
      expression: 'f"{q_temp * 2}"',
    });
    assert.deepEqual(parseMessageTemplate("{{ q_temp + 1 }}"), {
      kind: "expression",
      expression: "q_temp + 1",
    });
  });

  it("lists tokens", () => {
    assert.deepEqual(messageTokens("a {q_x} b {patient.age} {bad-token}"), [
      "q_x",
      "patient.age",
    ]);
  });
});

describe("lintExpression", () => {
  it("flags attribute access, stray characters and unbalanced brackets", () => {
    assert.equal(lintExpression('q_a == "x" and patient["age"] > 1'), null);
    assert.equal(lintExpression('f"{q_a}" == "x"'), null);
    assert.equal(lintExpression("patient.age > 1"), "attribute");
    assert.equal(lintExpression('q_a == "unterminated'), "syntax");
    assert.equal(lintExpression("q_a == 1;"), "syntax");
    assert.equal(lintExpression("(q_a == 1"), "syntax");
    assert.equal(lintExpression("q_a == 1)"), "syntax");
    assert.equal(lintExpression('patient["age"]] > 1'), "syntax");
    assert.equal(lintExpression("q_a is None"), "syntax");
    assert.equal(lintExpression('q_a in ["x", "y"]'), "syntax");
    assert.equal(lintExpression("q_a == (1)"), null);
    assert.equal(lintExpression('(q_a == 1) and q_b["k"] > 2'), null);
  });
});

describe("referenceableLinkId", () => {
  it("sanitizes and de-duplicates", () => {
    const taken = new Set(["Q_abc12345", "Q_abc12345_2", "fever"]);
    assert.equal(referenceableLinkId("Q-abc12345", taken), "Q_abc12345_3");
    assert.equal(referenceableLinkId("has space!", taken), "has_space_");
    assert.equal(referenceableLinkId("fever", taken), "fever");
    assert.equal(referenceableLinkId("---", new Set()), "___");
    assert.equal(referenceableLinkId("", new Set()), "Q");
  });
});
