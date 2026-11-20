import MarkdownIt from "markdown-it";
import markdownItMark from "markdown-it-mark";
import markdownItTaskLists from "markdown-it-task-lists";
import type Token from "markdown-it/lib/token.mjs";

export const richTextMarkdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
})
  .use(markdownItMark)
  .use(markdownItTaskLists, { enabled: false, label: true });

// MDXEditor exports underlining as these exact tags. Keep every other HTML tag
// literal instead of enabling arbitrary HTML in clinical conclusions.
richTextMarkdown.inline.ruler.before(
  "html_inline",
  "underline",
  (state, silent) => {
    const opening = state.src.startsWith("<u>", state.pos);
    const closing = state.src.startsWith("</u>", state.pos);
    if (!opening && !closing) return false;
    if (!silent) {
      state.push("html_inline", "", 0).content = opening ? "<u>" : "</u>";
    }
    state.pos += opening ? 3 : 4;
    return true;
  },
);

function tokensHaveContent(tokens: Token[]): boolean {
  let listItemDepth = 0;
  return tokens.some((token) => {
    if (token.type === "list_item_open") listItemDepth += 1;
    if (token.type === "list_item_close") listItemDepth -= 1;
    // A list containing only a task marker is empty, including the trailing-space
    // form trimmed by MDXEditor before it calls onChange.
    if (
      token.type === "inline" &&
      listItemDepth > 0 &&
      /^\[[ xX]\]\s*$/.test(token.content)
    ) {
      return false;
    }
    if (
      ["text", "code_inline", "code_block", "fence"].includes(token.type) &&
      token.content.trim().length > 0
    ) {
      return true;
    }
    if (token.type === "image" && token.attrGet("src")) {
      return true;
    }
    return token.children ? tokensHaveContent(token.children) : false;
  });
}

/** Formatting-only lists, headings, quotes, and dividers are not report content. */
export function hasMarkdownContent(content: string): boolean {
  return tokensHaveContent(richTextMarkdown.parse(content, {}));
}
