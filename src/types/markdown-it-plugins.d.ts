declare module "markdown-it-mark" {
  import type { PluginSimple } from "markdown-it";

  const markdownItMark: PluginSimple;
  export default markdownItMark;
}

declare module "markdown-it-task-lists" {
  import type { PluginWithOptions } from "markdown-it";

  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const markdownItTaskLists: PluginWithOptions<TaskListOptions>;
  export default markdownItTaskLists;
}
