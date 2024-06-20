import { useRef, useState, useEffect } from "react";
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

const RichTextEditor: React.FC<RichTextEditorProps> = () => {
  const [markdown, setMarkdown] = useState<string>("");
  const [htmlCode, setHtmlCode] = useState<string>("");
  const editorRef = useRef<HTMLDivElement>(null);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [isBoldActive, setIsBoldActive] = useState<boolean>(false);
  const [isItalicActive, setIsItalicActive] = useState<boolean>(false);
  const [isQuoteActive, setIsQuoteActive] = useState<boolean>(false);
  const [isUnorderedListActive, setIsUnorderedListActive] =
    useState<boolean>(false);
  const [isOrderedListActive, setIsOrderedListActive] =
    useState<boolean>(false);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    setIsBoldActive(document.queryCommandState("bold"));
    setIsItalicActive(document.queryCommandState("italic"));
    setIsQuoteActive(
      selection.focusNode?.parentElement?.tagName === "BLOCKQUOTE",
    );

    const listNode = findParentNode(selection.anchorNode, ["UL", "OL"]);
    setIsUnorderedListActive(listNode?.nodeName === "UL" ?? false);
    setIsOrderedListActive((listNode && listNode.nodeName === "OL") ?? false);
  };

  const saveState = () => {
    if (editorRef.current) {
      undoStack.current.push(editorRef.current.innerHTML);
      redoStack.current = [];
      updatePreview();
    }
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

    if (isQuoteActive && (style === "bold" || style === "italic")) return;

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
    document.execCommand("formatBlock", false, `<h${level}>`);
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

  const handleLineBreak = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);
      const container = range.startContainer.parentNode as HTMLElement;

      if (container && container.tagName === "LI") {
        const listNode = container.parentNode as HTMLElement;
        if (listNode) {
          const newList = document.createElement(listNode.tagName);
          const newListItem = document.createElement("li");

          newListItem.appendChild(range.extractContents());
          newList.appendChild(newListItem);
          if (listNode.parentNode) {
            listNode.insertBefore(newListItem, container.nextSibling);
          }

          range.setStart(newListItem, 0);
          range.setEnd(newListItem, 0);

          if (
            container &&
            container.textContent &&
            container.textContent.trim() === ""
          ) {
            if (listNode.parentNode) {
              listNode.removeChild(container);
            }
          }
        }
      } else {
        if (isUnorderedListActive || isOrderedListActive) {
          document.execCommand("insertHTML", false, "<br><br>");
        } else {
          document.execCommand("insertLineBreak");
        }
      }

      saveState();
    }
  };

  const updatePreview = () => {
    const turndownService = new TurndownService();
    const htmlContent = editorRef.current?.innerHTML || "";
    const markdownText = turndownService.turndown(htmlContent);
    setMarkdown(markdownText);
    setHtmlCode(htmlContent);
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

  return (
    <div className="mx-auto flex rounded-lg bg-white p-8 shadow-lg">
      <div className="w-1/2 pr-4">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => applyStyle("bold")}
              className={`rounded p-2 ${
                isBoldActive && !isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={isQuoteActive}
            >
              <FaBold className="text-lg" />
            </button>
            <button
              onClick={() => applyStyle("italic")}
              className={`rounded p-2 ${
                isItalicActive && !isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={isQuoteActive}
            >
              <FaItalic className="text-lg" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleList("ul")}
              className={`rounded p-2 ${
                isUnorderedListActive && !isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={isQuoteActive}
            >
              <FaListUl className="text-lg" />
            </button>
            <button
              onClick={() => toggleList("ol")}
              className={`rounded p-2 ${
                isOrderedListActive && !isQuoteActive
                  ? "bg-primary-700 text-white"
                  : "bg-gray-200"
              }`}
              disabled={isQuoteActive}
            >
              <FaListOl className="text-lg" />
            </button>
          </div>

          <button
            onClick={applyQuote}
            className={`rounded p-2 ${
              isQuoteActive ? "bg-primary-700 text-white" : "bg-gray-200"
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
          onKeyDown={handleLineBreak}
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
