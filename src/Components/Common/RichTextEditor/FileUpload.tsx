import { CreateFileResponse, FileUploadModel } from "../../Patient/models";
import uploadFile from "../../../Utils/request/uploadFile";
import * as Notification from "../../../Utils/Notifications.js";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import FilePreviewDialog from "../FilePreviewDialog";
import { ExtImage, StateInterface } from "../../Patient/FileUpload";
import { useCallback, useEffect, useState } from "react";
import CareIcon from "../../../CAREUI/icons/CareIcon";

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
  const noteId = "40faecc6-6199-48cd-bc2a-dd9e73b920f9";

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
      <div className="flex flex-wrap gap-3 ">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {files.map((file) => (
              <div
                key={file.id}
                className="relative mt-1 h-20 w-20 cursor-pointer rounded-md bg-gray-100 shadow-sm hover:bg-gray-200"
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
                  className="absolute -right-1 -top-1 z-10 h-5 w-5 rounded-full bg-gray-300 text-gray-800 hover:bg-gray-400"
                >
                  <CareIcon
                    icon="l-times-circle"
                    className="text-md absolute right-0.5 top-0.5 text-gray-600"
                  />
                </button>
                <div
                  className="flex h-full w-full flex-col items-center justify-center p-2"
                  onClick={() => loadFile(file.id!)}
                >
                  <CareIcon
                    icon="l-file"
                    className="shrink-0 text-2xl text-gray-600"
                  />
                  <span className="mt-1 max-h-[2.5em] w-full overflow-hidden text-ellipsis break-words text-center text-xs text-gray-600">
                    {file.name}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="">
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

export default FileUpload;
