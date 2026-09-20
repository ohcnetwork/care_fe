import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import * as React from "react";

import { cn } from "@/lib/utils";

import { richTextMarkdown } from "@/Utils/markdown";

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
});

export interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  /** Render the supported rich-text editor formats with arbitrary HTML disabled. */
  richText?: boolean;
  /**
   * Whether to wrap the content in article tags with prose styling
   * @default true
   */
  prose?: boolean;
}

function Markdown({
  className,
  content,
  richText = false,
  prose = true,
  ref,
  ...props
}: React.ComponentProps<"div"> & MarkdownProps) {
  const html = React.useMemo(() => {
    const renderedHtml = (richText ? richTextMarkdown : md).render(content);
    return DOMPurify.sanitize(renderedHtml);
  }, [content, richText]);

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
}
Markdown.displayName = "Markdown";

export { Markdown };
