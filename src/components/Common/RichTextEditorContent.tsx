import {
  addTopAreaChild$,
  createRootEditorSubscription$,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  realmPlugin,
  thematicBreakPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RichTextEditorProps } from "@/components/Common/RichTextEditor";
import { RichTextEditorToolbar } from "@/components/Common/RichTextEditorToolbar";
import { Textarea } from "@/components/ui/textarea";

const careToolbarPlugin = realmPlugin({
  init(realm) {
    realm.pub(addTopAreaChild$, RichTextEditorToolbar);
    realm.pub(createRootEditorSubscription$, (editor) =>
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (
            !(event instanceof KeyboardEvent) ||
            event.isComposing ||
            editor.isComposing()
          )
            return false;
          const root = editor.getRootElement();
          const domSelection = root?.ownerDocument.getSelection();
          const selection = $getSelection();
          if (
            root &&
            root.ownerDocument.activeElement === root &&
            domSelection?.isCollapsed &&
            domSelection.rangeCount > 0 &&
            root.contains(domSelection.anchorNode) &&
            root.contains(domSelection.focusNode) &&
            $isRangeSelection(selection) &&
            !selection.isCollapsed()
          ) {
            // Arrow keys can move the native caret before selectionchange
            // reaches Lexical. Enter must use that caret, not an older range.
            const nextSelection = selection.clone();
            nextSelection.applyDOMRange(domSelection.getRangeAt(0));
            if (!selection.is(nextSelection)) $setSelection(nextSelection);
          }
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  },
});

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
        <p role="status" className="text-sm text-muted-foreground">
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
    <div className="rounded-lg border border-input bg-background">
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
        contentEditableClassName="prose prose-sm min-h-32 max-w-none px-3! py-2! text-foreground wrap-break-word focus:outline-none prose-p:my-2 prose-li:my-0 prose-ul:my-2 prose-ol:my-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
        toMarkdownOptions={{ bullet: "-" }}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          careToolbarPlugin(),
        ]}
      />
    </div>
  );
}
