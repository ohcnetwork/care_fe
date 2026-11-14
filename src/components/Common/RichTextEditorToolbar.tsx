import { Toolbar as ToolbarPrimitive } from "@base-ui/react/toolbar";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  activeEditor$,
  applyFormat$,
  applyListType$,
  currentBlockType$,
  currentFormat$,
  currentListType$,
  editorInTable$,
  IS_BOLD,
  IS_HIGHLIGHT,
  IS_ITALIC,
  IS_UNDERLINE,
  readOnly$,
  type BlockType,
} from "@mdxeditor/editor";
import { useCellValues, usePublisher } from "@mdxeditor/gurx";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  REDO_COMMAND,
  UNDO_COMMAND,
  type TextFormatType,
} from "lexical";
import {
  Bold,
  Heading,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  Redo,
  Underline,
  Undo,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { TooltipComponent } from "@/components/ui/tooltip";

export function RichTextEditorToolbar() {
  const { t } = useTranslation();
  const [
    activeEditor,
    currentFormat,
    currentListType,
    currentBlockType,
    inTable,
    readOnly,
  ] = useCellValues(
    activeEditor$,
    currentFormat$,
    currentListType$,
    currentBlockType$,
    editorInTable$,
    readOnly$,
  );
  const applyFormat = usePublisher(applyFormat$);
  const applyListType = usePublisher(applyListType$);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isApple = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Subscribe while More is closed, too: typing changes the history state.
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

  if (readOnly) return null;

  const formatToggle = (
    format: TextFormatType,
    flag: number,
    label: string,
    icon: React.ReactNode,
  ) => (
    <TooltipComponent content={label}>
      <ToolbarPrimitive.Button
        render={
          <Toggle
            pressed={(currentFormat & flag) !== 0}
            onPressedChange={() => applyFormat(format)}
            className="size-8 min-w-8 shrink-0 p-0"
          />
        }
        aria-label={label}
        onMouseDown={(event) => event.preventDefault()}
      >
        {icon}
      </ToolbarPrimitive.Button>
    </TooltipComponent>
  );

  const listToggle = (
    type: "bullet" | "number" | "check",
    label: string,
    icon: React.ReactNode,
  ) => (
    <TooltipComponent content={label}>
      <ToolbarPrimitive.Button
        render={
          <Toggle
            pressed={currentListType === type}
            onPressedChange={(pressed) => applyListType(pressed ? type : "")}
            className="size-8 min-w-8 shrink-0 p-0"
          />
        }
        aria-label={label}
        disabled={inTable}
        focusableWhenDisabled={false}
        onMouseDown={(event) => event.preventDefault()}
      >
        {icon}
      </ToolbarPrimitive.Button>
    </TooltipComponent>
  );

  const setBlockType = (blockType: BlockType) => {
    if (!activeEditor || !blockType) return;

    activeEditor.update(
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        $setBlocksType(selection, () => {
          if (blockType === "quote") return $createQuoteNode();
          if (blockType === "paragraph") return $createParagraphNode();
          return $createHeadingNode(blockType);
        });
      },
      {
        discrete: true,
        // Commit the block and selection together. A delayed editor.focus()
        // can restore an older range after the user has resumed typing.
        onUpdate: () =>
          activeEditor.getRootElement()?.focus({ preventScroll: true }),
      },
    );
  };

  const undoLabel = t("rich_text_editor.toolbar.undo", {
    shortcut: isApple ? "⌘Z" : "Ctrl+Z",
  });
  const redoLabel = t("rich_text_editor.toolbar.redo", {
    shortcut: isApple ? "⌘Y" : "Ctrl+Y",
  });

  return (
    <ToolbarPrimitive.Root
      aria-label={t("rich_text_editor.toolbar.toggleGroup")}
      className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-border bg-muted/40 p-1.5"
    >
      {formatToggle(
        "bold",
        IS_BOLD,
        t("rich_text_editor.toolbar.bold"),
        <Bold />,
      )}
      {formatToggle(
        "italic",
        IS_ITALIC,
        t("rich_text_editor.toolbar.italic"),
        <Italic />,
      )}
      {formatToggle(
        "underline",
        IS_UNDERLINE,
        t("rich_text_editor.toolbar.underline"),
        <Underline />,
      )}
      {listToggle(
        "bullet",
        t("rich_text_editor.toolbar.bulletedList"),
        <List />,
      )}
      <Select<BlockType> value={currentBlockType} onValueChange={setBlockType}>
        <ToolbarPrimitive.Button
          render={
            <SelectTrigger className="size-8 w-8! shrink-0 justify-center gap-0 border-0 bg-transparent p-0 shadow-none hover:bg-muted [&>svg:last-child]:hidden" />
          }
          aria-label={t(
            "rich_text_editor.toolbar.blockTypeSelect.selectBlockTypeTooltip",
          )}
        >
          <SelectValue className="sr-only" />
          <Heading className="size-4" />
        </ToolbarPrimitive.Button>
        <SelectContent
          align="start"
          className="min-w-40"
          // The editor command already restores the text selection. Returning
          // to the trigger after the close animation can interrupt new typing.
          finalFocus={false}
        >
          <SelectItem value="paragraph">
            {t("rich_text_editor.toolbar.blockTypes.paragraph")}
          </SelectItem>
          <SelectItem value="quote">
            {t("rich_text_editor.toolbar.blockTypes.quote")}
          </SelectItem>
          {([1, 2, 3, 4, 5, 6] as const).map((level) => (
            <SelectItem key={level} value={`h${level}`}>
              {t("rich_text_editor.toolbar.blockTypes.heading", { level })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <ToolbarPrimitive.Button
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto size-8 shrink-0"
              />
            }
            aria-label={t("rich_text_editor.toolbar.moreFormatting")}
          >
            <MoreHorizontal className="size-5" />
          </ToolbarPrimitive.Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          collisionPadding={12}
          aria-label={t("rich_text_editor.toolbar.moreFormatting")}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="w-fit gap-2 p-2"
        >
          <div className="flex items-center gap-1">
            <TooltipComponent content={undoLabel}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={undoLabel}
                disabled={!canUndo}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  activeEditor?.dispatchCommand(UNDO_COMMAND, undefined)
                }
              >
                <Undo />
              </Button>
            </TooltipComponent>
            <TooltipComponent content={redoLabel}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={redoLabel}
                disabled={!canRedo}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  activeEditor?.dispatchCommand(REDO_COMMAND, undefined)
                }
              >
                <Redo />
              </Button>
            </TooltipComponent>
          </div>
          <Separator />
          <ToolbarPrimitive.Root
            role="group"
            aria-label={t("rich_text_editor.toolbar.toggleGroup")}
            className="flex items-center gap-1"
          >
            {formatToggle(
              "highlight",
              IS_HIGHLIGHT,
              t("rich_text_editor.toolbar.highlight"),
              <Highlighter />,
            )}
            {listToggle(
              "number",
              t("rich_text_editor.toolbar.numberedList"),
              <ListOrdered />,
            )}
            {listToggle(
              "check",
              t("rich_text_editor.toolbar.checkList"),
              <ListChecks />,
            )}
          </ToolbarPrimitive.Root>
        </PopoverContent>
      </Popover>
    </ToolbarPrimitive.Root>
  );
}
