import assert from "node:assert/strict";
import { test } from "node:test";

import { richTextToPrint } from "@/print/richText";
import type { PrintTextMark } from "@/print/types";

const text = (value: string, marks: PrintTextMark[] = [], link = null) => ({
  kind: "text" as const,
  text: value,
  marks,
  link,
});
const paragraph = (...runs: ReturnType<typeof text>[]) => ({
  kind: "paragraph" as const,
  runs,
});

test("richTextToPrint: the editor's formats become styled runs, not symbols", () => {
  // As the rich-text editor saves it.
  const markdown =
    "<u>***dfsh usdujhfjasjfd hdsj fhjsd fjdhfajs***</u>\n\n*dvsdadsfs*&#x20;\n\nddsfdsfs\n========";

  assert.deepEqual(richTextToPrint(markdown), [
    paragraph(
      text("dfsh usdujhfjasjfd hdsj fhjsd fjdhfajs", [
        "bold",
        "italic",
        "underline",
      ]),
    ),
    paragraph(text("dvsdadsfs", ["italic"])),
    { kind: "heading", level: 1, runs: [text("ddsfdsfs")] },
  ]);
});

test("richTextToPrint: lists keep their nesting and task checkboxes", () => {
  const markdown =
    "- plain\n  - nested\n- [x] done\n- [ ] to do\n\n3. third\n4. fourth";

  assert.deepEqual(richTextToPrint(markdown), [
    {
      kind: "list",
      ordered: false,
      start: 1,
      items: [
        {
          checked: null,
          blocks: [
            paragraph(text("plain")),
            {
              kind: "list",
              ordered: false,
              start: 1,
              items: [{ checked: null, blocks: [paragraph(text("nested"))] }],
            },
          ],
        },
        { checked: true, blocks: [paragraph(text("done"))] },
        { checked: false, blocks: [paragraph(text("to do"))] },
      ],
    },
    {
      kind: "list",
      ordered: true,
      start: 3,
      items: [
        { checked: null, blocks: [paragraph(text("third"))] },
        { checked: null, blocks: [paragraph(text("fourth"))] },
      ],
    },
  ]);
});

test("richTextToPrint: other HTML stays literal and unbalanced underline is safe", () => {
  assert.deepEqual(richTextToPrint("<b>bold?</b> and <u>under</u></u> end"), [
    paragraph(
      text("<b>bold?</b> and "),
      text("under", ["underline"]),
      text(" end"),
    ),
  ]);
});

test("richTextToPrint: highlight, strikethrough, links, quotes, rules and line breaks", () => {
  assert.deepEqual(
    richTextToPrint(
      "==marked== ~~gone~~ [CARE](https://care.ohc.network)\nnext line\n\n> quoted\n\n---",
    ),
    [
      {
        kind: "paragraph",
        runs: [
          text("marked", ["highlight"]),
          text(" "),
          text("gone", ["strike"]),
          text(" "),
          {
            kind: "text",
            text: "CARE",
            marks: [],
            link: "https://care.ohc.network",
          },
          { kind: "break" },
          text("next line"),
        ],
      },
      { kind: "quote", blocks: [paragraph(text("quoted"))] },
      { kind: "rule" },
    ],
  );
});

test("richTextToPrint: empty or formatting-only Markdown prints nothing", () => {
  for (const markdown of [null, undefined, "", "   ", "- [ ] ", "#", "---"]) {
    assert.deepEqual(richTextToPrint(markdown), [], JSON.stringify(markdown));
  }
});
