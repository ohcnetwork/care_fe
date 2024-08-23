import CircularProgress from "../Common/components/CircularProgress";
import { useCallback, useState, lazy, useEffect } from "react";
import { FileUploadModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import HeadedTabs from "../Common/HeadedTabs";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import Page from "../Common/components/Page";
import useAuthUser from "../../Common/hooks/useAuthUser";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import FilePreviewDialog from "../Common/FilePreviewDialog";
import { ExtImage } from "../../Utils/useFileUpload";

const Loading = lazy(() => import("../Common/Loading"));

interface Props {
  patientId: string;
  facilityId: string;
  consultationId: string | number;
}

interface URLS {
  [id: string]: string;
}

export interface ModalDetails {
  name?: string;
  id?: string;
  reason?: string;
  userArchived?: string;
  archiveTime?: string;
  associatedId?: string;
}

export interface StateInterface {
  open: boolean;
  isImage: boolean;
  name: string;
  extension: string;
  zoom: number;
  isZoomInDisabled: boolean;
  isZoomOutDisabled: boolean;
  rotation: number;
}

const previewExtensions = [
  "html",
  "htm",
  "pdf",
  "mp4",
  "webm",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
];

export const DiscussionNotesFiles = (props: Props) => {
  const { t } = useTranslation();
  const { patientId } = props;
  const id = patientId;
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedArchievedFiles, setuploadedArchievedFiles] = useState<
    Array<FileUploadModel>
  >([{}]);
  const [uploadedUnarchievedFiles, setuploadedUnarchievedFiles] = useState<
    Array<FileUploadModel>
  >([{}]);
  const [url, seturl] = useState<URLS>({});
  const [fileUrl, setFileUrl] = useState("");
  const [downloadURL, setDownloadURL] = useState<string>();
  const initialState = {
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 4,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
    rotation: 0,
  };
  const [file_state, setFileState] = useState<StateInterface>(initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArchievedFilesCount, setTotalArchievedFilesCount] = useState(0);
  const [totalUnarchievedFilesCount, setTotalUnarchievedFilesCount] =
    useState(0);
  const [offset, setOffset] = useState(0);
  const [modalOpenForEdit, setModalOpenForEdit] = useState(false);
  const [modalOpenForArchive, setModalOpenForArchive] = useState(false);
  const [modalOpenForMoreDetails, setModalOpenForMoreDetails] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");
  const [modalDetails, setModalDetails] = useState<ModalDetails>();
  const [editFileName, setEditFileName] = useState<string | undefined>("");
  const [editFileNameError, setEditFileNameError] = useState("");
  const [btnloader, setbtnloader] = useState(false);
  const [sortFileState, setSortFileState] = useState("UNARCHIVED");
  const authUser = useAuthUser();
  const limit = RESULTS_PER_PAGE_LIMIT;
  const tabs = [
    { name: "Unarchived Files", value: "UNARCHIVED" },
    { name: "Archived Files", value: "ARCHIVED" },
  ];

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const triggerDownload = async (url: string, filename: string) => {
    try {
      Notification.Success({ msg: "Downloading file..." });
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok.");

      const data = await response.blob();
      const blobUrl = window.URL.createObjectURL(data);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      Notification.Error({ msg: "Failed to download file" });
    }
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

  const getAssociatedId = () => {
    // TODO : Create an API to retrive all notes for a particular consultation with file_type and optional associating_id
    return "8469003b-969d-42b4-b2c9-4a55623c9258";
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const unarchivedQuery = await request(routes.viewUpload, {
      query: {
        file_type: "NOTES",
        associating_id: getAssociatedId(),
        is_archived: false,
        limit: limit,
        offset: offset,
      },
    });

    if (unarchivedQuery.data) {
      prefetch_download_urls(unarchivedQuery.data.results);
      setuploadedUnarchievedFiles(
        unarchivedQuery.data.results?.filter(
          (file) => file.upload_completed || file.file_category === "AUDIO",
        ),
      );
      setTotalUnarchievedFilesCount(unarchivedQuery.data.count);
    }

    const archivedQuery = await request(routes.viewUpload, {
      query: {
        file_type: "NOTES",
        associating_id: getAssociatedId(),
        is_archived: true,
        limit: limit,
        offset: offset,
      },
    });

    if (archivedQuery.data) {
      setuploadedArchievedFiles(archivedQuery.data.results);
      setTotalArchievedFilesCount(archivedQuery.data.count);
    }

    setIsLoading(false);
  }, [id, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Store signed urls for non previewable files
  const prefetch_download_urls = async (files: FileUploadModel[]) => {
    const unsupportedFiles = files.filter(
      (x) => !previewExtensions.includes(x.extension ?? ""),
    );
    const query = { file_type: "NOTES", associating_id: getAssociatedId() };
    const urls = await Promise.all(
      unsupportedFiles.map(async (file) => {
        const id = file.id as string;
        const { data } = await request(routes.retrieveUpload, {
          query,
          pathParams: { id: id },
        });
        return [id, data?.read_signed_url];
      }),
    );
    seturl(Object.fromEntries(urls));
  };

  // Function to extract the extension of the file
  const getExtension = (url: string) => {
    const div1 = url.split("?")[0].split(".");
    const ext: string = div1[div1.length - 1].toLowerCase();
    return ext;
  };

  const getIconClassName = (extensionName: string | undefined) => {
    if (!extensionName) return "l-file-medical";
    // check for image files
    if (
      [
        ".png",
        ".jpg",
        ".jpeg",
        ".tif",
        ".tiff",
        ".bmp",
        ".eps",
        ".apng",
        ".avif",
        ".jfif",
        ".pjpeg",
        ".pjp",
        ".svg",
        ".webp",
      ].includes(extensionName)
    ) {
      return "l-image";
    }
    // check for video files
    if (
      [
        ".webm",
        ".mpg",
        ".mp2",
        ".mpeg",
        ".mpe",
        ".mpv",
        ".ogg",
        ".mp4",
        ".m4v",
        ".avi",
        ".wmv",
        ".mov",
        ".qt",
        ".flv",
        ".swf",
      ].includes(extensionName)
    ) {
      return "l-video";
    }

    if (extensionName === ".pptx") {
      return "l-presentation-play";
    }
    return "l-file-medical";
  };

  const loadFile = async (id: string) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const { data } = await request(routes.retrieveUpload, {
      query: {
        file_type: "NOTES",
        associating_id: getAssociatedId(),
      },
      pathParams: { id },
    });

    if (!data) return;

    const signedUrl = data.read_signed_url as string;
    const extension = getExtension(signedUrl);

    setFileState({
      ...file_state,
      open: true,
      name: data.name?.split(".")[0] ?? "file",
      extension,
      isImage: ExtImage.includes(extension),
    });
    downloadFileUrl(signedUrl);
    setFileUrl(signedUrl);
  };

  const validateEditFileName = (name: string) => {
    if (name.trim() === "") {
      setEditFileNameError("Please enter a name!");
      return false;
    } else {
      setEditFileNameError("");
      return true;
    }
  };

  const validateArchiveReason = (name: string) => {
    if (name.trim() === "") {
      setArchiveReasonError("Please enter a valid reason!");
      return false;
    } else {
      setArchiveReasonError("");
      return true;
    }
  };

  const partialupdateFileName = async (id: string, name: string) => {
    if (!validateEditFileName(name)) {
      setbtnloader(false);
      return;
    }

    const { res } = await request(routes.editUpload, {
      body: { name },
      pathParams: {
        id,
        fileType: "NOTES",
        associatingId: getAssociatedId(),
      },
    });

    if (res?.ok) {
      fetchData();
      Notification.Success({ msg: "File name changed successfully" });
      setModalOpenForEdit(false);
    }
    setbtnloader(false);
  };

  const archiveFile = async (id: string, archive_reason: string) => {
    if (!validateArchiveReason(archiveReason)) {
      setbtnloader(false);
      return;
    }

    const { res } = await request(routes.editUpload, {
      body: { is_archived: true, archive_reason },
      pathParams: {
        id,
        fileType: "NOTES",
        associatingId: getAssociatedId(),
      },
    });

    if (res?.ok) {
      fetchData();
      Notification.Success({ msg: "File archived successfully" });
      setModalOpenForArchive(false);
    }

    setbtnloader(false);
  };

  const renderFileUpload = (item: FileUploadModel) => {
    const isPreviewSupported = previewExtensions.includes(item.extension ?? "");
    return (
      <div
        className={"mt-4 rounded-lg border bg-white p-4 shadow"}
        id="file-div"
        key={item.id}
      >
        {!item.is_archived ? (
          <>
            {item.file_category === "AUDIO" ? (
              <div className="flex flex-wrap justify-between space-y-2">
                <div className="flex flex-wrap justify-between space-x-2">
                  <div>
                    <CareIcon
                      icon="l-music"
                      className="m-3 text-6xl text-primary-500"
                    />
                  </div>
                  <div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        File Name:{" "}
                      </span>{" "}
                      {item.name}
                      {item.extension}
                    </div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        Created By:
                      </span>{" "}
                      {item.uploaded_by ? item.uploaded_by.username : null}
                    </div>
                    {item.created_date && (
                      <RecordMeta
                        prefix={
                          <span className="font-semibold leading-relaxed">
                            {t("created")}:
                          </span>
                        }
                        time={item.created_date}
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {item.id ? (
                    Object.keys(url).length > 0 ? (
                      <div className="flex flex-wrap">
                        <audio
                          className="m-auto max-h-full max-w-full object-contain"
                          src={url[item.id]}
                          controls
                          preload="auto"
                          controlsList="nodownload"
                        />
                      </div>
                    ) : (
                      <CircularProgress />
                    )
                  ) : (
                    <div>File Not found</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center">
                  {item.id ? (
                    Object.keys(url).length > 0 && (
                      <div className="flex flex-wrap">
                        <ButtonV2
                          onClick={() => {
                            triggerDownload(
                              url[item.id!],
                              `${item.name}${item.extension}`,
                            );
                          }}
                          className="m-1 w-full sm:w-auto"
                        >
                          <CareIcon
                            icon="l-arrow-circle-down"
                            className="text-lg"
                          />{" "}
                          DOWNLOAD
                        </ButtonV2>
                        {item?.uploaded_by?.username === authUser.username ||
                        authUser.user_type === "DistrictAdmin" ||
                        authUser.user_type === "StateAdmin" ? (
                          <>
                            <ButtonV2
                              onClick={() => {
                                setModalDetails({
                                  name: item.name,
                                  id: item.id,
                                });
                                setEditFileName(item?.name);
                                setModalOpenForEdit(true);
                              }}
                              className="m-1 w-full sm:w-auto"
                            >
                              <CareIcon icon="l-pen" className="text-lg" />
                              RENAME
                            </ButtonV2>
                          </>
                        ) : (
                          <></>
                        )}
                        {item?.uploaded_by?.username === authUser.username ||
                        authUser.user_type === "DistrictAdmin" ||
                        authUser.user_type === "StateAdmin" ? (
                          <>
                            <ButtonV2
                              onClick={() => {
                                setArchiveReason("");
                                setModalDetails({
                                  name: item.name,
                                  id: item.id,
                                });
                                setModalOpenForArchive(true);
                              }}
                              className="m-1 w-full sm:w-auto"
                            >
                              <CareIcon icon="l-archive" className="text-lg" />
                              ARCHIVE
                            </ButtonV2>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    )
                  ) : (
                    <div>File Not found</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-between space-y-2">
                <div className="flex flex-wrap justify-between space-x-2">
                  <div>
                    <CareIcon
                      icon={getIconClassName(item?.extension)}
                      className={"m-3 text-6xl text-primary-500"}
                    />
                  </div>
                  <div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        File Name:{" "}
                      </span>{" "}
                      {item.name}
                      {item.extension}
                    </div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        Created By:
                      </span>{" "}
                      {item.uploaded_by ? item.uploaded_by.username : null}
                    </div>
                    {item.created_date && (
                      <RecordMeta
                        prefix={
                          <span className="font-semibold leading-relaxed">
                            {t("created")}:
                          </span>
                        }
                        time={item.created_date}
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center">
                  {isPreviewSupported ? (
                    <ButtonV2
                      onClick={() => {
                        loadFile(item.id!);
                      }}
                      className="m-1 w-full sm:w-auto"
                    >
                      {" "}
                      <CareIcon className="text-lg" icon="l-eye" />
                      PREVIEW
                    </ButtonV2>
                  ) : (
                    <ButtonV2
                      className="m-1 w-full sm:w-auto"
                      id="download-file"
                      onClick={() => {
                        triggerDownload(
                          url[item.id!],
                          `${item.name}${item.extension}`,
                        );
                      }}
                    >
                      <CareIcon
                        className="text-lg"
                        icon="l-arrow-circle-down"
                      />{" "}
                      DOWNLOAD
                    </ButtonV2>
                  )}
                  {item?.uploaded_by?.username === authUser.username ||
                  authUser.user_type === "DistrictAdmin" ||
                  authUser.user_type === "StateAdmin" ? (
                    <>
                      {" "}
                      <ButtonV2
                        onClick={() => {
                          setModalDetails({ name: item.name, id: item.id });
                          setEditFileName(item?.name);
                          setModalOpenForEdit(true);
                        }}
                        className="m-1 w-full sm:w-auto"
                      >
                        <CareIcon icon="l-pen" className="text-lg" />
                        RENAME
                      </ButtonV2>
                    </>
                  ) : (
                    <></>
                  )}
                  {(item?.uploaded_by?.username === authUser.username ||
                    authUser.user_type === "DistrictAdmin" ||
                    authUser.user_type === "StateAdmin") && (
                    <ButtonV2
                      onClick={() => {
                        setArchiveReason("");
                        setModalDetails({ name: item.name, id: item.id });
                        setModalOpenForArchive(true);
                      }}
                      className="m-1 w-full sm:w-auto"
                    >
                      <CareIcon icon="l-archive" className="text-lg" />
                      ARCHIVE
                    </ButtonV2>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-wrap justify-between space-y-2">
            <div className="flex flex-wrap justify-between space-x-2">
              <div>
                {item.file_category === "AUDIO" ? (
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="absolute bottom-1 right-1 h-6 w-6 text-red-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>

                    <CareIcon
                      icon="l-music"
                      className="text-6xl text-secondary-500"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="absolute bottom-1 right-1 h-6 w-6 text-red-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>

                    <CareIcon
                      icon={getIconClassName(item?.extension)}
                      className="text-6xl text-secondary-500"
                    />
                  </div>
                )}
              </div>
              <div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    File Name:{" "}
                  </span>{" "}
                  {item.name}
                  {item.extension}
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">
                    Created By:
                  </span>{" "}
                  {item.uploaded_by ? item.uploaded_by.username : null}
                </div>
                {item.created_date && (
                  <RecordMeta
                    prefix={
                      <span className="font-semibold leading-relaxed">
                        {t("created")}:
                      </span>
                    }
                    time={item.created_date}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center">
              <ButtonV2 variant="secondary" className="m-1 w-full sm:w-auto">
                {" "}
                <CareIcon icon="l-eye-slash" className="text-lg" /> FILE
                ARCHIVED
              </ButtonV2>
              <ButtonV2
                onClick={() => {
                  setModalDetails({
                    name: item.name,
                    reason: item.archive_reason,
                    userArchived: item.archived_by?.username,
                    archiveTime: item.archived_datetime,
                  });
                  setModalOpenForMoreDetails(true);
                }}
                className="m-1 w-full sm:w-auto"
              >
                <CareIcon icon="l-question-circle" className="text-lg" />
                MORE DETAILS
              </ButtonV2>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Loading />
      </div>
    );
  }

  // For creating the Download File URL
  const downloadFileUrl = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setDownloadURL(URL.createObjectURL(blob));
      });
  };

  const handleTabChange = (tabValue: string) => {
    setSortFileState(tabValue);
  };

  return (
    <div className="py-2">
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
      <DialogModal
        show={modalOpenForEdit}
        title={
          <div className="flex flex-row">
            <div className="rounded-full bg-primary-100 px-5 py-4">
              <CareIcon
                icon="l-edit-alt"
                className="text-lg text-primary-500"
              />
            </div>
            <div className="m-4">
              <h1 className="text-xl text-black">Rename File</h1>
            </div>
          </div>
        }
        onClose={() => setModalOpenForEdit(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setbtnloader(true);
            partialupdateFileName(modalDetails!.id!, editFileName ?? "");
          }}
          className="flex w-full flex-col"
        >
          <div>
            <TextFormField
              name="editFileName"
              label="Enter the file name"
              value={editFileName}
              onChange={(e) => setEditFileName(e.value)}
              error={editFileNameError}
            />
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={() => setModalOpenForEdit(false)} />
            <Submit
              disabled={
                btnloader ||
                modalDetails?.name === editFileName ||
                editFileName?.length === 0
              }
              label="Proceed"
            />
          </div>
        </form>
      </DialogModal>
      <DialogModal
        show={modalOpenForArchive}
        title={
          <div className="flex flex-row">
            <div className="my-1 mr-3 rounded-full bg-red-100 px-5 py-4 text-center">
              <CareIcon
                icon="l-exclamation-triangle"
                className="text-lg text-danger-500"
              />
            </div>
            <div className="text-sm">
              <h1 className="text-xl text-black">Archive File</h1>
              <span className="text-sm text-secondary-600">
                This action is irreversible. Once a file is archived it cannot
                be unarchived.
              </span>
            </div>
          </div>
        }
        onClose={() => setModalOpenForArchive(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setbtnloader(true);
            archiveFile(modalDetails!.id!, archiveReason);
          }}
          className="mx-2 my-4 flex w-full flex-col"
        >
          <div>
            <TextAreaFormField
              name="editFileName"
              label={
                <span>
                  State the reason for archiving <b>{modalDetails?.name}</b>{" "}
                  file?
                </span>
              }
              rows={6}
              required
              placeholder="Type the reason..."
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.value)}
              error={archiveReasonError}
            />
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={() => setModalOpenForArchive(false)} />
            <Submit disabled={btnloader} label="Proceed" />
          </div>
        </form>
      </DialogModal>
      <DialogModal
        show={modalOpenForMoreDetails}
        title={
          <div className="flex flex-row">
            <div className="my-1 mr-3 rounded-full bg-primary-100 px-5 py-4 text-center">
              <CareIcon
                icon="l-question-circle"
                className="text-lg text-primary-500"
              />
            </div>
            <div className="text-sm">
              <h1 className="text-xl text-black">File Details</h1>
              <span className="text-sm font-normal text-secondary-600">
                This file is archived. Once a file is archived it cannot be
                unarchived.
              </span>
            </div>
          </div>
        }
        onClose={() => setModalOpenForMoreDetails(false)}
      >
        <div className="flex flex-col">
          <div>
            <div className="text-md m-2 text-center">
              <b id="archive-file-name">{modalDetails?.name}</b> file is
              archived.
            </div>
            <div className="text-md text-center" id="archive-file-reason">
              <b>Reason:</b> {modalDetails?.reason}
            </div>
            <div className="text-md text-center">
              <b>Archived by:</b> {modalDetails?.userArchived}
            </div>
            <div className="text-md text-center">
              <b>Time of Archive: </b>
              {formatDateTime(modalDetails?.archiveTime)}
            </div>
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={(_) => setModalOpenForMoreDetails(false)} />
          </div>
        </div>
      </DialogModal>

      <Page title="Discussion Notes Files" hideBack={true} breadcrumbs={false}>
        <HeadedTabs
          tabs={tabs}
          handleChange={handleTabChange}
          currentTabState={sortFileState}
        />
        {sortFileState === "UNARCHIVED" ? (
          <>
            {uploadedUnarchievedFiles?.length > 0 ? (
              uploadedUnarchievedFiles.map((item: FileUploadModel) =>
                renderFileUpload(item),
              )
            ) : (
              <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                <div className="text-md flex items-center justify-center font-bold text-secondary-500">
                  {"No Unarchived File in the Current Page"}
                </div>
              </div>
            )}
            {totalUnarchievedFilesCount > limit && (
              <div className="mt-4 flex w-full justify-center">
                <Pagination
                  cPage={currentPage}
                  defaultPerPage={limit}
                  data={{ totalCount: totalUnarchievedFilesCount }}
                  onChange={handlePagination}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {uploadedArchievedFiles?.length > 0 ? (
              uploadedArchievedFiles.map((item: FileUploadModel) =>
                renderFileUpload(item),
              )
            ) : (
              <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                <div className="text-md flex items-center justify-center font-bold text-secondary-500">
                  {"No Archived File in the Current Page"}
                </div>
              </div>
            )}
            {totalArchievedFilesCount > limit && (
              <div className="mt-4 flex w-full justify-center">
                <Pagination
                  cPage={currentPage}
                  defaultPerPage={limit}
                  data={{ totalCount: totalArchievedFilesCount }}
                  onChange={handlePagination}
                />
              </div>
            )}
          </>
        )}
      </Page>
    </div>
  );
};
