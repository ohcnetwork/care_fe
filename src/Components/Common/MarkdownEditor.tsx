import { useRef, useReducer, useEffect, useState, useCallback } from "react";
import {
  FaBold,
  FaItalic,
  FaListOl,
  FaListUl,
  FaLink,
  FaUnlink,
  FaStrikethrough,
  FaQuoteRight,
} from "react-icons/fa";
import { GoMention } from "react-icons/go";
// import { MdAttachFile } from "react-icons/md";
import TurndownService from "turndown";
import MentionsDropdown from "./MentionDropdown";
import MarkdownPreview from "./MarkdownPreview";

interface RichTextEditorProps {
  markdown?: string;
  onChange?: (markdown: string, htmlCode: string) => void;
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

const RichTextEditor: React.FC<RichTextEditorProps> = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const editorRef = useRef<HTMLDivElement>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const lastCaretPosition = useRef<Range | null>(null);

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
      isParentTag(selection.focusNode, "DEL");

    dispatch({
      type: "UPDATE_ALL",
      payload: {
        isBoldActive: isBold,
        isItalicActive: isItalic,
        isQuoteActive: isQuote,
        isUnorderedListActive,
        isOrderedListActive,
        isStrikethroughActive: isStrikethrough,
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
      node = node.parentNode;
      if (node && tagNames.includes(node.nodeName)) {
        return node as HTMLElement;
      }
    }
    return null;
  };

  const applyStyle = (style: "b" | "i" | "s") => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const node = document.createElement(style);
    node.appendChild(range.cloneContents());
    range.deleteContents();
    range.insertNode(node);

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
        const newListItem = document.createElement("li");
        newListItem.textContent = item.textContent;
        if (parentList) {
          parentList.insertBefore(newListItem, listNode);
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
    const blockquote = document.createElement("blockquote");
    blockquote.appendChild(range.extractContents());
    range.insertNode(blockquote);

    const br = document.createElement("br");
    if (blockquote.parentNode) {
      blockquote.parentNode.insertBefore(br, blockquote.nextSibling);
    }

    saveState();
  };

  const handleLink = () => {
    const userLink = prompt("Enter a URL");
    if (userLink) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const anchor = document.createElement("a");
      anchor.href = userLink.startsWith("http")
        ? userLink
        : `http://${userLink}`;
      anchor.textContent = range.toString();

      range.deleteContents();
      range.insertNode(anchor);
      saveState();
    }
  };

  const handleUnlink = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer.parentNode as HTMLElement;
    if (container && container.tagName === "A") {
      const parent = container.parentNode;
      while (container.firstChild) {
        if (parent) {
          parent.insertBefore(container.firstChild, container);
        }
      }
      if (parent) {
        parent.removeChild(container);
      }
    }
    saveState();
  };

  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const text = target.textContent || "";
    const lastChar = text[text.length - 1];

    if (lastChar === "@") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
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
      filter: ["del", "s"],
      replacement: (content) => `~${content}~`,
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
    turndownService.addRule("div", {
      filter: "div",
      replacement: function (content) {
        return content + "\n";
      },
    });

    const htmlContent = editorRef.current?.innerHTML || "";
    const markdownText = turndownService.turndown(htmlContent);
    setMarkdown(markdownText);
    setHtmlCode(htmlContent);
  };

  return (
    <div className="mx-auto flex rounded-lg bg-white p-8 shadow-lg">
      <div className="w-1/2 pr-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applyStyle("b")}
              className={`rounded p-2 ${
                state.isBoldActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaBold className="text-lg" />
            </button>
            <button
              onClick={() => applyStyle("i")}
              className={`rounded p-2 ${
                state.isItalicActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaItalic className="text-lg" />
            </button>
            <button
              onClick={() => applyStyle("s")}
              className={`rounded p-2 ${
                state.isStrikethroughActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaStrikethrough className="text-lg" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleList("ul")}
              className={`rounded p-2 ${
                state.isUnorderedListActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaListUl className="text-lg" />
            </button>
            <button
              onClick={() => toggleList("ol")}
              className={`rounded p-2 ${
                state.isOrderedListActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaListOl className="text-lg" />
            </button>
          </div>

          <button
            onClick={applyQuote}
            className={`rounded p-2 ${
              state.isQuoteActive ? "bg-primary-700 text-white" : "bg-gray-200"
            }`}
          >
            <FaQuoteRight className="text-lg" />
          </button>

          <div className="flex items-center space-x-2">
            <button onClick={handleLink} className="rounded bg-gray-200 p-2">
              <FaLink className="text-lg" />
            </button>
            <button onClick={handleUnlink} className="rounded bg-gray-200 p-2">
              <FaUnlink className="text-lg" />
            </button>
          </div>

          <div className="mx-2 h-6 border-l border-gray-400"></div>

          <div className="flex items-center space-x-2">
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
              className="rounded bg-gray-200 p-2"
            >
              <GoMention className="text-lg" />
            </button>
            {/* <button className="rounded bg-gray-200 p-2">
              <MdAttachFile className="text-lg" />
            </button> */}
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          className="prose min-h-64 border border-gray-300 p-4 focus:outline-none"
          onInput={handleInput}
        ></div>

        {showMentions && (
          <MentionsDropdown
            onSelect={insertMention}
            position={mentionPosition}
          />
        )}
      </div>
      <div className="w-1/2 pl-4">
        <div className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">Markdown Preview:</h2>
          <MarkdownPreview markdown={markdown} />
        </div>
        <div className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">Markdown Output:</h2>
          <pre className="border border-gray-300 bg-gray-100 p-4">
            {markdown}
          </pre>
        </div>
        <div className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">HTML Code:</h2>
          <pre className="text-wrap border border-gray-300 bg-gray-100 p-4">
            {htmlCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
