import {
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RichTextEditorProps } from "@/components/Common/RichTextEditor";
import { RichTextEditorToolbar } from "@/components/Common/RichTextEditorToolbar";
import { Textarea } from "@/components/ui/textarea";

export default function RichTextEditorContent({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const editor = useRef<MDXEditorMethods>(null);
  const [initialValue] = useState(value);
  const lastValue = useRef(value);
  const [hasParseError, setHasParseError] = useState(false);

  useEffect(() => {
    if (lastValue.current !== value) {
      lastValue.current = value;
      editor.current?.setMarkdown(value);
    }
  }, [value]);

  if (hasParseError) {
    return (
      <div className="space-y-2">
        <p role="status" className="text-sm text-gray-600">
          {t("rich_text_plain_text_fallback")}
        </p>
        <Textarea
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-32"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white focus-within:border-gray-500">
      <MDXEditor
        ref={editor}
        markdown={initialValue}
        onChange={(markdown, initialMarkdownNormalize) => {
          if (disabled || initialMarkdownNormalize) return;
          lastValue.current = markdown;
          onChange(markdown);
        }}
        onError={() => setHasParseError(true)}
        readOnly={disabled}
        placeholder={placeholder}
        suppressHtmlProcessing
        translation={(key, defaultValue, interpolations) =>
          key === "contentArea.editableMarkdown"
            ? label
            : t(`rich_text_editor.${key}`, {
                defaultValue,
                ...interpolations,
              })
        }
        className="font-sans! [--font-body:var(--font-sans)]"
        contentEditableClassName="prose prose-sm min-h-32 max-w-none px-3! py-2! text-gray-950 wrap-break-word focus:outline-none prose-p:my-2 prose-li:my-0 prose-ul:my-2 prose-ol:my-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
        toMarkdownOptions={{ bullet: "-" }}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarClassName:
              "flex-nowrap! gap-1! rounded-t-lg! rounded-b-none! border-b border-gray-200 bg-gray-50! p-1.5! md:flex-wrap!",
            toolbarContents: () =>
              disabled ? null : <RichTextEditorToolbar />,
          }),
        ]}
      />
    </div>
  );
}
