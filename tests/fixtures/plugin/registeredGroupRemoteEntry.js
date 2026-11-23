/**
 * Module federation remote with one registered question group, for Playwright
 * tests of core's registered-group support (builder picker, schema repair,
 * fill rows and submission) without depending on a real plugin such as
 * care_dental_fe.
 *
 * Like `remoteEntry.js`, it mimics the `init` + `get` shape that
 * `@originjs/vite-plugin-federation` expects and reads React from the host
 * share scope. Serve it with `mockRegisteredGroupPlugin()` from
 * `tests/helper/testPlugin.ts`.
 *
 * The group, `care_test_plugin.slot_chart`, records one row per finding:
 * a required `slot` choice (S1–S6) and an optional `type` choice (flag, note).
 * Its input is a brush (Select, Flag, Note) and one toggle button per slot.
 */
let shareScope;

export const init = (scope) => {
  shareScope = scope;
};

async function importShared(name) {
  const entry = Object.values(shareScope[name])[0];
  const module = await (await entry.get())();
  return module.default ?? module;
}

const SLOTS = ["S1", "S2", "S3", "S4", "S5", "S6"];
const FINDINGS = [
  { value: "flag", display: "Flag" },
  { value: "note", display: "Note" },
];

const SCHEMA = [
  {
    link_id: "slot",
    text: "Slot",
    type: "choice",
    required: true,
    answer_option: SLOTS.map((slot) => ({ value: slot, display: slot })),
  },
  {
    link_id: "type",
    text: "Finding",
    type: "choice",
    answer_option: FINDINGS,
  },
];

const choice = (value) => ({
  values: value ? [{ type: "string", value }] : [],
});

function rowValue(row, key) {
  const field = row.fields[key];
  const value =
    field && !field.hidden ? field.response.values[0]?.value : undefined;
  return typeof value === "string" ? value : undefined;
}

/** Rejects two rows with the same slot and finding. */
function validate(question, responses, path) {
  const children = Object.fromEntries(
    (question.questions ?? []).map((child) => [
      child.link_id.slice(question.link_id.length + 2),
      child,
    ]),
  );
  const seen = new Set();
  const errors = [];
  for (const row of responses[question.id]?.sub_results ?? []) {
    const value = (key) =>
      row.find((answer) => answer.question_id === children[key]?.id)?.values[0]
        ?.value;
    const identity = JSON.stringify([value("slot"), value("type")]);
    if (!value("slot")) continue;
    if (seen.has(identity)) {
      errors.push({
        question_id: question.id,
        response_path: path,
        error: "Duplicate finding",
      });
    }
    seen.add(identity);
  }
  return errors;
}

export const get = (name) => {
  if (name !== "./manifest") {
    return Promise.reject(new Error(`Unknown module ${name}`));
  }
  return Promise.resolve(async () => {
    const React = await importShared("react");
    const h = React.createElement;

    const Builder = ({ question, onChange }) =>
      h(
        "label",
        { className: "flex items-center gap-2 text-sm" },
        h("input", {
          type: "checkbox",
          checked: !!question.required,
          onChange: (event) => onChange({ required: event.target.checked }),
        }),
        "Require at least one slot",
      );

    const Input = ({ rows, addRow, disabled }) => {
      const [brush, setBrush] = React.useState("select");
      const toggle = (slot) => {
        const slotRows = rows.filter((row) => rowValue(row, "slot") === slot);
        if (brush === "select") {
          if (slotRows.length) slotRows.forEach((row) => row.remove());
          else addRow({ slot: choice(slot) });
          return;
        }
        const existing = slotRows.find(
          (row) => rowValue(row, "type") === brush,
        );
        if (existing) existing.remove();
        else addRow({ slot: choice(slot), type: choice(brush) });
      };
      return h(
        "div",
        { className: "care-test-plugin-slot-chart space-y-2" },
        h(
          "div",
          {
            role: "radiogroup",
            "aria-label": "Brush",
            className: "flex gap-2",
          },
          [{ value: "select", display: "Select" }, ...FINDINGS].map((option) =>
            h(
              "button",
              {
                key: option.value,
                type: "button",
                role: "radio",
                "aria-checked": brush === option.value,
                onClick: () => setBrush(option.value),
              },
              option.display,
            ),
          ),
        ),
        h(
          "div",
          { className: "flex gap-2" },
          SLOTS.map((slot) =>
            h(
              "button",
              {
                key: slot,
                type: "button",
                "data-chart-slot": slot,
                disabled,
                "aria-pressed": rows.some(
                  (row) => rowValue(row, "slot") === slot,
                ),
                onClick: () => toggle(slot),
              },
              slot,
            ),
          ),
        ),
      );
    };

    return {
      __esModule: true,
      default: {
        plugin: "care_test_plugin",
        routes: {},
        extends: [],
        components: {},
        registeredQuestionGroups: [
          {
            type: "care_test_plugin.slot_chart",
            label: "Slot chart",
            repeats: true,
            subjects: ["encounter", "patient"],
            schema: SCHEMA,
            validate,
            builder: Builder,
            component: Input,
          },
        ],
      },
    };
  });
};
