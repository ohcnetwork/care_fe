import { useRef, useReducer, useEffect, useState } from "react";
import {
  FaBold,
  FaItalic,
  FaListOl,
  FaListUl,
  FaUndo,
  FaRedo,
  FaLink,
  FaUnlink,
  FaQuoteRight,
} from "react-icons/fa";
import TurndownService from "turndown";
import ReactMarkdown from "react-markdown";

interface RichTextEditorProps {
  markdown?: string;
  onChange?: (markdown: string, htmlCode: string) => void;
}

interface EditorState {
  isBoldActive: boolean;
  isItalicActive: boolean;
  isQuoteActive: boolean;
  isUnorderedListActive: boolean;
  isOrderedListActive: boolean;
}

type EditorAction =
  | { type: "SET_BOLD_ACTIVE"; payload: boolean }
  | { type: "SET_ITALIC_ACTIVE"; payload: boolean }
  | { type: "SET_QUOTE_ACTIVE"; payload: boolean }
  | { type: "SET_UNORDERED_LIST_ACTIVE"; payload: boolean }
  | { type: "SET_ORDERED_LIST_ACTIVE"; payload: boolean }
  | { type: "UPDATE_ALL"; payload: Partial<EditorState> };

const initialState: EditorState = {
  isBoldActive: false,
  isItalicActive: false,
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
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);

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

    dispatch({
      type: "UPDATE_ALL",
      payload: {
        isBoldActive: isBold,
        isItalicActive: isItalic,
        isQuoteActive: isQuote,
        isUnorderedListActive,
        isOrderedListActive,
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

  const saveState = () => {
    if (editorRef.current) {
      undoStack.current.push(editorRef.current.innerHTML);
      redoStack.current = [];
      updatePreview();
    }
  };

  const updatePreview = () => {
    const turndownService = new TurndownService();
    const htmlContent = editorRef.current?.innerHTML || "";
    const markdownText = turndownService.turndown(htmlContent);
    setMarkdown(markdownText);
    setHtmlCode(htmlContent);
  };

  const undo = () => {
    if (undoStack.current.length > 0 && editorRef.current) {
      redoStack.current.push(editorRef.current.innerHTML);
      const lastState = undoStack.current.pop();
      if (lastState && editorRef.current) {
        editorRef.current.innerHTML = lastState;
        updatePreview();
      }
    }
  };

  const redo = () => {
    if (redoStack.current.length > 0 && editorRef.current) {
      undoStack.current.push(editorRef.current.innerHTML);
      const nextState = redoStack.current.pop();
      if (nextState && editorRef.current) {
        editorRef.current.innerHTML = nextState;
        updatePreview();
      }
    }
  };

  const applyStyle = (style: "bold" | "italic") => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (state.isQuoteActive && (style === "bold" || style === "italic")) return;

    const tagName = style === "bold" ? "strong" : "em";
    const tagNode = document.createElement(tagName);
    tagNode.appendChild(range.extractContents());
    range.insertNode(tagNode);

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

  const applyHeading = (level: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const heading = document.createElement(`h${level}`);
    heading.appendChild(range.extractContents());
    range.insertNode(heading);
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

  return (
    <div className="mx-auto flex rounded-lg bg-white p-8 shadow-lg">
      <div className="w-1/2 pr-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applyStyle("bold")}
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
              onClick={() => applyStyle("italic")}
              className={`rounded p-2 ${
                state.isItalicActive && !state.isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={state.isQuoteActive}
            >
              <FaItalic className="text-lg" />
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

          <select
            onChange={(e) => applyHeading(e.target.value)}
            className="rounded bg-gray-200 p-2"
          >
            <option value="" defaultChecked>
              Heading
            </option>
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="4">H4</option>
            <option value="5">H5</option>
            <option value="6">H6</option>
          </select>

          <div className="mx-2 h-6 border-l border-gray-400"></div>

          <div className="flex items-center space-x-2">
            <button onClick={undo} className="rounded bg-gray-200 p-2">
              <FaUndo className="text-lg" />
            </button>
            <button onClick={redo} className="rounded bg-gray-200 p-2">
              <FaRedo className="text-lg" />
            </button>
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          className="prose min-h-64 border border-gray-300 p-4 focus:outline-none"
          onInput={updatePreview}
        ></div>
      </div>
      <div className="w-1/2 pl-4">
        <div className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">Markdown Preview:</h2>
          <ReactMarkdown className="prose">{markdown}</ReactMarkdown>
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
