import type { Token } from "markdown-it";

import type {
  PrintLabelledRichText,
  PrintRichBlock,
  PrintRichListItem,
  PrintTextMark,
  PrintTextRun,
} from "@/print/types";
import { hasMarkdownContent, richTextMarkdown } from "@/Utils/markdown";

/** The order marks are listed in, so equal formatting compares equal. */
const MARK_ORDER: PrintTextMark[] = [
  "bold",
  "italic",
  "underline",
  "strike",
  "highlight",
];

const INLINE_MARKS: Record<string, PrintTextMark> = {
  strong: "bold",
  em: "italic",
  s: "strike",
  mark: "highlight",
};

const TASK_CHECKBOX = /^<input\b[^>]*\btask-list-item-checkbox\b/;

function isTaskLabel(html: string) {
  return /^<\/?label\b/.test(html);
}

/**
 * Turns an inline token's children into runs. Adjacent runs with the same
 * formatting are merged; the result says whether a task checkbox was found.
 */
function inlineRuns(children: Token[]) {
  const runs: PrintTextRun[] = [];
  const open: Record<PrintTextMark, number> = {
    bold: 0,
    italic: 0,
    underline: 0,
    strike: 0,
    highlight: 0,
    code: 0,
  };
  const links: string[] = [];
  let checked: boolean | null = null;

  const push = (text: string, extra: PrintTextMark[] = []) => {
    if (!text) return;
    const marks = [...MARK_ORDER.filter((mark) => open[mark] > 0), ...extra];
    const link = links.at(-1) ?? null;
    const last = runs.at(-1);
    if (
      last?.kind === "text" &&
      last.link === link &&
      last.marks.join() === marks.join()
    ) {
      last.text += text;
    } else {
      runs.push({ kind: "text", text, marks, link });
    }
  };

  for (const token of children) {
    const [name, edge] = token.type.split(/_(open|close)$/);
    if (edge && INLINE_MARKS[name]) {
      const mark = INLINE_MARKS[name];
      open[mark] = Math.max(0, open[mark] + (edge === "open" ? 1 : -1));
      continue;
    }
    switch (token.type) {
      case "text":
        push(token.content);
        break;
      case "code_inline":
        push(token.content, ["code"]);
        break;
      case "softbreak":
      case "hardbreak":
        runs.push({ kind: "break" });
        break;
      case "link_open":
        links.push(String(token.attrGet("href") ?? ""));
        break;
      case "link_close":
        links.pop();
        break;
      case "image":
        push(token.content);
        break;
      case "html_inline": {
        // With `html: false`, only these reach here: the editor's underline
        // tags and the task-list plugin's checkbox in its label.
        const html = token.content;
        if (html === "<u>" || html === "</u>") {
          open.underline = Math.max(
            0,
            open.underline + (html === "<u>" ? 1 : -1),
          );
        } else if (TASK_CHECKBOX.test(html)) {
          checked = /\bchecked\b/.test(html);
        } else if (!isTaskLabel(html)) {
          push(html);
        }
        break;
      }
    }
  }

  // The plugin leaves a space between the checkbox and the item's text, and a
  // trailing `&#x20;` decodes to a space: trim the paragraph's ends.
  const first = runs[0];
  if (first?.kind === "text") first.text = first.text.trimStart();
  const last = runs.at(-1);
  if (last?.kind === "text") last.text = last.text.trimEnd();
  return {
    runs: runs.filter((run) => run.kind === "break" || run.text !== ""),
    checked,
  };
}

interface Container {
  blocks: PrintRichBlock[];
  item?: PrintRichListItem;
}

/**
 * Parses Markdown from the rich-text editor into blocks `care.typ` can draw,
 * with the same parser the app displays it with (`richTextMarkdown`). Typst
 * never evaluates the text; HTML other than the editor's underline stays
 * literal, as on screen. Empty or formatting-only Markdown gives `[]`.
 */
export function richTextToPrint(
  markdown: string | null | undefined,
): PrintRichBlock[] {
  if (!markdown || !hasMarkdownContent(markdown)) return [];

  const root: Container = { blocks: [] };
  const stack: Container[] = [root];
  const lists: Extract<PrintRichBlock, { kind: "list" }>[] = [];
  const current = () => stack[stack.length - 1];
  let row: PrintTextRun[] | null = null;

  const tokens = richTextMarkdown.parse(markdown, {});
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    switch (token.type) {
      case "paragraph_open":
      case "heading_open": {
        const inline = tokens[i + 1];
        if (inline?.type !== "inline") break;
        i += 1;
        const { runs, checked } = inlineRuns(inline.children ?? []);
        const container = current();
        if (checked !== null && container.item) {
          container.item.checked = checked;
        }
        if (runs.length === 0) break;
        container.blocks.push(
          token.type === "heading_open"
            ? { kind: "heading", level: Number(token.tag.slice(1)), runs }
            : { kind: "paragraph", runs },
        );
        break;
      }
      case "bullet_list_open":
      case "ordered_list_open": {
        const list: Extract<PrintRichBlock, { kind: "list" }> = {
          kind: "list",
          ordered: token.type === "ordered_list_open",
          start: Number(token.attrGet("start") ?? 1),
          items: [],
        };
        current().blocks.push(list);
        lists.push(list);
        break;
      }
      case "bullet_list_close":
      case "ordered_list_close":
        lists.pop();
        break;
      case "list_item_open": {
        const item: PrintRichListItem = { checked: null, blocks: [] };
        lists.at(-1)?.items.push(item);
        stack.push({ blocks: item.blocks, item });
        break;
      }
      case "list_item_close":
        stack.pop();
        break;
      case "blockquote_open": {
        const quote: Extract<PrintRichBlock, { kind: "quote" }> = {
          kind: "quote",
          blocks: [],
        };
        current().blocks.push(quote);
        stack.push({ blocks: quote.blocks });
        break;
      }
      case "blockquote_close":
        stack.pop();
        break;
      case "hr":
        current().blocks.push({ kind: "rule" });
        break;
      case "fence":
      case "code_block": {
        // The editor can't make code blocks; typed ones print as plain lines.
        const lines = token.content.replace(/\n$/, "").split("\n");
        const runs: PrintTextRun[] = lines.flatMap((line, n) => [
          ...(n > 0 ? [{ kind: "break" } as const] : []),
          { kind: "text" as const, text: line, marks: [], link: null },
        ]);
        current().blocks.push({ kind: "paragraph", runs });
        break;
      }
      // The editor can't make tables either: print each row as a line.
      case "tr_open":
        row = [];
        break;
      case "th_open":
      case "td_open": {
        const inline = tokens[i + 1];
        if (row && inline?.type === "inline") {
          i += 1;
          if (row.length > 0) {
            row.push({ kind: "text", text: " | ", marks: [], link: null });
          }
          row.push(...inlineRuns(inline.children ?? []).runs);
        }
        break;
      }
      case "tr_close":
        if (row?.length)
          current().blocks.push({ kind: "paragraph", runs: row });
        row = null;
        break;
    }
  }
  return root.blocks;
}

/** `richTextToPrint`, or `null` when there's nothing to print. */
export function richTextOrNull(markdown: string | null | undefined) {
  const blocks = richTextToPrint(markdown);
  return blocks.length > 0 ? blocks : null;
}

/** A labelled rich-text field, or `null` when there's nothing to print. */
export function labelledRichText(
  label: string,
  markdown: string | null | undefined,
): PrintLabelledRichText | null {
  const blocks = richTextOrNull(markdown);
  return blocks ? { label, blocks } : null;
}
