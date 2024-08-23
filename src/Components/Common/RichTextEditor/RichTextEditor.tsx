import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
} from "react";
import TurndownService from "turndown";
import MentionsDropdown from "./MentionDropdown";
import { ExtImage } from "../../../Utils/useFileUpload";
import imageCompression from "browser-image-compression";
import DialogModal from "../Dialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2, { Submit } from "../components/ButtonV2";
import CameraCaptureModal from "./CameraCaptureModal";
import AudioRecorder from "./AudioRecorder";
import { classNames } from "../../../Utils/utils";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import uploadFile from "../../../Utils/request/uploadFile";
import * as Notification from "../../../Utils/Notifications.js";
import { CreateFileResponse } from "../../Patient/models";

interface RichTextEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onAddNote: () => Promise<string | undefined>;
  isAuthorized?: boolean;
}

interface EditorState {
  isBoldActive: boolean;
  isItalicActive: boolean;
  isStrikethroughActive: boolean;
  isQuoteActive: boolean;
  isUnorderedListActive: boolean;
  isOrderedListActive: boolean;
}

const initialState: EditorState = {
  isBoldActive: false,
  isItalicActive: false,
  isStrikethroughActive: false,
  isQuoteActive: false,
  isUnorderedListActive: false,
  isOrderedListActive: false,
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  // initialMarkdown = "",
  onChange,
  onAddNote,
  isAuthorized = true,
}) => {
  const [state, setEditorState] = useState(initialState);
  const {
    isBoldActive,
    isItalicActive,
    isStrikethroughActive,
    isQuoteActive,
    isUnorderedListActive,
    isOrderedListActive,
  } = state;

  const editorRef = useRef<HTMLDivElement>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const lastCaretPosition = useRef<Range | null>(null);
  const [mentionFilter, setMentionFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpenForCamera, setModalOpenForCamera] = useState(false);
  const [modalOpenForAudio, setModalOpenForAudio] = useState(false);
  const [linkDialogState, setLinkDialogState] = useState({
    showDialog: false,
    url: "",
    selectedText: "",
    linkText: "",
  });

  const [tempFiles, setTempFiles] = useState<File[]>([]);

  useEffect(() => {
    handleSelectionChange();

    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener("selectstart", handleSelectionChange);
      editorElement.addEventListener("keyup", handleSelectionChange);
      editorElement.addEventListener("mouseup", handleSelectionChange);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener("selectstart", handleSelectionChange);
        editorElement.removeEventListener("keyup", handleSelectionChange);
        editorElement.removeEventListener("mouseup", handleSelectionChange);
      }
    };
  }, []);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const node = selection.focusNode;
    const parentNode = node?.parentElement;
    const isBold =
      isParentTag(node, "STRONG") ||
      isParentTag(node, "B") ||
      parentNode?.classList.contains("font-bold");
    const isItalic =
      isParentTag(node, "EM") ||
      isParentTag(node, "I") ||
      parentNode?.classList.contains("italic");
    const isStrikethrough =
      isParentTag(node, "S") ||
      isParentTag(node, "DEL") ||
      isParentTag(node, "STRIKE") ||
      parentNode?.classList.contains("line-through");
    const isQuote = isParentTag(selection.focusNode, "BLOCKQUOTE");

    const listNode = findParentNode(selection.anchorNode, ["UL", "OL"]);
    const isUnorderedListActive = listNode?.nodeName === "UL" ?? false;
    const isOrderedListActive = listNode?.nodeName === "OL" ?? false;

    setEditorState({
      isBoldActive: isBold ?? false,
      isItalicActive: isItalic ?? false,
      isQuoteActive: isQuote,
      isUnorderedListActive,
      isOrderedListActive,
      isStrikethroughActive: isStrikethrough ?? false,
    });
  };

  const isParentTag = (node: Node | null, tagName: string) => {
    while (node) {
      if (node.nodeName === tagName) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const findParentNode = (
    node: Node | null,
    tagNames: string[],
  ): HTMLElement | null => {
    while (node && node.parentNode) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        tagNames.includes(node.nodeName)
      ) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  };

  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `http://${url}`;
    }
    return url;
  };

  const applyStyle = (style: "b" | "i" | "s") => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const parentNode = range.commonAncestorContainer.parentNode as HTMLElement;

    let styleTag: string;
    let styleClass: string;

    switch (style) {
      case "b":
        styleTag = "STRONG";
        styleClass = "font-bold";
        break;
      case "i":
        styleTag = "EM";
        styleClass = "italic";
        break;
      case "s":
        styleTag = "S";
        styleClass = "line-through";
        break;
    }

    if (
      parentNode.tagName === styleTag ||
      parentNode.classList.contains(styleClass)
    ) {
      const parent = parentNode.parentNode;
      if (!parent) return;

      const fragment = document.createDocumentFragment();
      while (parentNode.firstChild) {
        fragment.appendChild(parentNode.firstChild);
      }
      parent.replaceChild(fragment, parentNode);
    } else {
      const node = document.createElement(styleTag);
      node.className = styleClass;
      node.appendChild(range.extractContents());
      range.insertNode(node);

      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
      selection.collapseToEnd();
    }

    saveState();
    handleSelectionChange();
  };

  const toggleList = (listType: "ul" | "ol") => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const listNode = findParentNode(range.startContainer, ["UL", "OL"]);

    if (listNode && listNode.nodeName === listType.toUpperCase()) {
      const parentList = listNode.parentNode;
      Array.from(listNode.childNodes).forEach((item) => {
        if (item.nodeName === "LI") {
          const newItem = document.createElement("p");
          newItem.appendChild(document.createTextNode(item.textContent || ""));
          if (parentList) {
            parentList.insertBefore(newItem, listNode);
          }
        }
      });
      if (parentList) {
        parentList.removeChild(listNode);
      }
    } else {
      const list = document.createElement(listType === "ul" ? "ul" : "ol");
      const listItem = document.createElement("li");
      listItem.appendChild(range.cloneContents());
      list.appendChild(listItem);
      range.deleteContents();
      range.insertNode(list);

      const br = document.createElement("br");
      if (list.parentNode) {
        list.parentNode.insertBefore(br, list.nextSibling);
      }
    }

    saveState();
    handleSelectionChange();
  };

  const applyQuote = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const blockquote = findParentNode(commonAncestor, ["BLOCKQUOTE"]);

    if (blockquote) {
      const parent = blockquote.parentNode;
      if (!parent) return;

      const tempDiv = document.createElement("div");
      while (blockquote.firstChild) {
        tempDiv.appendChild(blockquote.firstChild);
      }
      parent.replaceChild(tempDiv, blockquote);

      while (tempDiv.firstChild) {
        parent.insertBefore(tempDiv.firstChild, tempDiv);
      }
      parent.removeChild(tempDiv);
    } else {
      const newBlockquote = document.createElement("blockquote");
      newBlockquote.appendChild(range.extractContents());
      range.insertNode(newBlockquote);

      if (newBlockquote.nextSibling) {
        const br = document.createElement("br");
        newBlockquote.parentNode?.insertBefore(br, newBlockquote.nextSibling);
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);

    saveState();
    handleSelectionChange();
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const linkNode = findParentNode(range.commonAncestorContainer, ["A"]);

    const selectedText = range.toString();
    const url = linkNode ? linkNode.getAttribute("href") || "" : "";
    const linkText = linkNode ? linkNode.textContent || "" : selectedText;

    setLinkDialogState({
      showDialog: true,
      url,
      linkText,
      selectedText,
    });

    lastCaretPosition.current = range.cloneRange();
  };

  const handleInsertLink = () => {
    if (!lastCaretPosition.current) return;

    const range = lastCaretPosition.current;
    const linkNode = findParentNode(range.commonAncestorContainer, ["A"]);

    if (linkNode) {
      linkNode.setAttribute("href", linkDialogState.url);
      linkNode.setAttribute("title", linkDialogState.url);
    } else {
      const newLink = document.createElement("a");
      newLink.href = formatUrl(linkDialogState.url);
      newLink.title = formatUrl(linkDialogState.url);
      newLink.textContent = linkDialogState.linkText || linkDialogState.url;
      range.deleteContents();
      range.insertNode(newLink);
    }

    setLinkDialogState({
      showDialog: false,
      url: "",
      linkText: "",
      selectedText: "",
    });
    saveState();

    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleUnlink = () => {
    if (!lastCaretPosition.current) return;

    const range = lastCaretPosition.current;
    const linkNode = findParentNode(range.commonAncestorContainer, ["A"]);

    if (linkNode) {
      const textNode = document.createTextNode(linkNode.textContent || "");
      linkNode.parentNode?.replaceChild(textNode, linkNode);
    }

    setLinkDialogState({
      showDialog: false,
      url: "",
      selectedText: "",
      linkText: "",
    });
    saveState();

    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const resetStyling = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    const node = range.startContainer;
    const offset = range.startOffset;

    if (
      node.nodeType === Node.TEXT_NODE &&
      offset === 0 &&
      node.parentElement
    ) {
      const parent = node.parentElement;
      if (
        parent.tagName === "B" ||
        parent.tagName === "EM" ||
        parent.tagName === "STRIKE" ||
        parent.classList.contains("font-bold") ||
        parent.classList.contains("italic") ||
        parent.classList.contains("line-through")
      ) {
        const newTextNode = document.createTextNode("");
        parent.parentNode?.insertBefore(newTextNode, parent);
        range.setStart(newTextNode, 0);
        range.setEnd(newTextNode, 0);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };
  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const text = target.textContent || "";
    const lastChar = text[text.length - 1];

    resetStyling();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setMentionPosition({
        top: rect.bottom + window.scrollY + 30,
        left: rect.left + window.scrollX + 10,
      });

      lastCaretPosition.current = range.cloneRange();

      if (lastChar === "@") {
        setShowMentions(true);
        setMentionFilter("");
      } else if (text.includes("@")) {
        const lastAtSymbolIndex = text.lastIndexOf("@");
        const filterText = text.slice(lastAtSymbolIndex + 1).trim();
        setMentionFilter(filterText);
      } else {
        setShowMentions(false);
        setMentionFilter("");
      }
    }

    saveState();
  }, []);

  const insertMention = (user: { id: string; username: string }) => {
    if (lastCaretPosition.current) {
      const range = lastCaretPosition.current;
      const textNode = range.startContainer as Text;
      const startOffset = range.startOffset;

      const atSymbolIndex = textNode.data.lastIndexOf("@", startOffset);
      if (atSymbolIndex === -1) return;

      range.setStart(textNode, atSymbolIndex);
      range.setEnd(textNode, startOffset);
      range.deleteContents();

      const mentionNode = document.createElement("a");
      mentionNode.contentEditable = "false";
      mentionNode.className =
        "bg-blue-100 px-1 rounded no-underline text-slate-800 font-normal hover:underline";
      mentionNode.textContent = `@${user.username}`;
      mentionNode.setAttribute("data-user-id", user.id);

      mentionNode.onmouseover = () => {
        console.log(user);
      };

      range.insertNode(mentionNode);

      const newRange = document.createRange();
      newRange.setStartAfter(mentionNode);
      newRange.collapse(true);

      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      setShowMentions(false);
      saveState();
    }
  };

  const saveState = () => {
    const turndownService = new TurndownService();
    turndownService.addRule("strikethrough", {
      filter: ["s", "del"],
      replacement: (content) => `~~${content}~~`,
    });
    turndownService.addRule("mentions", {
      filter: (node) => {
        return node.nodeName === "A" && node.hasAttribute("data-user-id");
      },
      replacement: (content, node) => {
        const userId = (node as HTMLElement).getAttribute("data-user-id");
        const username = content.replace("@", "");
        return `![mention_user](user_id:${userId}, username:${username})`;
      },
    });

    const htmlContent = editorRef.current?.innerHTML || "";
    console.log(htmlContent);
    const markdownText = turndownService.turndown(htmlContent);
    onChange(markdownText);
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
        (xhr: XMLHttpRequest) => {
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

      {/* toolbar */}
      <div className="flex items-center space-x-2 rounded-t-md border border-gray-300 bg-gray-100 p-1">
        <button
          onClick={() => applyStyle("b")}
          className={classNames(
            "tooltip rounded p-1",
            isBoldActive && !isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={isQuoteActive}
        >
          <CareIcon icon="l-bold" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Bold
          </span>
        </button>
        <button
          onClick={() => applyStyle("i")}
          className={classNames(
            "tooltip rounded p-1",
            isItalicActive && !isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={isQuoteActive}
        >
          <CareIcon icon="l-italic" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Italic
          </span>
        </button>
        <button
          onClick={() => applyStyle("s")}
          className={classNames(
            "tooltip rounded p-1",
            isStrikethroughActive && !isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={isQuoteActive}
        >
          <CareIcon icon="l-text-strike-through" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Strikethrough
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>

        <button
          onClick={() => toggleList("ul")}
          className={classNames(
            "tooltip rounded p-1",
            isUnorderedListActive && !isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={isQuoteActive}
        >
          <CareIcon icon="l-list-ul" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Unordered List
          </span>
        </button>
        <button
          onClick={() => toggleList("ol")}
          className={classNames(
            "tooltip rounded p-1",
            isOrderedListActive && !isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={isQuoteActive}
        >
          <CareIcon icon="l-list-ol" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Ordered List
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={applyQuote}
          className={classNames(
            "tooltip rounded p-1",
            isQuoteActive ? "bg-primary-700 text-white" : "bg-gray-200",
          )}
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
      </div>

      {/* editor */}
      <div className="overflow-y-scroll border border-x-gray-300 bg-white p-2 focus:outline-none focus:ring-1 focus:ring-primary-500">
        <div
          id="doctor_notes_textarea"
          ref={editorRef}
          contentEditable
          className="prose max-h-[300px] min-h-[50px] max-w-full overflow-auto text-sm outline-none prose-a:text-blue-500"
          onInput={handleInput}
        />
        <div className="flex gap-2">
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
      </div>

      {/* toolbar-2 */}
      <div className="flex items-center space-x-2 rounded-b-md border border-gray-300 bg-gray-100 pl-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="tooltip rounded p-1 hover:bg-gray-200"
        >
          <CareIcon icon="l-paperclip" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Attach File
          </span>
        </button>
        <div className="mx-2 h-6 border-l border-gray-400"></div>
        <button
          onClick={() => setModalOpenForCamera(true)}
          className="tooltip rounded p-1 hover:bg-gray-200"
        >
          <CareIcon icon="l-camera" className="text-lg" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Camera
          </span>
        </button>
        <button
          onClick={() => setModalOpenForAudio(true)}
          className="tooltip rounded p-1 hover:bg-gray-200"
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
            <ButtonV2 variant="secondary" onClick={handleUnlink}>
              Remove Link
            </ButtonV2>
            <Submit onClick={handleInsertLink}>Apply Link</Submit>
          </div>
        </div>
      </DialogModal>
    </div>
  );
};

export default RichTextEditor;
