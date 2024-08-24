import React, {
  useRef,
  useState,
  useCallback,
  ChangeEvent,
  useEffect,
} from "react";
import MentionsDropdown from "./MentionDropdown";
import { ExtImage } from "../../../Utils/useFileUpload";
import imageCompression from "browser-image-compression";
import DialogModal from "../Dialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2, { Submit } from "../components/ButtonV2";
import CameraCaptureModal from "./CameraCaptureModal";
import AudioRecorder from "./AudioRecorder";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import uploadFile from "../../../Utils/request/uploadFile";
import * as Notification from "../../../Utils/Notifications.js";
import { CreateFileResponse } from "../../Patient/models";
import MarkdownPreview from "./MarkdownPreview";

interface RichTextEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onAddNote: () => Promise<string | undefined>;
  isAuthorized?: boolean;
  onRefetch?: () => void;
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialMarkdown: markdown = "",
  onChange: setMarkdown,
  onAddNote,
  isAuthorized = true,
  onRefetch,
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const [mentionFilter, setMentionFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [modalOpenForCamera, setModalOpenForCamera] = useState(false);
  const [modalOpenForAudio, setModalOpenForAudio] = useState(false);
  const [linkDialogState, setLinkDialogState] = useState({
    showDialog: false,
    url: "",
    selectedText: "",
    linkText: "",
  });

  const [tempFiles, setTempFiles] = useState<File[]>([]);

  const insertMarkdown = (prefix: string, suffix: string = prefix) => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value;

    const beforeSelection = text.substring(0, start);
    const selection = text.substring(start, end);
    const afterSelection = text.substring(end);

    let newText = "";
    let newCursorPosition = 0;

    if (selection) {
      newText = `${beforeSelection}${prefix}${selection}${suffix}${afterSelection}`;
      newCursorPosition = start + prefix.length + selection.length;
    } else {
      newText = `${beforeSelection}${prefix}${suffix}${afterSelection}`;
      newCursorPosition = start + prefix.length;
    }

    setMarkdown(newText);

    // Using setTimeout to ensure the new text is set before we try to move the cursor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition,
        );
      }
    }, 0);
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

    const start = editorRef.current.selectionStart;
    const text = editorRef.current.value;
    const lastAtSymbolIndex = text.lastIndexOf("@", start - 1);

    const beforeMention = text.substring(0, lastAtSymbolIndex);
    const afterMention = text.substring(start);

    const displayMention = `@${user.username}`;
    const newMarkdown = `${beforeMention}${displayMention}${afterMention}`;
    setMarkdown(newMarkdown);

    editorRef.current.focus();
    const newCursorPosition = lastAtSymbolIndex + displayMention.length;
    editorRef.current.setSelectionRange(newCursorPosition, newCursorPosition);

    setShowMentions(false);
    setMentionFilter("");
  };

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newMarkdown = event.target.value;
      const caretPosition = event.target.selectionStart;

      setMarkdown(newMarkdown);

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
    [],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!editorRef.current) return;

      const text = editorRef.current.value;
      const selectionStart = editorRef.current.selectionStart || 0;
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

      editorRef.current.value = newText;
      editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      setMarkdown(newText);
    }
  };

  const handleOrderedList = () => {
    if (!editorRef.current) return;
    const selectionStart = editorRef.current.selectionStart || 0;
    const lineIndex = getCurrentLineIndex(selectionStart);
    const currentLine = getCurrentLine(lineIndex);

    let newText = "";
    if (lineStyles.orderedList.test(currentLine)) {
      newText = currentLine.replace(lineStyles.orderedList, "");
    } else {
      const prevLine = getCurrentLine(lineIndex - 1);
      const prevNumber = lineStyles.orderedList
        .exec(prevLine)?.[0]
        .match(lineStyles.containsNumber)?.[0];
      const nextNumber = prevNumber ? parseInt(prevNumber) + 1 : 1;
      newText = `${nextNumber}. ${currentLine}`;
    }

    replaceLine(lineIndex, newText);
  };

  const handleUnorderedList = () => {
    if (!editorRef.current) return;
    const selectionStart = editorRef.current.selectionStart || 0;
    const lineIndex = getCurrentLineIndex(selectionStart);
    const currentLine = getCurrentLine(lineIndex);

    let newText = "";
    if (lineStyles.unorderedList.test(currentLine)) {
      newText = currentLine.replace(lineStyles.unorderedList, "");
    } else {
      newText = `- ${currentLine}`;
    }

    replaceLine(lineIndex, newText);
  };

  const handleQuote = () => {
    if (!editorRef.current) return;
    const selectionStart = editorRef.current.selectionStart || 0;
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
    editorRef.current.value = newValue;
    setMarkdown(newValue);

    const newLineStart =
      lines.slice(0, lineIndex).join("\n").length + (lineIndex > 0 ? 1 : 0);
    const newCursorPosition = newLineStart + newText.length;
    editorRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    editorRef.current.focus();
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

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value;

    const selectedText = text.substring(start, end);

    setLinkDialogState({
      showDialog: true,
      url: "",
      linkText: selectedText,
      selectedText,
    });
  };

  const handleInsertLink = () => {
    if (!editorRef.current) return;

    const { start } = getCaretCoordinates(
      editorRef.current,
      editorRef.current.selectionStart,
    );

    const text = editorRef.current.value;

    const beforeSelection = text.substring(0, start);
    const afterSelection = text.substring(
      start + linkDialogState.selectedText.length,
    );

    const markdownLink = `[${linkDialogState.linkText || linkDialogState.url}](${formatUrl(linkDialogState.url)})`;
    const newText = `${beforeSelection}${markdownLink}${afterSelection}`;

    setMarkdown(newText);
    editorRef.current.focus();
    editorRef.current.setSelectionRange(
      start + markdownLink.length,
      start + markdownLink.length,
    );

    setLinkDialogState({
      showDialog: false,
      url: "",
      linkText: "",
      selectedText: "",
    });
  };

  const uploadfile = async (data: CreateFileResponse, file: File) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const newFile = new File([file], `${internal_name}`);
    return new Promise<void>((resolve, reject) => {
      uploadFile(
        url,
        newFile,
        "PUT",
        { "Content-Type": file.type },
        async (xhr: XMLHttpRequest) => {
          if (xhr.status >= 200 && xhr.status < 300) {
            Notification.Success({
              msg: "File Uploaded Successfully",
            });
            resolve();
          } else {
            Notification.Error({
              msg: "Error Uploading File: " + xhr.statusText,
            });
            reject();
          }
        },
        null,
        () => {
          Notification.Error({
            msg: "Error Uploading File: Network Error",
          });
          reject();
        },
      );
    });
  };

  const setFile = (file: File) => {
    setTempFiles((prevFiles) => [...prevFiles, file]);
  };

  const handleFileUpload = async (file: File, noteId: string) => {
    const category = file.type.includes("audio") ? "AUDIO" : "UNSPECIFIED";

    const { data } = await request(routes.createUpload, {
      body: {
        original_name: file.name,
        file_type: "NOTES",
        name: file.name,
        associating_id: noteId,
        file_category: category,
        mime_type: file.type,
      },
    });

    if (data) {
      await uploadfile(data, file);
      await markUploadComplete(data, noteId);
    }
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    }
    const f = e.target.files[0];
    const fileName = f.name;

    const ext: string = fileName.split(".")[1];

    if (ExtImage.includes(ext)) {
      const options = {
        initialQuality: 0.6,
        alwaysKeepResolution: true,
      };
      const compressedFile = await imageCompression(f, options);
      setTempFiles((prevFiles) => [...prevFiles, compressedFile]);
    } else {
      setTempFiles((prevFiles) => [...prevFiles, f]);
    }
  };

  const markUploadComplete = (data: CreateFileResponse, noteId: string) => {
    return request(routes.editUpload, {
      body: { upload_completed: true },
      pathParams: {
        id: data.id,
        fileType: "NOTES",
        associatingId: noteId,
      },
    });
  };

  return (
    <div className="relative m-2">
      <CameraCaptureModal
        open={modalOpenForCamera}
        onClose={() => setModalOpenForCamera(false)}
        setFile={setFile}
      />

      <AudioRecorder
        setFile={setFile}
        modalOpenForAudio={modalOpenForAudio}
        setModalOpenForAudio={setModalOpenForAudio}
      />
      <DialogModal
        show={showPreview}
        title="Preview"
        onClose={() => setShowPreview(false)}
      >
        <div className="flex flex-col gap-4">
          <MarkdownPreview markdown={markdown} />
        </div>
      </DialogModal>

      {/* toolbar */}
      <div className="flex items-center space-x-2 rounded-t-md border border-gray-300 bg-gray-100 p-1">
        <button
          onClick={() => insertMarkdown("**")}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-bold" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Bold
          </span>
        </button>
        <button
          onClick={() => insertMarkdown("_")}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-italic" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Italic
          </span>
        </button>
        <button
          onClick={() => insertMarkdown("~~")}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-text-strike-through" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Strikethrough
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>

        <button
          onClick={handleUnorderedList}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-list-ul" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Unordered List
          </span>
        </button>
        <button
          onClick={handleOrderedList}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-list-ol" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Ordered List
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={handleQuote}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-paragraph" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Quote
          </span>
        </button>

        <button
          onClick={handleLink}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-link" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Link
          </span>
        </button>

        <div className="flex-1" />
        <div
          className="flex cursor-pointer items-center gap-2 rounded-t-md border border-gray-300 bg-gray-100 p-1"
          onClick={() => setShowPreview(true)}
        >
          <CareIcon icon="l-eye" className="text-lg" />
          preview
        </div>
      </div>

      {/* editor */}
      <div className="overflow-y-auto border border-x-gray-300 bg-white focus:outline-none">
        <textarea
          id="doctor_notes_textarea"
          ref={editorRef}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 m-0 max-h-36 min-h-10 w-full resize-y overflow-auto border-none p-2 text-sm outline-none focus:border-none focus:ring-0"
          value={markdown}
          onChange={(e) => {
            setMarkdown(e.target.value);
          }}
          onInput={handleInput}
          onKeyDown={onKeyDown}
        />
        {tempFiles.length > 0 && (
          <div className="flex gap-2 px-2 pb-1">
            {tempFiles.map((file, index) => (
              <div
                key={index}
                className="relative mt-1 h-20 w-20 cursor-pointer rounded-md bg-gray-100 shadow-sm hover:bg-gray-200"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempFiles((prevFiles) =>
                      prevFiles.filter((f, i) => i !== index),
                    );
                  }}
                  className="absolute -right-1 -top-1 z-10 h-5 w-5 rounded-full bg-gray-300 text-gray-800 hover:bg-gray-400"
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
      <div className="flex items-center space-x-2 rounded-b-md border border-gray-300 bg-gray-100 pl-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-paperclip" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Attach File
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={() => setModalOpenForCamera(true)}
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-camera" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Camera
          </span>
        </button>
        <button
          onClick={() => setModalOpenForAudio(true)}
          className="tooltip rounded bg-gray-200 p-1"
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
          className="tooltip rounded bg-gray-200 p-1"
        >
          <CareIcon icon="l-at" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Mention
          </span>
        </button>
        <input
          ref={fileInputRef}
          onChange={onFileChange}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,text/plain,text/csv,application/rtf,application/msword,application/vnd.oasis.opendocument.text,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/pdf"
        />

        <div className="grow"></div>
        <div>
          <Submit
            id="add_doctor_note_button"
            onClick={async () => {
              if (!editorRef.current) return;
              const id = await onAddNote();
              if (!id) return;
              for (const file of tempFiles) {
                await handleFileUpload(file, id);
              }
              onRefetch?.();
              setTempFiles([]);
              editorRef.current.innerHTML = "";
            }}
            className="flex-none rounded bg-primary-500 p-2 text-white"
            disabled={!isAuthorized}
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
            <Submit onClick={handleInsertLink}>Apply Link</Submit>
          </div>
        </div>
      </DialogModal>
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

  const { offsetTop: top, offsetLeft: left } = span;

  document.body.removeChild(div);

  return { top, left, start: position };
};
