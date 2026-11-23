declare module "markdown-it-mark" {
  import type { MarkdownIt } from "markdown-it";

  const markdownItMark: (md: MarkdownIt) => void;
  export default markdownItMark;
}

declare module "markdown-it-task-lists" {
  import type { MarkdownIt } from "markdown-it";

  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const markdownItTaskLists: (
    md: MarkdownIt,
    options?: TaskListOptions,
  ) => void;
  export default markdownItTaskLists;
}
