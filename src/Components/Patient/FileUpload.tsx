import CircularProgress from "../Common/components/CircularProgress";
import { useCallback, useState, lazy, ChangeEvent, useEffect } from "react";
import { CreateFileResponse, FileUploadModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import Pagination from "../Common/Pagination";
import {
  IMAGE_EXTENSIONS,
  RESULTS_PER_PAGE_LIMIT,
} from "../../Common/constants";
import imageCompression from "browser-image-compression";
import { classNames } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import AuthorizedChild from "../../CAREUI/misc/AuthorizedChild";
import Page from "../Common/components/Page";
import useAuthUser from "../../Common/hooks/useAuthUser";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import uploadFile from "../../Utils/request/uploadFile";
import useFileUpload from "../../Utils/useFileUpload";
import useFileManager from "../../Utils/useFileManager";
import Tabs from "../Common/components/Tabs";

const Loading = lazy(() => import("../Common/Loading"));

export const header_content_type: URLS = {
  pdf: "application/pdf",
  txt: "text/plain",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
  gif: "image/gif",
  html: "text/html",
  htm: "text/html",
  mp4: "video/mp4",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  svg: "image/svg+xml",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const LinearProgressWithLabel = (props: any) => {
  return (
    <div className="flex align-middle">
      <div className="my-auto mr-2 w-full">
        <div className="mr-2 h-1.5 w-full rounded-full bg-primary-200">
          <div
            className="h-1.5 rounded-full bg-primary-500"
            style={{ width: `${props.value}%` }}
          />
        </div>
      </div>
      <div className="min-w-[35]">
        <p className="text-slate-600">{`${Math.round(props.value)}%`}</p>
      </div>
    </div>
  );
};

interface FileUploadProps {
  type: string;
  patientId?: any;
  facilityId?: any;
  consultationId?: any;
  consentId?: string;
  hideBack: boolean;
  audio?: boolean;
  unspecified: boolean;
  sampleId?: string;
  claimId?: string;
  className?: string;
  hideUpload?: boolean;
  changePageMetadata?: boolean;
}

interface URLS {
  [id: string]: string;
}

export interface ModalDetails {
  name?: string;
  id?: string;
  reason?: string;
  userArchived?: string;
  archiveTime?: any;
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

export const FileUpload = (props: FileUploadProps) => {
  const { t } = useTranslation();
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [audioBlobExists, setAudioBlobExists] = useState(false);
  const [resetRecording, setResetRecording] = useState(false);
  const [file, setFile] = useState<File | null>();
  const {
    facilityId,
    consultationId,
    patientId,
    consentId,
    type,
    hideBack,
    audio,
    unspecified,
    sampleId,
    claimId,
    changePageMetadata,
  } = props;
  const id = patientId;
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedArchievedFiles, setuploadedArchievedFiles] = useState<
    Array<FileUploadModel>
  >([{}]);
  const [uploadedUnarchievedFiles, setuploadedUnarchievedFiles] = useState<
    Array<FileUploadModel>
  >([{}]);
  const [uploadedDischargeSummaryFiles, setuploadedDischargeSummaryFiles] =
    useState<Array<FileUploadModel>>([{}]);
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [audiouploadStarted, setAudioUploadStarted] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileError, setUploadFileError] = useState<string>("");
  const [url, seturl] = useState<URLS>({});
  const [audioName, setAudioName] = useState<string>("");
  const [audioFileError, setAudioFileError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArchievedFilesCount, setTotalArchievedFilesCount] = useState(0);
  const [totalUnarchievedFilesCount, setTotalUnarchievedFilesCount] =
    useState(0);
  const [totalDischargeSummaryFilesCount, setTotalDischargeSummaryFilesCount] =
    useState(0);
  const [offset, setOffset] = useState(0);
  const [sortFileState, setSortFileState] = useState("UNARCHIVED");
  const authUser = useAuthUser();
  const limit = RESULTS_PER_PAGE_LIMIT;
  const [tabs, setTabs] = useState([
    { text: "Active Files", value: "UNARCHIVED" },
    { text: "Archived Files", value: "ARCHIVED" },
  ]);
  const [isMicPermission, setIsMicPermission] = useState(true);

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

  const fileUpload = useFileUpload({
    type,
    allowAllExtensions: true,
  });

  const fileManager = useFileManager({
    type,
    onArchive: async () => {
      fetchData();
    },
    onEdit: async () => {
      fetchData();
    },
  });

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    prefetch: !!patientId,
  });

  const { data: consultation } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    prefetch: !!consultationId,
  });

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const UPLOAD_HEADING: { [index: string]: string } = {
    PATIENT: "Upload Patient Files",
    CONSULTATION: "Upload Consultation Files",
    SAMPLE_MANAGEMENT: "Upload Sample Report",
    CLAIM: "Upload Supporting Info",
  };
  const VIEW_HEADING: { [index: string]: string } = {
    PATIENT: "View Patient Files",
    CONSULTATION: "View Consultation Files",
    SAMPLE_MANAGEMENT: "View Sample Report",
    CLAIM: "Supporting Info",
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

  const getAssociatedId = () => {
    switch (type) {
      case "PATIENT":
        return patientId;
      case "CONSENT_RECORD":
        return consentId;
      case "CONSULTATION":
        return consultationId;
      case "SAMPLE_MANAGEMENT":
        return sampleId;
      case "CLAIM":
        return claimId;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const unarchivedQuery = await request(routes.viewUpload, {
      query: {
        file_type: type,
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
        file_type: type,
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

    if (type === "CONSULTATION") {
      const dischargeSummaryQuery = await request(routes.viewUpload, {
        query: {
          file_type: "DISCHARGE_SUMMARY",
          associating_id: getAssociatedId(),
          is_archived: false,
          limit: limit,
          offset: offset,
        },
      });
      if (dischargeSummaryQuery.data) {
        setuploadedDischargeSummaryFiles(dischargeSummaryQuery.data.results);
        setTotalDischargeSummaryFilesCount(dischargeSummaryQuery.data.count);
        if (dischargeSummaryQuery.data?.results?.length) {
          setTabs([
            ...tabs,
            {
              text: "Discharge Summary",
              value: "DISCHARGE_SUMMARY",
            },
          ]);
        }
      }
    }

    setIsLoading(false);
  }, [id, offset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Store signed urls for non previewable files
  const prefetch_download_urls = async (files: FileUploadModel[]) => {
    const unsupportedFiles = files.filter(
      (x) => fileManager.getFileType(x) === "UNKNOWN",
    );
    const query = { file_type: type, associating_id: getAssociatedId() };
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

  const renderFileUpload = (item: FileUploadModel) => {
    const isPreviewSupported = fileManager.isPreviewable(item);
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
                              onClick={() =>
                                fileManager.editFile(item, getAssociatedId())
                              }
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
                              onClick={() =>
                                fileManager.archiveFile(item, getAssociatedId())
                              }
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
                    {sortFileState != "DISCHARGE_SUMMARY" && (
                      <div>
                        <span className="font-semibold leading-relaxed">
                          Created By:
                        </span>{" "}
                        {item.uploaded_by ? item.uploaded_by.username : null}
                      </div>
                    )}
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
                      onClick={() =>
                        fileManager.viewFile(item, getAssociatedId())
                      }
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
                        onClick={() =>
                          fileManager.editFile(item, getAssociatedId())
                        }
                        className="m-1 w-full sm:w-auto"
                      >
                        <CareIcon icon="l-pen" className="text-lg" />
                        RENAME
                      </ButtonV2>
                    </>
                  ) : (
                    <></>
                  )}
                  {sortFileState != "DISCHARGE_SUMMARY" &&
                  (item?.uploaded_by?.username === authUser.username ||
                    authUser.user_type === "DistrictAdmin" ||
                    authUser.user_type === "StateAdmin") ? (
                    <>
                      <ButtonV2
                        onClick={() =>
                          fileManager.archiveFile(item, getAssociatedId())
                        }
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
                onClick={() => fileManager.archiveFile(item, getAssociatedId())}
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

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (!e.target.files?.length) {
      return;
    }
    const f = e.target.files[0];
    const fileName = f.name;
    setFile(e.target.files[0]);
    setUploadFileName(
      fileName.substring(0, fileName.lastIndexOf(".")) || fileName,
    );

    const ext: string = fileName.split(".")[1];

    if (IMAGE_EXTENSIONS.includes(ext as (typeof IMAGE_EXTENSIONS)[number])) {
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

  const uploadfile = async (data: CreateFileResponse) => {
    const url = data.signed_url;
    const internal_name = data.internal_name;
    const f = file;
    if (!f) return;
    const newFile = new File([f], `${internal_name}`);
    console.log("filetype: ", newFile.type);
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
            setUploadFileName("");
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
    const filenameLength = uploadFileName.trim().length;
    const f = file;
    if (f === undefined || f === null) {
      setUploadFileError("Please choose a file to upload");
      return false;
    }
    if (filenameLength === 0) {
      setUploadFileError("Please give a name !!");
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
        fileType: type,
        associatingId: getAssociatedId(),
      },
    });
  };

  const handleUpload = async () => {
    if (!validateFileUpload()) return;
    const f = file;

    const category = "UNSPECIFIED";
    const filename = uploadFileName === "" && f ? f.name : uploadFileName;
    const name = f?.name;
    setUploadStarted(true);

    const { data } = await request(routes.createUpload, {
      body: {
        original_name: name ?? "",
        file_type: type,
        name: filename,
        associating_id: getAssociatedId(),
        file_category: category,
        mime_type: f?.type ?? "",
      },
    });

    if (data) {
      await uploadfile(data);
      await markUploadComplete(data);
      await fetchData();
    }
  };

  const confirmAudioBlobExists = () => {
    setAudioBlobExists(true);
  };

  const deleteAudioBlob = () => {
    setAudioBlobExists(false);
    setResetRecording(true);
  };

  const uploadAudiofile = (response: any) => {
    const url = response.data.signed_url;
    const internal_name = response.data.internal_name;
    const f = audioBlob;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`, { type: f.type });

    uploadFile(
      url,
      newFile,
      "PUT",
      { "Content-Type": newFile?.type },
      (xhr: XMLHttpRequest) => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setAudioUploadStarted(false);
          // setUploadSuccess(true);
          setAudioName("");
          fetchData();
          Notification.Success({
            msg: "File Uploaded Successfully",
          });
        } else {
          setAudioUploadStarted(false);
        }
      },
      setUploadPercent,
      () => {
        setAudioUploadStarted(false);
      },
    );
  };

  const validateAudioUpload = () => {
    const f = audioBlob;
    if (f === undefined || f === null) {
      setAudioFileError("Please upload a file");
      return false;
    }
    if (f.size > 10e7) {
      setAudioFileError("File size must not exceed 100 MB");
      return false;
    }
    return true;
  };

  const handleAudioUpload = async () => {
    if (!validateAudioUpload()) return;
    setAudioFileError("");
    const category = "AUDIO";
    const name = "audio.mp3";
    const filename =
      audioName.trim().length === 0 ? Date.now().toString() : audioName.trim();
    setAudioUploadStarted(true);

    request(routes.createUpload, {
      body: {
        original_name: name,
        file_type: type,
        name: filename,
        associating_id: getAssociatedId(),
        file_category: category,
        mime_type: audioBlob?.type ?? "",
      },
    })
      .then(uploadAudiofile)
      .catch(() => {
        setAudioUploadStarted(false);
      });
    setAudioName("");
    setAudioBlobExists(false);
  };

  const handleTabChange = (tabValue: string) => {
    setSortFileState(tabValue);
  };

  return (
    <div className={`${hideBack ? "py-2" : "p-4"} ${props.className}`}>
      {fileUpload.Dialogues}
      {fileManager.Dialogues}
      {!props.hideUpload && (
        <Page
          changePageMetadata={changePageMetadata}
          title={UPLOAD_HEADING[type]}
          hideBack={hideBack}
          breadcrumbs={false}
          crumbsReplacements={{
            [facilityId]: { name: patient?.facility_object?.name },
            [patientId]: { name: patient?.name },
          }}
          backUrl={
            type === "CONSULTATION"
              ? `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
              : `/facility/${facilityId}/patient/${patientId}`
          }
        >
          <div
            className={`${
              audio ? "grid-cols-2" : "grid-cols-1"
            } w-full gap-4 md:grid`}
          >
            {audio ? (
              <div className="rounded-lg border bg-white p-4 shadow">
                <h4 className="mb-4">Record and Upload Audio File</h4>
                <TextFormField
                  name="consultation_audio_file"
                  type="text"
                  label="Enter Audio File Name (optional)"
                  value={audioName}
                  disabled={uploadStarted}
                  onChange={(e: any) => {
                    setAudioName(e.value);
                  }}
                  error={audioFileError}
                />
                {audiouploadStarted ? (
                  <LinearProgressWithLabel value={uploadPercent} />
                ) : (
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
                      <VoiceRecorder
                        isDisabled={!!consultation?.discharge_date}
                        createAudioBlob={(createdBlob: Blob) =>
                          setAudioBlob(createdBlob)
                        }
                        confirmAudioBlobExists={confirmAudioBlobExists}
                        reset={resetRecording}
                        setResetRecording={setResetRecording}
                        handleSetMicPermission={setIsMicPermission}
                      />
                      {!audioBlobExists && !isMicPermission && (
                        <span className="text-sm font-medium text-warning-500">
                          <CareIcon
                            icon="l-exclamation-triangle"
                            className="mr-1 text-base"
                          />
                          Please allow browser permission before you start
                          speaking
                        </span>
                      )}
                    </div>
                    {audioBlobExists && (
                      <div className="flex w-full items-center md:w-auto">
                        <ButtonV2
                          id="upload_audio_file"
                          onClick={() => {
                            handleAudioUpload();
                          }}
                          className="w-full"
                        >
                          <CareIcon icon="l-cloud-upload" className="text-xl" />
                          Save
                        </ButtonV2>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
            {unspecified ? (
              <div className="mt-4 flex-wrap rounded-lg border bg-white p-4 shadow md:mt-0">
                <div>
                  <h4 className="mb-4">Upload New File</h4>
                </div>
                <TextFormField
                  name="consultation_file"
                  type="text"
                  label="Enter File Name"
                  required
                  value={uploadFileName}
                  disabled={uploadStarted}
                  onChange={(e: any) => {
                    setUploadFileName(e.value);
                  }}
                  error={uploadFileError}
                />
                <div>
                  {uploadStarted ? (
                    <LinearProgressWithLabel value={uploadPercent} />
                  ) : (
                    <div className="flex flex-col items-center justify-start gap-2 md:justify-end xl:flex-row">
                      <AuthorizedChild authorizeFor={NonReadOnlyUsers}>
                        {({ isAuthorized }) =>
                          isAuthorized ? (
                            <label
                              className={classNames(
                                consultation?.discharge_date
                                  ? "cursor-not-allowed bg-secondary-200 text-secondary-500"
                                  : "button-primary-default cursor-pointer transition-all duration-200 ease-in-out",
                                "button-size-default button-shape-square inline-flex h-min w-full items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1",
                              )}
                            >
                              <CareIcon
                                icon="l-file-upload-alt"
                                className="text-lg"
                              />
                              {t("choose_file")}
                              <input
                                id="file_upload_patient"
                                title="changeFile"
                                onChange={onFileChange}
                                type="file"
                                accept="image/*,video/*,audio/*,text/plain,text/csv,application/rtf,application/msword,application/vnd.oasis.opendocument.text,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.oasis.opendocument.spreadsheet,application/pdf"
                                hidden
                                disabled={!!consultation?.discharge_date}
                              />
                            </label>
                          ) : (
                            <></>
                          )
                        }
                      </AuthorizedChild>
                      <ButtonV2
                        disabled={!!consultation?.discharge_date}
                        onClick={() => fileUpload.handleCameraCapture()}
                        className="w-full"
                      >
                        <CareIcon icon="l-camera" className="mr-2 text-lg" />
                        Open Camera
                      </ButtonV2>
                      <ButtonV2
                        id="upload_file_button"
                        authorizeFor={NonReadOnlyUsers}
                        disabled={
                          !file ||
                          !uploadFileName ||
                          (patient && !patient.is_active)
                        }
                        onClick={handleUpload}
                        className="w-full"
                      >
                        <CareIcon icon="l-cloud-upload" className="text-lg" />
                        {t("upload")}
                      </ButtonV2>
                    </div>
                  )}
                  {file && (
                    <div className="mt-2 flex items-center justify-between rounded bg-secondary-200 px-4 py-2">
                      {file?.name}
                      <button
                        onClick={() => {
                          setFile(null);
                          setUploadFileName("");
                        }}
                      >
                        <CareIcon icon="l-times" className="text-lg" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </Page>
      )}
      <Page
        title={VIEW_HEADING[type]}
        hideBack={true}
        breadcrumbs={false}
        changePageMetadata={changePageMetadata}
      >
        <Tabs
          tabs={tabs}
          className="my-4"
          onTabChange={(v) => handleTabChange(v.toString())}
          currentTab={sortFileState}
        />
        {sortFileState === "UNARCHIVED" ? (
          // First it would check the filtered array contains any files or not else it would state the message
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
        ) : sortFileState === "ARCHIVED" ? (
          // First it would check the filtered array contains any files or not else it would state the message
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
        ) : (
          sortFileState === "DISCHARGE_SUMMARY" &&
          totalDischargeSummaryFilesCount > 0 && (
            <>
              {uploadedDischargeSummaryFiles.length > 0 ? (
                uploadedDischargeSummaryFiles.map((item: FileUploadModel) =>
                  renderFileUpload(item),
                )
              ) : (
                <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                  <div className="text-md flex items-center justify-center font-bold text-secondary-500">
                    {"No discharge summary files in the current Page"}
                  </div>
                </div>
              )}
              {totalDischargeSummaryFilesCount > limit && (
                <div className="mt-4 flex w-full justify-center">
                  <Pagination
                    cPage={currentPage}
                    defaultPerPage={limit}
                    data={{ totalCount: totalDischargeSummaryFilesCount }}
                    onChange={handlePagination}
                  />
                </div>
              )}
            </>
          )
        )}
      </Page>
    </div>
  );
};
