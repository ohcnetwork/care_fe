import React, { useCallback, useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Submit } from "@/components/Common/ButtonV2";

import useFileUpload from "@/hooks/useFileUpload";

import { getCaretCoordinates, getCaretInfo } from "@/Utils/textEditor";
import { classNames } from "@/Utils/utils";

import { FilePreviewCard } from "./FilePreviewCard";
import MentionsDropdown from "./MentionDropdown";
import NotePreview from "./NotePreview";

interface DiscussionNotesEditorProps {
  initialNote?: string;
  onChange: (text: string) => void;
  onAddNote: () => Promise<string | undefined>;
  isAuthorized?: boolean;
  onRefetch?: () => void;
  maxRows?: number;
  className?: string;
}

const DiscussionNotesEditor: React.FC<DiscussionNotesEditorProps> = ({
  initialNote: text = "",
  onChange: setText,
  onAddNote,
  isAuthorized = true,
  onRefetch,
  maxRows,
  className,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const [mentionFilter, setMentionFilter] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fileUpload = useFileUpload({
    type: "PATIENT_NOTES",
    category: "UNSPECIFIED",
    multiple: true,
    allowAllExtensions: true,
  });

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

    const { beforeCaret, afterCaret } = getCaretInfo(editorRef.current);
    const lastAtSymbolIndex = beforeCaret.lastIndexOf("@");

    const beforeMention = beforeCaret.substring(0, lastAtSymbolIndex);
    const displayMention = `@${user.username}`;
    const newText = `${beforeMention}${displayMention}${afterCaret}`;
    const newCursorPosition = lastAtSymbolIndex + displayMention.length;

    setText(newText);
    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition,
        );
      }
    });
    setShowMentions(false);
    setMentionFilter("");
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);

    const { beforeCaret } = getCaretInfo(event.target);
    const lastAtSymbolIndex = beforeCaret.lastIndexOf("@");

    if (lastAtSymbolIndex !== -1) {
      const mentionText = beforeCaret.substring(lastAtSymbolIndex + 1);
      if (mentionText.includes(" ")) return;

      setMentionFilter(mentionText);
      const coordinates = getCaretCoordinates(event.target);
      setMentionPosition(coordinates);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionButtonClick = () => {
    if (!editorRef.current) return;

    const cursorPosition = editorRef.current.selectionStart;
    const currentText = editorRef.current.value;

    const newText = `${currentText.slice(0, cursorPosition)}@${currentText.slice(
      cursorPosition,
    )}`;
    setText(newText);

    requestAnimationFrame(() => {
      if (!editorRef.current) return;

      editorRef.current.focus();
      const newPosition = cursorPosition + 1;
      editorRef.current.setSelectionRange(newPosition, newPosition);

      const coordinates = getCaretCoordinates(editorRef.current);
      setMentionPosition(coordinates);
      setShowMentions(true);
    });
  };

  return (
    <div className="mx-2 mb-2">
      <div className="relative">
        <div
          className={classNames(
            "rounded-t-lg border border-x-gray-300 bg-white shadow-sm transition-all duration-200",
            isPreviewMode && "bg-gray-50",
            className,
          )}
        >
          {isPreviewMode ? (
            <div className="max-h-[400px] min-h-[70px] overflow-y-auto p-4">
              <NotePreview initialNote={text} />
            </div>
          ) : (
            <AutoExpandingTextarea
              id="discussion_notes_textarea"
              ref={editorRef}
              placeholder="Type your message here..."
              className={classNames(
                "w-full resize-none border-none p-3 align-middle text-sm outline-none focus:outline-none focus:ring-0",
                maxRows ? "overflow-y-auto" : "overflow-hidden",
              )}
              value={text}
              onInput={handleInput}
              maxRows={maxRows}
            />
          )}
          {fileUpload.files.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-gray-50/50 px-3 py-1">
              {fileUpload.files.map((file, index) => (
                <FilePreviewCard
                  key={index}
                  file={file}
                  index={index}
                  onRemove={fileUpload.removeFile}
                />
              ))}
            </div>
          )}
        </div>

        {/* toolbar*/}
        <div className="flex items-center space-x-1 rounded-b-md border border-gray-300 bg-gray-100 pl-2 sm:space-x-2">
          <label className="tooltip cursor-pointer rounded bg-gray-200/50 p-1 text-gray-700">
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
            onClick={handleMentionButtonClick}
            className="tooltip rounded bg-gray-200/50 p-1"
          >
            <CareIcon icon="l-at" className="text-lg" />
            <span className="tooltip-text tooltip-top -translate-x-1/2">
              Mention
            </span>
          </button>

          <div className="grow"></div>

          <Submit
            id="add_doctor_note_button"
            onClick={async () => {
              if (!editorRef.current) return;
              const id = await onAddNote();
              if (!id) return;
              await fileUpload.handleFileUpload(id);
              onRefetch?.();
              fileUpload.clearFiles();
              setText("");
              setIsPreviewMode(false);
            }}
            className="max-w-12"
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
          containerRef={editorRef}
        />
      )}

      {fileUpload.Dialogues}
    </div>
  );
};

interface AutoExpandingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(({ maxRows, ...props }, ref) => {
  const adjustHeight = useCallback(
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

  useEffect(() => {
    const textarea = (ref as React.RefObject<HTMLTextAreaElement>).current;
    if (textarea) {
      adjustHeight(textarea);
    }
  }, [props.value, adjustHeight]);

  return <textarea ref={ref} {...props} />;
});

AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export default DiscussionNotesEditor;
