import React, { useCallback, useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2, { Submit } from "@/components/Common/ButtonV2";
import DialogModal from "@/components/Common/Dialog";

import useFileUpload from "@/hooks/useFileUpload";

import { classNames } from "@/Utils/utils";

import MarkdownPreview from "./MarkdownPreview";
import MentionsDropdown from "./MentionDropdown";

interface RichTextEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onAddNote: () => Promise<string | undefined>;
  isAuthorized?: boolean;
  onRefetch?: () => void;
  maxRows?: number;
}

const lineStyles = {
  orderedList: /^\d+\.\s/,
  unorderedList: /^-\s/,
  quote: /^>\s/,
  emptyOrderedList: /^\d+\.\s*$/,
  emptyUnorderedList: /^-\s*$/,
  emptyQuote: /^>\s*$/,
  startWithNumber: /^\d+/,
  containsNumber: /\d+/,
};

interface CaretPosition {
  start: number;
  end: number;
  beforeSelection: string;
  selection: string;
  afterSelection: string;
}

const getCaretPosition = (element: HTMLTextAreaElement): CaretPosition => {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  const text = element.value;

  return {
    start,
    end,
    beforeSelection: text.substring(0, start),
    selection: text.substring(start, end),
    afterSelection: text.substring(end),
  };
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialMarkdown: markdown = "",
  onChange: setMarkdown,
  onAddNote,
  isAuthorized = true,
  onRefetch,
  maxRows,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const [mentionFilter, setMentionFilter] = useState("");
  const [linkDialogState, setLinkDialogState] = useState({
    showDialog: false,
    url: "",
    selectedText: "",
    linkText: "",
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fileUpload = useFileUpload({
    type: "NOTES",
    category: "UNSPECIFIED",
    multiple: true,
    allowAllExtensions: true,
  });

  const updateMarkdownAndCursor = (
    newMarkdown: string,
    cursorPosition: number,
  ) => {
    setMarkdown(newMarkdown);

    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    if (!editorRef.current) return;

    const { beforeSelection, selection, afterSelection } = getCaretPosition(
      editorRef.current,
    );

    const newText = selection
      ? `${beforeSelection}${prefix}${selection}${suffix}${afterSelection}`
      : `${beforeSelection}${prefix}${suffix}${afterSelection}`;

    const newCursorPosition = selection
      ? beforeSelection.length + prefix.length + selection.length
      : beforeSelection.length + prefix.length;

    updateMarkdownAndCursor(newText, newCursorPosition);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMentions(false);
        setMentionFilter("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const insertMention = (user: { id: string; username: string }) => {
    if (!editorRef.current) return;

    const { beforeSelection, afterSelection } = getCaretPosition(
      editorRef.current,
    );
    const lastAtSymbolIndex = beforeSelection.lastIndexOf("@");

    const beforeMention = beforeSelection.substring(0, lastAtSymbolIndex);
    const displayMention = `@${user.username}`;
    const newMarkdown = `${beforeMention}${displayMention}${afterSelection}`;
    const newCursorPosition = lastAtSymbolIndex + displayMention.length;

    updateMarkdownAndCursor(newMarkdown, newCursorPosition);

    setShowMentions(false);
    setMentionFilter("");
  };

  const adjustTextareaHeight = useCallback(
    (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";

      const style = window.getComputedStyle(textarea);
      const borderHeight =
        parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
      const paddingHeight =
        parseInt(style.paddingTop) + parseInt(style.paddingBottom);

      const lineHeight = parseInt(style.lineHeight);
      const maxHeight = maxRows
        ? lineHeight * maxRows + borderHeight + paddingHeight
        : Infinity;

      const newHeight = Math.min(
        textarea.scrollHeight + borderHeight,
        maxHeight,
      );
      textarea.style.height = `${newHeight}px`;
    },
    [maxRows],
  );

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMarkdown = event.target.value;
      const caretPosition = event.target.selectionStart;

      setMarkdown(newMarkdown);
      adjustTextareaHeight(event.target);

      const textBeforeCaret = newMarkdown.substring(0, caretPosition);
      const lastAtSymbolIndex = textBeforeCaret.lastIndexOf("@");

      if (lastAtSymbolIndex !== -1) {
        const mentionText = textBeforeCaret.substring(lastAtSymbolIndex + 1);
        if (mentionText.includes(" ")) return;
        setMentionFilter(mentionText);

        if (editorRef.current) {
          const { top, left } = getCaretCoordinates(
            editorRef.current,
            caretPosition,
          );
          setMentionPosition({ top: top + 50, left: left + 10 });
          setShowMentions(true);
        }
      } else {
        setShowMentions(false);
      }
    },
    [adjustTextareaHeight],
  );

  useEffect(() => {
    if (editorRef.current) {
      adjustTextareaHeight(editorRef.current);
    }
  }, [markdown, adjustTextareaHeight]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!editorRef.current) return;

      const { start: selectionStart } = getCaretPosition(editorRef.current);
      const text = editorRef.current.value;
      const currentLineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = text.slice(currentLineStart, selectionStart);

      let newText = text;
      let newCursorPos = selectionStart;

      if (
        lineStyles.emptyOrderedList.test(currentLine) ||
        lineStyles.emptyUnorderedList.test(currentLine) ||
        lineStyles.emptyQuote.test(currentLine)
      ) {
        newText = text.slice(0, currentLineStart) + text.slice(selectionStart);
        newCursorPos = currentLineStart;
      } else {
        let newLine = "\n";

        if (lineStyles.orderedList.test(currentLine)) {
          const currentNumber = parseInt(
            currentLine.match(lineStyles.startWithNumber)?.[0] || "0",
            10,
          );
          newLine += `${currentNumber + 1}. `;
        } else if (lineStyles.unorderedList.test(currentLine)) {
          newLine += "- ";
        } else if (lineStyles.quote.test(currentLine)) {
          newLine += "> ";
        }

        newText =
          text.slice(0, selectionStart) + newLine + text.slice(selectionStart);
        newCursorPos = selectionStart + newLine.length;
      }

      updateMarkdownAndCursor(newText, newCursorPos);
    }
  };

  const handleListToggle = (isOrdered: boolean) => {
    if (!editorRef.current) return;
    const { start: selectionStart, end: selectionEnd } = getCaretPosition(
      editorRef.current,
    );
    const text = editorRef.current.value;

    if (selectionStart === selectionEnd) {
      const lineIndex = getCurrentLineIndex(selectionStart);
      const currentLine = getCurrentLine(lineIndex);
      const listStyle = isOrdered
        ? lineStyles.orderedList
        : lineStyles.unorderedList;

      let newText = "";
      if (listStyle.test(currentLine)) {
        newText = currentLine.replace(listStyle, "");
      } else {
        if (isOrdered) {
          const prevLine = getCurrentLine(lineIndex - 1);
          const prevNumber = lineStyles.orderedList
            .exec(prevLine)?.[0]
            .match(lineStyles.containsNumber)?.[0];
          const nextNumber = prevNumber ? parseInt(prevNumber) + 1 : 1;
          newText = `${nextNumber}. ${currentLine}`;
        } else {
          newText = `- ${currentLine}`;
        }
      }

      replaceLine(lineIndex, newText);
    } else {
      const selectedText = text.substring(selectionStart, selectionEnd);
      const lines = selectedText.split("\n");

      let newText = "";
      let currentNumber = 1;

      lines.forEach((line) => {
        const listStyle = isOrdered
          ? lineStyles.orderedList
          : lineStyles.unorderedList;
        if (listStyle.test(line)) {
          newText += line.replace(listStyle, "") + "\n";
        } else {
          newText += isOrdered
            ? `${currentNumber++}. ${line}\n`
            : `- ${line}\n`;
        }
      });

      newText = newText.trimEnd();
      const beforeSelection = text.substring(0, selectionStart);
      const afterSelection = text.substring(selectionEnd);
      const updatedText = beforeSelection + newText + afterSelection;

      updateMarkdownAndCursor(updatedText, selectionStart + newText.length);
    }
  };

  const handleQuote = () => {
    if (!editorRef.current) return;
    const { start: selectionStart } = getCaretPosition(editorRef.current);
    const lineIndex = getCurrentLineIndex(selectionStart);
    const currentLine = getCurrentLine(lineIndex);

    let newText = "";
    if (lineStyles.quote.test(currentLine)) {
      newText = currentLine.replace(lineStyles.quote, "");
    } else {
      newText = `> ${currentLine}`;
    }

    replaceLine(lineIndex, newText);
  };

  const getCurrentLine = (lineIndex: number): string => {
    if (!editorRef.current) return "";
    const lines = editorRef.current.value.split("\n");
    return lines[lineIndex] || "";
  };

  const replaceLine = (lineIndex: number, newText: string) => {
    if (!editorRef.current) return;
    const text = editorRef.current.value;
    const lines = text.split("\n");

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    lines[lineIndex] = newText;
    const newValue = lines.join("\n");
    const newLineStart =
      lines.slice(0, lineIndex).join("\n").length + (lineIndex > 0 ? 1 : 0);
    const newCursorPosition = newLineStart + newText.length;

    updateMarkdownAndCursor(newValue, newCursorPosition);
  };

  const getCurrentLineIndex = (cursorPosition: number) => {
    const text = editorRef.current?.value || "";
    return text.substring(0, cursorPosition).split("\n").length - 1;
  };

  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  const handleLink = () => {
    if (!editorRef.current) return;

    const { selection } = getCaretPosition(editorRef.current);

    setLinkDialogState({
      showDialog: true,
      url: "",
      linkText: selection,
      selectedText: selection,
    });
  };

  const handleInsertLink = () => {
    if (!editorRef.current || !linkDialogState.url.trim()) return;

    const { start, beforeSelection, afterSelection } = getCaretPosition(
      editorRef.current,
    );

    const markdownLink = `[${linkDialogState.linkText || linkDialogState.url}](${formatUrl(linkDialogState.url)})`;
    const newText = `${beforeSelection}${markdownLink}${afterSelection}`;
    const newCursorPosition = start + markdownLink.length;

    updateMarkdownAndCursor(newText, newCursorPosition);

    setLinkDialogState({
      showDialog: false,
      url: "",
      linkText: "",
      selectedText: "",
    });
  };

  return (
    <div className="relative m-2">
      {/* toolbar */}
      <div className="flex items-center space-x-1 rounded-t-md border border-gray-300 bg-gray-100 pl-1 sm:space-x-2">
        <button
          onClick={() => insertMarkdown("**")}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-bold" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-4">Bold</span>
        </button>
        <button
          onClick={() => insertMarkdown("_")}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-italic" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Italic
          </span>
        </button>
        <button
          onClick={() => insertMarkdown("~~")}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-text-strike-through" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Strikethrough
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>

        <button
          onClick={() => handleListToggle(false)}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-list-ul" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Unordered List
          </span>
        </button>
        <button
          onClick={() => handleListToggle(true)}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-list-ol" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Ordered List
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={handleQuote}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-paragraph" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Quote
          </span>
        </button>

        <button
          onClick={handleLink}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-link" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Link
          </span>
        </button>

        <div className="flex-1" />
        <div className="flex rounded-md border border-gray-300 bg-white">
          <button
            className={classNames(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors duration-200",
              !isPreviewMode && "bg-primary-500 text-white",
              isPreviewMode && "text-gray-500 hover:bg-gray-100",
            )}
            onClick={() => {
              setIsPreviewMode(false);
              // Reset height after switching back to edit mode
              requestAnimationFrame(() => {
                if (editorRef.current) {
                  adjustTextareaHeight(editorRef.current);
                }
              });
            }}
          >
            Edit
          </button>
          <button
            className={classNames(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors duration-200",
              isPreviewMode && "bg-primary-500 text-white",
              !isPreviewMode && "text-gray-500 hover:bg-gray-100",
            )}
            onClick={() => setIsPreviewMode(true)}
          >
            Preview
          </button>
        </div>
      </div>

      {/* editor/preview */}
      <div
        className={classNames(
          "border border-x-gray-300 bg-white",
          isPreviewMode && "bg-gray-50",
        )}
      >
        {isPreviewMode ? (
          <div className="max-h-[400px] min-h-[70px] overflow-y-auto p-4">
            <MarkdownPreview markdown={markdown} />
          </div>
        ) : (
          <textarea
            id="discussion_notes_textarea"
            ref={editorRef}
            className={classNames(
              "w-full resize-none border-none p-2 align-middle text-sm outline-none focus:outline-none focus:ring-0",
              maxRows ? "overflow-y-auto" : "overflow-hidden",
            )}
            value={markdown}
            onInput={handleInput}
            onKeyDown={onKeyDown}
          />
        )}
        {fileUpload.files.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2">
            {fileUpload.files.map((file, index) => (
              <div
                key={index}
                className="relative mt-1 h-20 w-20 cursor-pointer rounded-md bg-gray-100 shadow-sm transition-colors duration-200 hover:bg-gray-200/50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileUpload.removeFile(index);
                  }}
                  className="absolute -right-1 -top-1 z-10 h-5 w-5 rounded-full bg-gray-300 text-gray-800 transition-colors duration-200 hover:bg-gray-400"
                >
                  <CareIcon
                    icon="l-times-circle"
                    className="text-md absolute right-0.5 top-0.5 text-gray-600"
                  />
                </button>
                <div className="flex h-full w-full flex-col items-center justify-center p-2">
                  <CareIcon
                    icon="l-file"
                    className="shrink-0 text-2xl text-gray-600"
                  />
                  <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-gray-600">
                    {file?.name || "file"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* toolbar-2 */}
      <div className="flex items-center space-x-1 rounded-b-md border border-gray-300 bg-gray-100 pl-2 sm:space-x-2">
        <label className="tooltip cursor-pointer rounded bg-gray-200/50 p-1">
          <CareIcon icon="l-paperclip" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-4">
            Attach File
          </span>
          <fileUpload.Input multiple />
        </label>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={() => fileUpload.handleCameraCapture()}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-camera" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Camera
          </span>
        </button>
        <button
          onClick={() => fileUpload.handleAudioCapture()}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-microphone" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Audio
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={() => {
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setMentionPosition({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
            });
            setShowMentions(!showMentions);
          }}
          className="tooltip rounded bg-gray-200/50 p-1"
        >
          <CareIcon icon="l-at" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Mention
          </span>
        </button>

        <div className="grow"></div>
        <div>
          <Submit
            id="add_doctor_note_button"
            onClick={async () => {
              if (!editorRef.current) return;
              const id = await onAddNote();
              if (!id) return;
              await fileUpload.handleFileUpload(id);
              onRefetch?.();
              fileUpload.clearFiles();
              editorRef.current.innerHTML = "";
              setIsPreviewMode(false);
            }}
            className="flex-none rounded bg-primary-500 p-2 text-white"
            disabled={!isAuthorized || isPreviewMode}
          >
            <CareIcon icon="l-message" className="text-lg" />
          </Submit>
        </div>
      </div>

      {showMentions && (
        <MentionsDropdown
          onSelect={insertMention}
          position={mentionPosition}
          editorRef={editorRef}
          filter={mentionFilter}
        />
      )}

      <DialogModal
        show={linkDialogState.showDialog}
        title="Insert Link"
        onClose={() =>
          setLinkDialogState((prev) => ({ ...prev, showDialog: false }))
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="link-text-input"
              className="block text-sm font-medium text-gray-700"
            >
              Link Text:
            </label>
            <input
              id="link-text-input"
              type="text"
              placeholder="Enter link text"
              className="mt-1 block w-full rounded border border-gray-300 p-2"
              value={linkDialogState.linkText}
              onChange={(e) =>
                setLinkDialogState((prev) => ({
                  ...prev,
                  linkText: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              htmlFor="url-input"
              className="block text-sm font-medium text-gray-700"
            >
              URL:
            </label>
            <input
              id="url-input"
              type="text"
              placeholder="Enter URL"
              className="mt-1 block w-full rounded border border-gray-300 p-2"
              value={linkDialogState.url}
              onChange={(e) =>
                setLinkDialogState((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-4">
            <ButtonV2
              variant="secondary"
              onClick={() =>
                setLinkDialogState((prev) => ({ ...prev, showDialog: false }))
              }
            >
              Cancel
            </ButtonV2>
            <ButtonV2 onClick={handleInsertLink}>Apply Link</ButtonV2>
          </div>
        </div>
      </DialogModal>

      {fileUpload.Dialogues}
    </div>
  );
};

export default RichTextEditor;

const getCaretCoordinates = (
  element: HTMLTextAreaElement,
  position: number,
) => {
  const div = document.createElement("div");
  const span = document.createElement("span");
  try {
    const computed = getComputedStyle(element);

    div.style.position = "absolute";
    div.style.whiteSpace = "pre-wrap";
    div.style.visibility = "hidden";

    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      div.style.setProperty(prop, computed.getPropertyValue(prop));
    }

    div.textContent = element.value.substring(0, position);
    span.textContent = element.value.substring(position) || ".";

    div.appendChild(span);
    document.body.appendChild(div);

    const { top, left } = span.getBoundingClientRect();
    return { top, left, start: position };
  } finally {
    document.body.removeChild(div);
  }
};
