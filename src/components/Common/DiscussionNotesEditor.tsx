import { t } from "i18next";
import React, { useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { FilePreviewCard } from "@/components/Common/FilePreviewCard";
import MentionsDropdown from "@/components/Common/MentionDropdown";
import NotePreview from "@/components/Common/NotePreview";

import useFileUpload from "@/hooks/useFileUpload";

import { getCaretCoordinates, getCaretInfo } from "@/Utils/textEditor";
import { classNames } from "@/Utils/utils";

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
    allowedExtensions: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "tiff",
      "mp4",
      "mov",
      "avi",
      "wmv",
      "mp3",
      "wav",
      "ogg",
      "txt",
      "csv",
      "rtf",
      "doc",
      "odt",
      "pdf",
      "xls",
      "xlsx",
      "ods",
    ],
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
            "rounded-t-lg border border-x-secondary-300 bg-white shadow-sm transition-all duration-200",
            isPreviewMode && "bg-secondary-50",
            className,
          )}
        >
          {isPreviewMode ? (
            <div className="max-h-[400px] min-h-[70px] overflow-y-auto p-4">
              <NotePreview initialNote={text} />
            </div>
          ) : (
            <Textarea
              id="discussion_notes_textarea"
              ref={editorRef}
              placeholder={t("type_your_message")}
              className={classNames(
                "w-full resize-none border-0 p-3 text-sm ring-0 focus-visible:ring-offset-0 focus-visible:ring-0",
                maxRows ? "overflow-y-auto" : "overflow-hidden",
              )}
              value={text}
              onChange={handleInput}
              onInput={(e) => {
                // auto expand textarea
                const textarea = e.currentTarget;
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
                if (maxRows) {
                  const lineHeight = parseInt(
                    window.getComputedStyle(textarea).lineHeight,
                  );
                  const maxHeight = lineHeight * maxRows;
                  if (textarea.scrollHeight > maxHeight) {
                    textarea.style.height = `${maxHeight}px`;
                    textarea.style.overflowY = "auto";
                  } else {
                    textarea.style.overflowY = "hidden";
                  }
                }
              }}
            />
          )}
          {fileUpload.files.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-secondary-200 bg-secondary-50/50 px-3 py-1">
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
        <div className="flex items-center space-x-1 rounded-b-md border border-secondary-300 bg-secondary-100 pl-2 sm:space-x-2">
          <label className="tooltip cursor-pointer rounded bg-secondary-200/50 px-1 text-secondary-800">
            <CareIcon icon="l-paperclip" className="text-lg" />
            <span className="tooltip-text tooltip-top -translate-x-4">
              {t("attach_file")}
            </span>
            <fileUpload.Input multiple />
          </label>
          <div className="mx-2 h-6 border-l border-secondary-400"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileUpload.handleCameraCapture()}
            className="tooltip rounded bg-secondary-200/50 px-1"
          >
            <CareIcon icon="l-camera" className="text-lg" />
            <span className="tooltip-text tooltip-top -translate-x-1/2">
              {t("camera")}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileUpload.handleAudioCapture()}
            className="tooltip rounded bg-secondary-200/50 px-1"
          >
            <CareIcon icon="l-microphone" className="text-lg" />
            <span className="tooltip-text tooltip-top -translate-x-1/2">
              {t("audio__record")}
            </span>
          </Button>
          <div className="mx-2 h-6 border-l border-secondary-400"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMentionButtonClick}
            className="tooltip rounded bg-secondary-200/50 px-1"
          >
            <CareIcon icon="l-at" className="text-lg" />
            <span className="tooltip-text tooltip-top -translate-x-1/2">
              {t("mention")}
            </span>
          </Button>

          <div className="grow"></div>

          <Button
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
            variant="primary"
          >
            <CareIcon icon="l-message" className="text-lg" />
          </Button>
        </div>
      </div>

      {showMentions && (
        <MentionsDropdown
          onSelect={insertMention}
          position={mentionPosition}
          filter={mentionFilter}
          containerRef={editorRef}
        />
      )}

      {fileUpload.Dialogues}
    </div>
  );
};

export default DiscussionNotesEditor;
