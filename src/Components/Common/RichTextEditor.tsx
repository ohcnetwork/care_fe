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
  FaFile,
} from "react-icons/fa";
import { FaCamera } from "react-icons/fa6";
import { AiFillAudio } from "react-icons/ai";
import { RxCross2 } from "react-icons/rx";
import { GoMention } from "react-icons/go";
import { MdAttachFile } from "react-icons/md";
import TurndownService from "turndown";
import MentionsDropdown from "./MentionDropdown";
import { ExtImage, StateInterface } from "../Patient/FileUpload";
import imageCompression from "browser-image-compression";
import { CreateFileResponse, FileUploadModel } from "../Patient/models";
import uploadFile from "../../Utils/request/uploadFile";
import * as Notification from "../../Utils/Notifications.js";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import FilePreviewDialog from "./FilePreviewDialog";
import DialogModal from "./Dialog";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Webcam from "react-webcam";
import ButtonV2, { Submit } from "./components/ButtonV2";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import useRecorder from "../../Utils/useRecorder";

interface RichTextEditorProps {
  initialMarkdown?: string;
  onChange: (markdown: string) => void;
  onAddNote: () => void;
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
      if (selection && selection.rangeCount > 0 && editorRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY + 50,
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
    onChange(markdownText);
  };

  const onFileChange = (e: any): any => {
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
    <div className="relative mx-auto">
      {/* camera capture model */}
      <CameraCaptureModal
        open={modalOpenForCamera}
        onClose={() => setModalOpenForCamera(false)}
        setFile={setFile}
      />

      {/* audio recording */}
      <AudioRecorder
        setFile={setFile}
        modalOpenForAudio={modalOpenForAudio}
        setModalOpenForAudio={setModalOpenForAudio}
      />

      {/* toolbar */}
      <div className="relative flex w-[48vw] items-center rounded-t-md border border-gray-300 bg-gray-100 p-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => applyStyle("b")}
            className={`rounded p-2 ${
              state.isBoldActive && !state.isQuoteActive
                ? "bg-primary-700 text-white"
                : "bg-gray-200"
            }`}
            disabled={state.isQuoteActive}
          >
            <FaBold className="text-" />
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
            <FaItalic className="text-" />
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
            <FaStrikethrough className="text-" />
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
            <FaListUl className="text-" />
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
            <FaListOl className="text-" />
          </button>
        </div>

        <button
          onClick={applyQuote}
          className={`rounded p-2 ${
            state.isQuoteActive ? "bg-primary-700 text-white" : "bg-gray-200"
          }`}
        >
          <FaQuoteRight className="text-" />
        </button>

        <div className="flex items-center space-x-2">
          <button onClick={handleLink} className="rounded bg-gray-200 p-2">
            <FaLink className="text-" />
          </button>
          <button onClick={handleUnlink} className="rounded bg-gray-200 p-2">
            <FaUnlink className="text-" />
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
            <GoMention className="text-" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded p-1 hover:bg-gray-200"
          >
            <MdAttachFile className="text-lg text-gray-700" />
          </button>
          <button
            onClick={() => setModalOpenForCamera(true)}
            className="rounded p-1 hover:bg-gray-200"
          >
            <FaCamera className="text-lg text-gray-700" />
          </button>
          <button
            onClick={() => setModalOpenForAudio(true)}
            className="rounded p-1 hover:bg-gray-200"
          >
            <AiFillAudio className="text-lg text-gray-700" />
          </button>
          <input
            ref={fileInputRef}
            onChange={onFileChange}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,text/plain,text/csv,application/rtf,application/msword,application/vnd.oasis.opendocument.text,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/pdf"
          />
        </div>
        <div className="grow"></div>
        <Submit
          onClick={() => {
            onAddNote();
            editorRef.current!.innerHTML = "";
          }}
          className="rounded bg-primary-500 p-2 text-white"
        >
          <CareIcon icon="l-message" className="text-lg" />
        </Submit>
      </div>

      {/* editor */}
      <div
        ref={editorRef}
        contentEditable
        className="prose relative min-h-[85px] overflow-y-scroll rounded-b-md border border-gray-300 p-3 focus:outline-none focus:ring-1 focus:ring-primary-500"
        onInput={handleInput}
      />

      <FileUpload file={file} setFile={setFile} />

      {showMentions && (
        <MentionsDropdown
          onSelect={insertMention}
          position={mentionPosition}
          editorRef={editorRef}
        />
      )}
    </div>
  );
};

export default RichTextEditor;

const FileUpload = ({
  file,
  setFile,
}: {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [file_state, setFileState] = useState<StateInterface>({
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 4,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
    rotation: 0,
  });
  const [fileUrl, setFileUrl] = useState<string>("");
  const [downloadURL, setDownloadURL] = useState("");
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileError, setUploadFileError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const file_type = "NOTES";
  const [files, setFiles] = useState<FileUploadModel[]>([]);
  const [noteId, setNoteId] = useState<string>(
    "40faecc6-6199-48cd-bc2a-dd9e73b920f9",
  );
  console.log(setNoteId);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const res = await request(routes.viewUpload, {
      query: {
        file_type: file_type,
        associating_id: noteId,
        is_archived: false,
        limit: 100,
        offset: 0,
      },
    });

    if (res.data) {
      setFiles(res.data.results);
    }

    setIsLoading(false);
  }, [noteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uploadfile = async (data: CreateFileResponse) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const f = file;
    if (!f) return;
    const newFile = new File([f], `${internal_name}`);
    return new Promise<void>((resolve, reject) => {
      uploadFile(
        url,
        newFile,
        "PUT",
        { "Content-Type": file?.type },
        (xhr: XMLHttpRequest) => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadStarted(false);
            setFile(null);
            fetchData();
            Notification.Success({
              msg: "File Uploaded Successfully",
            });
            setUploadFileError("");
            resolve();
          } else {
            Notification.Error({
              msg: "Error Uploading File: " + xhr.statusText,
            });
            setUploadStarted(false);
            reject();
          }
        },
        setUploadPercent,
        () => {
          Notification.Error({
            msg: "Error Uploading File: Network Error",
          });
          setUploadStarted(false);
          reject();
        },
      );
    });
  };

  const validateFileUpload = () => {
    const f = file;
    if (f === undefined || f === null) {
      setUploadFileError("Please choose a file to upload");
      return false;
    }
    if (f.size > 10e7) {
      setUploadFileError("Maximum size of files is 100 MB");
      return false;
    }
    return true;
  };

  const markUploadComplete = (data: CreateFileResponse) => {
    return request(routes.editUpload, {
      body: { upload_completed: true },
      pathParams: {
        id: data.id,
        fileType: file_type,
        associatingId: noteId,
      },
    });
  };

  const handleUpload = async () => {
    if (!validateFileUpload()) return;
    const f = file;
    if (!f) return;

    const category = f.type.includes("audio") ? "AUDIO" : "UNSPECIFIED";
    setUploadStarted(true);

    const { data } = await request(routes.createUpload, {
      body: {
        original_name: f.name,
        file_type: file_type,
        name: f.name,
        associating_id: noteId,
        file_category: category,
        mime_type: f.type,
      },
    });

    if (data) {
      await uploadfile(data);
      await markUploadComplete(data);
      await fetchData();
    }
    setFile(null);
  };

  useEffect(() => {
    if (file) {
      handleUpload();
    }
  }, [file]);

  const getExtension = (url: string) => {
    const extension = url.split("?")[0].split(".").pop();
    return extension ?? "";
  };
  const downloadFileUrl = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setDownloadURL(URL.createObjectURL(blob));
      });
  };

  const loadFile = async (id: string) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const { data } = await request(routes.retrieveUpload, {
      query: {
        file_type: file_type,
        associating_id: noteId,
      },
      pathParams: { id },
    });

    if (!data) return;

    const signedUrl = data.read_signed_url as string;
    const extension = getExtension(signedUrl);

    setFileState({
      ...file_state,
      open: true,
      name: data.name as string,
      extension,
      isImage: ExtImage.includes(extension),
    });
    downloadFileUrl(signedUrl);
    setFileUrl(signedUrl);
  };

  const handleClose = () => {
    setDownloadURL("");
    setFileState({
      ...file_state,
      open: false,
      zoom: 4,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    });
  };

  return (
    <div>
      <FilePreviewDialog
        show={file_state.open}
        fileUrl={fileUrl}
        file_state={file_state}
        setFileState={setFileState}
        downloadURL={downloadURL}
        onClose={handleClose}
        fixedWidth={false}
        className="h-[80vh] w-full md:h-screen"
      />
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {files.map((file) => (
              <div
                key={file.id}
                className="relative mt-2 h-24 w-24 cursor-pointer rounded-md bg-gray-100 shadow-sm hover:bg-gray-200"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    request(routes.deleteUpload, {
                      pathParams: {
                        id: file.id!,
                        fileType: file_type,
                        associatingId: noteId,
                      },
                    }).then(() => fetchData());
                  }}
                  className="absolute -right-1 -top-1 z-10 rounded-full bg-gray-300 p-1 text-gray-800 hover:bg-gray-400 "
                >
                  <RxCross2 size={12} />
                </button>
                <div
                  className="flex h-full w-full flex-col items-center justify-center p-2"
                  onClick={() => loadFile(file.id!)}
                >
                  <FaFile className="mb-2 text-3xl text-gray-400" />
                  <span className="line-clamp-2 text-center text-xs text-gray-600">
                    {file.name}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="mt-4">
        {uploadFileError && (
          <p className="mt-2 text-sm text-red-500">{uploadFileError}</p>
        )}
        {uploadStarted && (
          <div className="mt-2">
            <div className="h-2 w-full rounded bg-gray-200">
              <div
                className="h-full rounded bg-primary-700"
                style={{ width: `${uploadPercent}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-700">
              {uploadPercent}% uploaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const CameraCaptureModal = ({
  open,
  onClose,
  setFile,
}: {
  open: boolean;
  onClose: () => void;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [previewImage, setPreviewImage] = useState(null);
  const webRef = useRef<any>(null);
  const FACING_MODE_USER = "user";
  const FACING_MODE_ENVIRONMENT = { exact: "environment" };
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;

  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;

  const [facingMode, setFacingMode] = useState<"front" | "rear">("front");
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode:
      facingMode === "front" ? FACING_MODE_USER : FACING_MODE_ENVIRONMENT,
  };

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "front" ? "rear" : "front"));
  }, []);

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    const canvas = webRef.current.getCanvas();
    canvas?.toBlob((blob: Blob) => {
      const extension = blob.type.split("/").pop();
      const myFile = new File([blob], `image.${extension}`, {
        type: blob.type,
      });
      setFile(myFile);
    });
  };

  const onUpload = () => {
    setFile(null);
    onClose();
  };

  return (
    <DialogModal
      show={open}
      title={
        <div className="flex flex-row">
          <div className="rounded-full bg-primary-100 px-5 py-4">
            <CareIcon
              icon="l-camera-change"
              className="text-lg text-primary-500"
            />
          </div>
          <div className="m-4">
            <h1 className="text-xl text-black "> Camera</h1>
          </div>
        </div>
      }
      className="max-w-2xl"
      onClose={onClose}
    >
      <div>
        {!previewImage ? (
          <div className="m-3">
            <Webcam
              forceScreenshotSourceSize
              screenshotQuality={1}
              audio={false}
              screenshotFormat="image/png"
              ref={webRef}
              videoConstraints={videoConstraints}
            />
          </div>
        ) : (
          <div className="m-3">
            <img src={previewImage} />
          </div>
        )}
      </div>

      {/* buttons for mobile screens */}
      <div className="m-4 flex justify-evenly sm:hidden ">
        <div>
          {!previewImage ? (
            <ButtonV2 onClick={handleSwitchCamera} className="m-2">
              switch
            </ButtonV2>
          ) : (
            <></>
          )}
        </div>
        <div>
          {!previewImage ? (
            <>
              <div>
                <ButtonV2
                  onClick={() => {
                    captureImage();
                  }}
                  className="m-2"
                >
                  capture
                </ButtonV2>
              </div>
            </>
          ) : (
            <>
              <div className="flex space-x-2">
                <ButtonV2
                  onClick={() => {
                    setPreviewImage(null);
                  }}
                  className="m-2"
                >
                  retake
                </ButtonV2>
                <Submit onClick={onUpload} className="m-2">
                  submit
                </Submit>
              </div>
            </>
          )}
        </div>
        <div className="sm:flex-1">
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              onClose();
            }}
            className="m-2"
          >
            close
          </ButtonV2>
        </div>
      </div>
      {/* buttons for laptop screens */}
      <div className={`${isLaptopScreen ? " " : " hidden "}`}>
        <div className="m-4 flex lg:hidden">
          <ButtonV2 onClick={handleSwitchCamera}>
            <CareIcon icon="l-camera-change" className="text-lg" />
            switch camera
          </ButtonV2>
        </div>

        <div className="flex justify-end  gap-2 p-4">
          <div>
            {!previewImage ? (
              <>
                <div>
                  <ButtonV2
                    onClick={() => {
                      captureImage();
                    }}
                  >
                    <CareIcon icon="l-capture" className="text-lg" />
                    capture
                  </ButtonV2>
                </div>
              </>
            ) : (
              <>
                <div className="flex space-x-2">
                  <ButtonV2
                    onClick={() => {
                      setPreviewImage(null);
                    }}
                  >
                    retake
                  </ButtonV2>
                  <Submit onClick={onUpload}>submit</Submit>
                </div>
              </>
            )}
          </div>
          <div className="sm:flex-1" />
          <ButtonV2
            variant="secondary"
            onClick={() => {
              setPreviewImage(null);
              onClose();
            }}
          >
            close camera
          </ButtonV2>
        </div>
      </div>
    </DialogModal>
  );
};

const AudioRecorder = ({
  setFile,
  modalOpenForAudio,
  setModalOpenForAudio,
}: {
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  modalOpenForAudio: boolean;
  setModalOpenForAudio: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [audioBlobExists, setAudioBlobExists] = useState(false);
  const [resetAudioRecording, setAudioResetRecording] = useState(false);
  const [isMicPermission, setIsMicPermission] = useState(true);
  const [audioBlob, setAudioBlob] = useState<Blob>();

  const handleAudioUpload = () => {
    if (!audioBlob) return;
    const f = new File([audioBlob], "audio.mp3", {
      type: audioBlob.type,
    });
    setFile(f);
    audioBlobExists && setAudioBlobExists(false);
  };

  useEffect(() => {
    if (modalOpenForAudio) {
      setAudioBlobExists(false);
      setAudioResetRecording(true);
      startRecording();
    }
  }, [modalOpenForAudio]);

  const [
    audioURL,
    isRecording,
    startRecording,
    stopRecording,
    newBlob,
    resetRecording,
  ] = useRecorder(setIsMicPermission);
  const [time, setTime] = useState(0);
  useEffect(() => {
    setAudioBlob(newBlob);
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else {
      clearInterval(interval);
      setTime(0);
    }
    if (resetAudioRecording) {
      resetRecording();
      setAudioResetRecording(false);
    }
    return () => clearInterval(interval);
  }, [isRecording, newBlob, resetAudioRecording]);

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const permissions = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setIsMicPermission(permissions.state === "granted");
      } catch (error) {
        setIsMicPermission(false);
      }
    };

    checkMicPermission();

    return () => {
      setIsMicPermission(true);
    };
  }, []);

  const deleteAudioBlob = () => {
    setAudioBlobExists(false);
    setAudioResetRecording(true);
    setModalOpenForAudio(false);
    setFile(null);
  };

  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 lg:flex-row">
      {audioBlobExists && (
        <div className="flex w-full items-center md:w-auto">
          <ButtonV2
            variant="danger"
            className="w-full"
            onClick={() => {
              deleteAudioBlob();
            }}
          >
            <CareIcon icon="l-trash" className="h-4" /> Delete
          </ButtonV2>
        </div>
      )}
      <div className="flex flex-col items-center gap-4 md:flex-row md:flex-wrap lg:flex-nowrap">
        <div className="w-full md:w-auto">
          <div>
            {isRecording && (
              <>
                <div className="flex justify-end space-x-2">
                  <div className="flex bg-gray-100 p-2 text-primary-700">
                    <CareIcon
                      icon="l-record-audio"
                      className="mr-2 animate-pulse"
                    />
                    <div className="mx-2">
                      (
                      <span>
                        {("0" + Math.floor((time / 60000) % 60)).slice(-2)}:
                      </span>
                      <span>
                        {("0" + Math.floor((time / 1000) % 60)).slice(-2)}
                      </span>
                      )
                    </div>
                    recording...
                  </div>
                  <ButtonV2
                    onClick={() => {
                      stopRecording();
                      setAudioBlobExists(true);
                    }}
                  >
                    <CareIcon icon="l-microphone-slash" className="text-lg" />
                    stop
                  </ButtonV2>
                </div>
              </>
            )}
          </div>
          {audioURL && audioBlobExists && (
            <div className="my-4">
              <audio
                className="m-auto max-h-full max-w-full object-contain"
                src={audioURL}
                controls
              />{" "}
            </div>
          )}
        </div>

        {!audioBlobExists && !isMicPermission && (
          <span className="text-sm font-medium text-warning-500">
            <CareIcon
              icon="l-exclamation-triangle"
              className="mr-1 text-base"
            />
            Please allow browser permission before you start speaking
          </span>
        )}
      </div>
      {audioBlobExists && (
        <div className="flex w-full items-center md:w-auto">
          <ButtonV2 onClick={handleAudioUpload} className="w-full">
            <CareIcon icon="l-cloud-upload" className="text-xl" />
            Save
          </ButtonV2>
        </div>
      )}
    </div>
  );
};
