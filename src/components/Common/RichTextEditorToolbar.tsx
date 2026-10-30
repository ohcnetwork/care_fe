import {
  activeEditor$,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  HighlightToggle,
  iconComponentFor$,
  ListsToggle,
  MultipleChoiceToggleGroup,
  Separator,
} from "@mdxeditor/editor";
import { useCellValues } from "@mdxeditor/gurx";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { Heading, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

export function RichTextEditorToolbar() {
  const { t } = useTranslation();
  const [activeEditor, iconComponentFor] = useCellValues(
    activeEditor$,
    iconComponentFor$,
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isApple = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // History commands can fire while More is closed, so subscribe here instead
  // of mounting the subscription with the popover controls.
  useEffect(() => {
    if (!activeEditor) return;

    const unregisterUndo = activeEditor.registerCommand(
      CAN_UNDO_COMMAND,
      (available) => {
        setCanUndo(available);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
    const unregisterRedo = activeEditor.registerCommand(
      CAN_REDO_COMMAND,
      (available) => {
        setCanRedo(available);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [activeEditor]);

  return (
    <div className="flex w-full items-center gap-0.5 [&>div]:mx-0!">
      <BoldItalicUnderlineToggles />
      <ListsToggle options={["bullet"]} />
      <div className="relative shrink-0 [&_[role=combobox]]:size-8! [&_[role=combobox]]:min-w-0! [&_[role=combobox]]:justify-center! [&_[role=combobox]]:px-0! [&_[role=combobox]>span]:sr-only">
        <BlockTypeSelect />
        <Heading
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto size-4 text-gray-600"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto size-8 shrink-0 text-gray-600"
            aria-label={t("rich_text_editor.toolbar.moreFormatting")}
          >
            <MoreHorizontal className="size-5" />
          </Button>
        </PopoverTrigger>
        {/* Keep the controls inside MDXEditor's theme and toolbar context. */}
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          aria-label={t("rich_text_editor.toolbar.moreFormatting")}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="z-50 w-fit space-y-3 rounded-lg border border-gray-200 bg-white p-3 shadow-md outline-hidden"
        >
          <MultipleChoiceToggleGroup
            items={[
              {
                title: t("rich_text_editor.toolbar.undo", {
                  shortcut: isApple ? "⌘Z" : "Ctrl+Z",
                }),
                disabled: !canUndo,
                contents: iconComponentFor("undo"),
                active: false,
                onChange: () =>
                  activeEditor?.dispatchCommand(UNDO_COMMAND, undefined),
              },
              {
                title: t("rich_text_editor.toolbar.redo", {
                  shortcut: isApple ? "⌘Y" : "Ctrl+Y",
                }),
                disabled: !canRedo,
                contents: iconComponentFor("redo"),
                active: false,
                onChange: () =>
                  activeEditor?.dispatchCommand(REDO_COMMAND, undefined),
              },
            ]}
          />
          <div className="flex items-center gap-1 border-t border-gray-100 pt-2">
            <HighlightToggle />
            <Separator />
            <ListsToggle options={["number", "check"]} />
          </div>
        </PopoverPrimitive.Content>
      </Popover>
    </div>
  );
}
