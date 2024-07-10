import {
  useRef,
  useReducer,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
} from "react";
import { FaQuoteRight } from "react-icons/fa";
import { GoMention } from "react-icons/go";
import TurndownService from "turndown";
import MentionsDropdown from "./MentionDropdown";
import { ExtImage } from "../../Patient/FileUpload";
import imageCompression from "browser-image-compression";
import DialogModal from "../Dialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2, { Submit } from "../components/ButtonV2";
import FileUpload from "./FileUpload";
import CameraCaptureModal from "./CameraCaptureModal";
import AudioRecorder from "./AudioRecorder";
import { classNames } from "../../../Utils/utils";

interface RichTextEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onAddNote: () => void;
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

type EditorAction =
  | { type: "SET_BOLD_ACTIVE"; payload: boolean }
  | { type: "SET_ITALIC_ACTIVE"; payload: boolean }
  | { type: "SET_STRIKETHROUGH_ACTIVE"; payload: boolean }
  | { type: "SET_QUOTE_ACTIVE"; payload: boolean }
  | { type: "SET_UNORDERED_LIST_ACTIVE"; payload: boolean }
  | { type: "SET_ORDERED_LIST_ACTIVE"; payload: boolean }
  | { type: "UPDATE_ALL"; payload: Partial<EditorState> };

const initialState: EditorState = {
  isBoldActive: false,
  isItalicActive: false,
  isStrikethroughActive: false,
  isQuoteActive: false,
  isUnorderedListActive: false,
  isOrderedListActive: false,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_BOLD_ACTIVE":
      return { ...state, isBoldActive: action.payload };
    case "SET_ITALIC_ACTIVE":
      return { ...state, isItalicActive: action.payload };
    case "SET_STRIKETHROUGH_ACTIVE":
      return { ...state, isStrikethroughActive: action.payload };
    case "SET_QUOTE_ACTIVE":
      return { ...state, isQuoteActive: action.payload };
    case "SET_UNORDERED_LIST_ACTIVE":
      return { ...state, isUnorderedListActive: action.payload };
    case "SET_ORDERED_LIST_ACTIVE":
      return { ...state, isOrderedListActive: action.payload };
    case "UPDATE_ALL":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  // initialMarkdown = "",
  onChange,
  onAddNote,
  isAuthorized = true,
}) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const editorRef = useRef<HTMLDivElement>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const lastCaretPosition = useRef<Range | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modalOpenForCamera, setModalOpenForCamera] = useState(false);
  const [modalOpenForAudio, setModalOpenForAudio] = useState(false);
  const [linkDialogState, setLinkDialogState] = useState({
    showDialog: false,
    url: "",
    selectedText: "",
  });

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const isBold =
      isParentTag(selection.focusNode, "STRONG") ||
      isParentTag(selection.focusNode, "B");
    const isItalic =
      isParentTag(selection.focusNode, "EM") ||
      isParentTag(selection.focusNode, "I");
    const isQuote = isParentTag(selection.focusNode, "BLOCKQUOTE");

    const listNode = findParentNode(selection.anchorNode, ["UL", "OL"]);
    const isUnorderedListActive = listNode?.nodeName === "UL" ?? false;
    const isOrderedListActive =
      (listNode && listNode.nodeName === "OL") ?? false;
    const isStrikethrough =
      isParentTag(selection.focusNode, "S") ||
      isParentTag(selection.focusNode, "DEL") ||
      (selection.focusNode?.parentElement &&
        selection.focusNode.parentElement.classList.contains("line-through"));

    dispatch({
      type: "UPDATE_ALL",
      payload: {
        isBoldActive: isBold,
        isItalicActive: isItalic,
        isQuoteActive: isQuote,
        isUnorderedListActive,
        isOrderedListActive,
        isStrikethroughActive: isStrikethrough ?? false,
      },
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

      while (parentNode.firstChild) {
        parent.insertBefore(parentNode.firstChild, parentNode);
      }
      parent.removeChild(parentNode);
    } else {
      const node = document.createElement(styleTag);
      node.className = styleClass;
      node.appendChild(range.extractContents());
      range.insertNode(node);
    }

    selection.removeAllRanges();
    selection.addRange(range);

    saveState();
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
  };

  const handleLink = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const linkNode = findParentNode(range.commonAncestorContainer, ["A"]);

    const selectedText = range.toString();
    const url = linkNode ? linkNode.getAttribute("href") || "" : "";

    setLinkDialogState({
      showDialog: true,
      url,
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
    } else {
      const newLink = document.createElement("a");
      newLink.href = linkDialogState.url;
      newLink.textContent = linkDialogState.selectedText || linkDialogState.url;
      range.deleteContents();
      range.insertNode(newLink);
    }

    setLinkDialogState({ showDialog: false, url: "", selectedText: "" });
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

    setLinkDialogState({ showDialog: false, url: "", selectedText: "" });
    saveState();

    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const text = target.textContent || "";
    const lastChar = text[text.length - 1];

    if (lastChar === "@") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY + 30,
          left: rect.left + window.scrollX + 10,
        });
        setShowMentions(true);
        lastCaretPosition.current = range.cloneRange();
      }
    } else {
      setShowMentions(false);
    }

    saveState();
  }, []);

  const insertMention = (user: { id: string; username: string }) => {
    if (lastCaretPosition.current) {
      const range = lastCaretPosition.current;
      range.setStart(range.startContainer, range.startOffset - 1);
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
    const markdownText = turndownService.turndown(htmlContent);
    onChange(markdownText);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) {
      return;
    }
    const f = e.target.files[0];
    const fileName = f.name;
    setFile(e.target.files[0]);

    const ext: string = fileName.split(".")[1];

    if (ExtImage.includes(ext)) {
      const options = {
        initialQuality: 0.6,
        alwaysKeepResolution: true,
      };
      imageCompression(f, options).then((compressedFile: File) => {
        setFile(compressedFile);
      });
      return;
    }
    setFile(f);
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
            state.isBoldActive && !state.isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={state.isQuoteActive}
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
            state.isItalicActive && !state.isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={state.isQuoteActive}
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
            state.isStrikethroughActive && !state.isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={state.isQuoteActive}
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
            state.isUnorderedListActive && !state.isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={state.isQuoteActive}
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
            state.isOrderedListActive && !state.isQuoteActive
              ? "bg-primary-700 text-white"
              : "bg-gray-200",
          )}
          disabled={state.isQuoteActive}
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
            state.isQuoteActive ? "bg-primary-700 text-white" : "bg-gray-200",
          )}
        >
          <FaQuoteRight className="text-sm" />
          <span className="tooltip-text tooltip-top -translate-x-1/2">
            Quote
          </span>
        </button>

        <button
          onClick={handleLink}
          className="tooltip rounded bg-gray-200 p-2"
        >
          <CareIcon icon="l-link" className="text-md" />
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
        <FileUpload file={file} setFile={setFile} />
      </div>

      {/* toolbar-2 */}
      <div className="flex items-center space-x-2 rounded-b-md border border-gray-300 bg-gray-100 pl-2 ">
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
          <GoMention className="text-sm" />
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
            onClick={() => {
              onAddNote();
              editorRef.current!.innerHTML = "";
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
          {linkDialogState.selectedText && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selected Text:
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {linkDialogState.selectedText}
              </p>
            </div>
          )}
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
