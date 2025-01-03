import MarkdownIt from "markdown-it";
import * as React from "react";

import { cn } from "@/lib/utils";

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  quotes: ['""', "''"],
});

export interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  /**
   * Whether to wrap the content in article tags with prose styling
   * @default true
   */
  prose?: boolean;
}

const Markdown = React.forwardRef<HTMLDivElement, MarkdownProps>(
  ({ className, content, prose = true, ...props }, ref) => {
    const html = React.useMemo(() => md.render(content), [content]);

    if (prose) {
      return (
        <article
          ref={ref}
          className={cn("prose max-w-none dark:prose-invert", className)}
          dangerouslySetInnerHTML={{ __html: html }}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
        {...props}
      />
    );
  },
);
Markdown.displayName = "Markdown";

export { Markdown };
