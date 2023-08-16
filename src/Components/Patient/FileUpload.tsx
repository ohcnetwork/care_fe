import axios from "axios";
import CircularProgress from "../Common/components/CircularProgress";
import {
  useCallback,
  useState,
  useEffect,
  useRef,
  lazy,
  ChangeEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  viewUpload,
  retrieveUpload,
  createUpload,
  getPatient,
  editUpload,
} from "../../Redux/actions";
import { FileUploadModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import imageCompression from "browser-image-compression";
import { formatDateTime } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import HeadedTabs from "../Common/HeadedTabs";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import DialogModal from "../Common/Dialog";
import CareIcon from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import RecordMeta from "../../CAREUI/display/RecordMeta";
import Webcam from "react-webcam";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import AuthorizedChild from "../../CAREUI/misc/AuthorizedChild";
import Page from "../Common/components/Page";
import FilePreviewDialog from "../Common/FilePreviewDialog";
import useAuthUser from "../../Common/hooks/useAuthUser";

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

// Array of image extensions
const ExtImage: string[] = [
  "jpeg",
  "jpg",
  "png",
  "gif",
  "svg",
  "bmp",
  "webp",
  "jfif",
];

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
  hideBack: boolean;
  audio?: boolean;
  unspecified: boolean;
  sampleId?: number;
  claimId?: string;
}

interface URLS {
  [id: string]: string;
}

interface ModalDetails {
  name?: string;
  id?: string;
  reason?: string;
  userArchived?: string;
  archiveTime?: any;
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
    type,
    hideBack,
    audio,
    unspecified,
    sampleId,
    claimId,
  } = props;
  const id = patientId;
  const dispatch: any = useDispatch();
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
  const [reload, setReload] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileError, setUploadFileError] = useState<string>("");
  const [url, seturl] = useState<URLS>({});
  const [fileUrl, setFileUrl] = useState("");
  const [audioName, setAudioName] = useState<string>("");
  const [audioFileError, setAudioFileError] = useState<string>("");
  const [contentType, setcontentType] = useState<string>("");
  const [downloadURL, setDownloadURL] = useState<string>();
  const FACING_MODE_USER = "user";
  const FACING_MODE_ENVIRONMENT = { exact: "environment" };
  const webRef = useRef<any>(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [facingMode, setFacingMode] = useState<any>(FACING_MODE_USER);
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };
  const { width } = useWindowDimensions();
  const LaptopScreenBreakpoint = 640;
  const isLaptopScreen = width >= LaptopScreenBreakpoint ? true : false;
  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prevState: any) =>
      prevState === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  }, []);
  const initialState = {
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 3,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
    rotation: 0,
  };
  const [file_state, setFileState] = useState<StateInterface>(initialState);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArchievedFilesCount, setTotalArchievedFilesCount] = useState(0);
  const [totalUnarchievedFilesCount, setTotalUnarchievedFilesCount] =
    useState(0);
  const [totalDischargeSummaryFilesCount, setTotalDischargeSummaryFilesCount] =
    useState(0);
  const [offset, setOffset] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [modalOpenForEdit, setModalOpenForEdit] = useState(false);
  const [modalOpenForCamera, setModalOpenForCamera] = useState(false);
  const [modalOpenForArchive, setModalOpenForArchive] = useState(false);
  const [modalOpenForMoreDetails, setModalOpenForMoreDetails] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");
  const [modalDetails, setModalDetails] = useState<ModalDetails>();
  const [editFileName, setEditFileName] = useState<any>("");
  const [editFileNameError, setEditFileNameError] = useState("");
  const [btnloader, setbtnloader] = useState(false);
  const [sortFileState, setSortFileState] = useState("UNARCHIVED");
  const authUser = useAuthUser();
  const limit = RESULTS_PER_PAGE_LIMIT;
  const [isActive, setIsActive] = useState(true);
  const [tabs, setTabs] = useState([
    { name: "Unarchived Files", value: "UNARCHIVED" },
    { name: "Archived Files", value: "ARCHIVED" },
  ]);
  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
          setIsActive(res.data.is_active);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatch, patientId]);

  const captureImage = () => {
    setPreviewImage(webRef.current.getScreenshot());
    fetch(webRef.current.getScreenshot())
      .then((res) => res.blob())
      .then((blob) => {
        const myFile = new File([blob], "image.png", {
          type: blob.type,
        });
        setFile(myFile);
      });
  };

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

  const handleClose = () => {
    setDownloadURL("");
    setFileState({
      ...file_state,
      open: false,
      zoom: 3,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    });
  };

  const getAssociatedId = () => {
    switch (type) {
      case "PATIENT":
        return patientId;
      case "CONSULTATION":
        return consultationId;
      case "SAMPLE_MANAGEMENT":
        return sampleId;
      case "CLAIM":
        return claimId;
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const unarchivedFileData = {
        file_type: type,
        associating_id: getAssociatedId(),
        is_archived: false,
        limit: limit,
        offset: offset,
      };
      let res = await dispatch(viewUpload(unarchivedFileData));
      if (!status.aborted) {
        if (res?.data) {
          audio_urls(res.data.results);
          setuploadedUnarchievedFiles(
            res?.data?.results?.filter(
              (file: FileUploadModel) =>
                file.upload_completed || file.file_category === "AUDIO"
            )
          );
          setTotalUnarchievedFilesCount(res.data.count);
        }
        setIsLoading(false);
      }
      const archivedFileData = {
        file_type: type,
        associating_id: getAssociatedId(),
        is_archived: true,
        limit: limit,
        offset: offset,
      };
      res = await dispatch(viewUpload(archivedFileData));
      if (!status.aborted) {
        if (res?.data) {
          setuploadedArchievedFiles(res.data.results);
          setTotalArchievedFilesCount(res.data.count);
        }
        setIsLoading(false);
      }
      if (type === "CONSULTATION") {
        const dischargeSummaryFileData = {
          file_type: "DISCHARGE_SUMMARY",
          associating_id: getAssociatedId(),
          is_archived: false,
          limit: limit,
          offset: offset,
        };
        res = await dispatch(viewUpload(dischargeSummaryFileData));
        if (!status.aborted) {
          if (res?.data) {
            setuploadedDischargeSummaryFiles(res.data.results);
            setTotalDischargeSummaryFilesCount(res.data.count);
            if (res?.data?.results?.length > 0) {
              setTabs([
                ...tabs,
                {
                  name: "Discharge Summary",
                  value: "DISCHARGE_SUMMARY",
                },
              ]);
            }
          }
        }
        setIsLoading(false);
      }
    },
    [dispatch, id, offset]
  );

  // Store all audio urls for each audio file
  const audio_urls = (files: any) => {
    let audio_files = files || [];
    audio_files = audio_files.filter(
      (x: FileUploadModel) => x.file_category === "AUDIO"
    );

    const getURL = async (audio_files: any) => {
      const data = { file_type: type, associating_id: getAssociatedId() };
      const all_urls: any = {};

      for (const x of audio_files) {
        if (x.id) {
          const responseData = await dispatch(retrieveUpload(data, x.id));
          all_urls[`${x.id}`] = responseData.data.read_signed_url;
        }
      }
      seturl(all_urls);
    };
    getURL(audio_files);
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData, id, reload]
  );

  // Function to extract the extension of the file
  const getExtension = (url: string) => {
    const div1 = url.split("?")[0].split(".");
    const ext: string = div1[div1.length - 1].toLowerCase();
    return ext;
  };

  const getIconClassName = (extensionName: string | undefined) => {
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
      ].some((ext) => ext === extensionName)
    ) {
      return "fa-solid fa-file-image";
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
      ].some((ext) => ext === extensionName)
    ) {
      return "fa-solid fa-file-video";
    }
    // check for compressed files
    if (extensionName === ".zip" || extensionName === ".rar") {
      return "fa-solid fa-file-zipper";
    }
    // check for misclaneous files whose icons are available freely in fontawesome
    if (extensionName === ".pdf") {
      return "fa-solid fa-file-pdf";
    }
    if (extensionName === ".docx") {
      return "fa-solid fa-file-word";
    }
    if (extensionName === ".csv") {
      return "fa-solid fa-file-csv";
    }
    if (extensionName === ".xlsx") {
      return "fa-solid fa-file-excel";
    }
    if (extensionName === ".txt") {
      return "fa-solid fa-file-lines";
    }
    if (extensionName === ".pptx") {
      return "fa-solid fa-file-powerpoint";
    }
    return "fa-solid fa-file-medical";
  };

  const loadFile = async (id: any) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const data = {
      file_type: sortFileState === "DISCHARGE_SUMMARY" ? sortFileState : type,
      associating_id: getAssociatedId(),
    };
    const responseData = await dispatch(retrieveUpload(data, id));
    const file_extension = getExtension(responseData.data.read_signed_url);
    setFileState({
      ...file_state,
      open: true,
      name: responseData.data.name,
      extension: file_extension,
      isImage: ExtImage.includes(file_extension),
    });
    downloadFileUrl(responseData.data.read_signed_url);
    setFileUrl(responseData.data.read_signed_url);
  };

  const validateEditFileName = (name: any) => {
    if (name.trim() === "") {
      setEditFileNameError("Please enter a name!");
      return false;
    } else {
      setEditFileNameError("");
      return true;
    }
  };

  const validateArchiveReason = (name: any) => {
    if (name.trim() === "") {
      setArchiveReasonError("Please enter a valid reason!");
      return false;
    } else {
      setArchiveReasonError("");
      return true;
    }
  };

  const partialupdateFileName = async (id: any, name: string) => {
    const data = {
      file_type: sortFileState === "DISCHARGE_SUMMARY" ? sortFileState : type,
      name: name,
      associating_id: getAssociatedId(),
    };
    if (validateEditFileName(name)) {
      const res = await dispatch(
        editUpload({ name: data.name }, id, data.file_type, data.associating_id)
      );
      if (res && res.status === 200) {
        fetchData(res.status);
        Notification.Success({
          msg: "File name changed successfully",
        });
        setbtnloader(false);
        setModalOpenForEdit(false);
      } else {
        setbtnloader(false);
      }
    } else {
      setbtnloader(false);
    }
  };

  const archiveFile = async (id: any, archiveReason: string) => {
    const data = {
      file_type: type,
      is_archived: true,
      archive_reason: archiveReason,
      associating_id: getAssociatedId(),
    };
    if (validateArchiveReason(archiveReason)) {
      const res = await dispatch(
        editUpload(
          {
            is_archived: data.is_archived,
            archive_reason: data.archive_reason,
          },
          id,
          data.file_type,
          data.associating_id
        )
      );
      if (res && res.status === 200) {
        fetchData(res.status);
        Notification.Success({
          msg: "File archived successfully",
        });
        setbtnloader(false);
        setModalOpenForArchive(false);
      } else {
        setbtnloader(false);
      }
    } else {
      setbtnloader(false);
    }
  };

  const renderFileUpload = (item: FileUploadModel) => {
    return (
      <>
        <div
          className="mt-4 rounded-lg border bg-white p-4 shadow"
          key={item.id}
        >
          {!item.is_archived ? (
            <>
              {item.file_category === "AUDIO" ? (
                <div className="flex flex-wrap justify-between space-y-2">
                  <div className="flex flex-wrap justify-between space-x-2">
                    <div>
                      <i className="fa-solid fa-file-audio fa-3x m-3 text-primary-500"></i>
                    </div>
                    <div>
                      <div>
                        <span className="font-semibold leading-relaxed">
                          File Name:{" "}
                        </span>{" "}
                        {item.name}
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
                          <a
                            href={url[item.id]}
                            download={item.name}
                            className="Button button-size-default button-shape-square button-primary-default m-1 flex w-full justify-center gap-2 outline-offset-1 hover:text-white focus:bg-primary-500 sm:w-auto"
                          >
                            <CareIcon className="care-l-arrow-circle-down text-lg" />{" "}
                            DOWNLOAD
                          </a>
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
                                <CareIcon className="care-l-pen text-lg" />
                                EDIT FILE NAME
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
                                <CareIcon className="care-l-archive text-lg" />
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
                      <i
                        className={`${getIconClassName(
                          item?.extension
                        )} fa-3x m-3 text-primary-500`}
                      ></i>
                    </div>
                    <div>
                      <div>
                        <span className="font-semibold leading-relaxed">
                          File Name:{" "}
                        </span>{" "}
                        {item.name}
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
                    <ButtonV2
                      onClick={() => {
                        loadFile(item.id);
                      }}
                      className="m-1 w-full sm:w-auto"
                    >
                      {" "}
                      <CareIcon className="care-l-eye text-lg" />
                      PREVIEW FILE
                    </ButtonV2>
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
                          <CareIcon className="care-l-pen text-lg" />
                          EDIT FILE NAME
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
                          onClick={() => {
                            setArchiveReason("");
                            setModalDetails({ name: item.name, id: item.id });
                            setModalOpenForArchive(true);
                          }}
                          className="m-1 w-full sm:w-auto"
                        >
                          <CareIcon className="care-l-archive text-lg" />
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
            <>
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

                        <i className="fa-solid fa-file-audio fa-3x m-3 text-gray-500"></i>
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

                        <i
                          className={`${getIconClassName(
                            item?.extension
                          )} fa-3x m-3 text-gray-500`}
                        ></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <div>
                      <span className="font-semibold leading-relaxed">
                        File Name:{" "}
                      </span>{" "}
                      {item.name}
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
                  <ButtonV2
                    variant="secondary"
                    className="m-1 w-full sm:w-auto"
                  >
                    {" "}
                    <CareIcon className="care-l-eye-slash text-lg" /> FILE
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
                    <CareIcon className="care-l-question-circle text-lg" />
                    MORE DETAILS
                  </ButtonV2>
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): any => {
    if (e.target.files == null) {
      throw new Error("Error finding e.target.files");
    }
    const f = e.target.files[0];
    const fileName = f.name;
    setFile(e.target.files[0]);
    setUploadFileName(
      fileName.substring(0, fileName.lastIndexOf(".")) || fileName
    );

    const ext: string = fileName.split(".")[1];
    setcontentType(header_content_type[ext]);

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

  const uploadfile = (response: any) => {
    const url = response.data.signed_url;
    const internal_name = response.data.internal_name;
    const f = file;
    if (!f) return;
    const newFile = new File([f], `${internal_name}`);

    const config = {
      headers: {
        "Content-type": contentType,
        "Content-disposition": "inline",
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };
    return new Promise<void>((resolve, reject) => {
      axios
        .put(url, newFile, config)
        .then(() => {
          setUploadStarted(false);
          // setUploadSuccess(true);
          setFile(null);
          setUploadFileName("");
          setReload(!reload);
          fetchData({ aborted: false });
          Notification.Success({
            msg: "File Uploaded Successfully",
          });
          setUploadFileError("");
          resolve(response);
        })
        .catch((e) => {
          Notification.Error({
            msg: "Error Uploading File: " + e.message,
          });
          setUploadStarted(false);
          reject();
        });
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
  const markUploadComplete = async (response: any) => {
    return dispatch(
      editUpload(
        { upload_completed: true },
        response.data.id,
        type,
        getAssociatedId()
      )
    );
  };

  const handleUpload = async (status: any) => {
    if (!validateFileUpload()) return;
    const f = file;

    const category = "UNSPECIFIED";
    const filename = uploadFileName === "" && f ? f.name : uploadFileName;
    const name = f?.name;
    setUploadStarted(true);
    // setUploadSuccess(false);
    const requestData = {
      original_name: name,
      file_type: type,
      name: filename,
      associating_id: getAssociatedId(),
      file_category: category,
    };
    dispatch(createUpload(requestData))
      .then(uploadfile)
      .then(markUploadComplete)
      .catch(() => {
        setUploadStarted(false);
      })
      .then(() => {
        fetchData(status);
      });
  };

  const createAudioBlob = (createdBlob: Blob) => {
    setAudioBlob(createdBlob);
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
    const newFile = new File([f], `${internal_name}`, { type: "audio/mpeg" });
    const config = {
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };

    axios
      .put(url, newFile, config)
      .then(() => {
        setAudioUploadStarted(false);
        // setUploadSuccess(true);
        setAudioName("");
        setReload(!reload);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch(() => {
        setAudioUploadStarted(false);
      });
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
    // setUploadSuccess(false);
    const requestData = {
      original_name: name,
      file_type: type,
      name: filename,
      associating_id: getAssociatedId(),
      file_category: category,
    };
    dispatch(createUpload(requestData))
      .then(uploadAudiofile)
      .catch(() => {
        setAudioUploadStarted(false);
      });
    setAudioName("");
    setAudioBlobExists(false);
  };

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
    <div className={hideBack ? "py-2" : "p-4"}>
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
        show={modalOpenForCamera}
        title={
          <div className="flex flex-row">
            <div className="rounded-full bg-primary-100 px-5 py-4">
              <CareIcon className="care-l-camera-change text-lg text-primary-500" />
            </div>
            <div className="m-4">
              <h1 className="text-xl text-black "> Camera</h1>
            </div>
          </div>
        }
        className="max-w-2xl"
        onClose={() => setModalOpenForCamera(false)}
      >
        <div>
          {!previewImage ? (
            <div className="m-3">
              <Webcam
                audio={false}
                height={720}
                screenshotFormat="image/jpeg"
                width={1280}
                ref={webRef}
                videoConstraints={{ ...videoConstraints, facingMode }}
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
                {t("switch")}
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
                    {t("capture")}
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
                    {t("retake")}
                  </ButtonV2>
                  <Submit
                    onClick={() => {
                      setModalOpenForCamera(false);
                    }}
                    className="m-2"
                  >
                    {t("submit")}
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
                setModalOpenForCamera(false);
              }}
              className="m-2"
            >
              {t("close")}
            </ButtonV2>
          </div>
        </div>
        {/* buttons for laptop screens */}
        <div className={`${isLaptopScreen ? " " : " hidden "}`}>
          <div className="m-4 flex lg:hidden">
            <ButtonV2 onClick={handleSwitchCamera}>
              <CareIcon className="care-l-camera-change text-lg" />
              {`${t("switch")} ${t("camera")}`}
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
                      <CareIcon className="care-l-capture text-lg" />
                      {t("capture")}
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
                      {t("retake")}
                    </ButtonV2>
                    <Submit
                      onClick={() => {
                        setModalOpenForCamera(false);
                      }}
                    >
                      {t("submit")}
                    </Submit>
                  </div>
                </>
              )}
            </div>
            <div className="sm:flex-1" />
            <ButtonV2
              variant="secondary"
              onClick={() => {
                setPreviewImage(null);
                setModalOpenForCamera(false);
              }}
            >
              {`${t("close")} ${t("camera")}`}
            </ButtonV2>
          </div>
        </div>
      </DialogModal>
      <DialogModal
        show={modalOpenForEdit}
        title={
          <div className="flex flex-row">
            <div className="rounded-full bg-primary-100 px-5 py-4">
              <CareIcon className="care-l-edit-alt text-lg text-primary-500" />
            </div>
            <div className="m-4">
              <h1 className="text-xl text-black "> Edit File Name</h1>
            </div>
          </div>
        }
        onClose={() => setModalOpenForEdit(false)}
      >
        <form
          onSubmit={(event: any) => {
            event.preventDefault();
            setbtnloader(true);
            partialupdateFileName(modalDetails?.id, editFileName);
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
                editFileName.length === 0
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
              <CareIcon className="care-l-exclamation-triangle text-lg text-danger-500 " />
            </div>
            <div className="text-grey-200 text-sm">
              <h1 className="text-xl text-black">Archive File</h1>
              This action is irreversible. Once a file is archived it cannot be
              unarchived.
            </div>
          </div>
        }
        onClose={() => setModalOpenForArchive(false)}
      >
        <form
          onSubmit={(event: any) => {
            event.preventDefault();
            setbtnloader(true);
            archiveFile(modalDetails?.id, archiveReason);
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
              <CareIcon className="care-l-question-circle text-lg text-primary-500 " />
            </div>
            <div className="text-grey-200 text-sm">
              <h1 className="text-xl text-black">File Details</h1>
              This file is archived. Once a file is archived it cannot be
              unarchived.
            </div>
          </div>
        }
        onClose={() => setModalOpenForMoreDetails(false)}
      >
        <div className="flex flex-col">
          <div>
            <div className="text-md m-2 text-center">
              <b>{modalDetails?.name}</b> file is archived.
            </div>
            <div className="text-md text-center">
              <b>Reason:</b> {modalDetails?.reason}
            </div>
            <div className="text-md text-center">
              <b>Archived_by:</b> {modalDetails?.userArchived}
            </div>
            <div className="text-md text-center">
              <b>Time of Archive:</b>
              {formatDateTime(modalDetails?.archiveTime)}
            </div>
          </div>
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
            <Cancel onClick={(_) => setModalOpenForMoreDetails(false)} />
          </div>
        </div>
      </DialogModal>
      <Page
        title={`${UPLOAD_HEADING[type]}`}
        hideBack={hideBack}
        breadcrumbs={false}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
        backUrl={
          type === "CONSULTATION"
            ? `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
            : `/facility/${facilityId}/patient/${patientId}`
        }
      >
        <div className="grid-cols-2 gap-4 md:grid">
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
                        <CareIcon className="care-l-trash h-4" /> Delete
                      </ButtonV2>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <VoiceRecorder
                      createAudioBlob={createAudioBlob}
                      confirmAudioBlobExists={confirmAudioBlobExists}
                      reset={resetRecording}
                      setResetRecording={setResetRecording}
                    />
                    {!audioBlobExists && (
                      <span className="text-sm font-medium text-warning-500">
                        <CareIcon className="care-l-exclamation-triangle mr-1 text-base" />
                        Please allow browser permission before you start
                        speaking
                      </span>
                    )}
                  </div>
                  {audioBlobExists && (
                    <div className="flex w-full items-center md:w-auto">
                      <ButtonV2
                        onClick={() => {
                          handleAudioUpload();
                        }}
                        className="w-full"
                      >
                        <CareIcon className={"care-l-cloud-upload text-xl"} />
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
                          <label className="button-size-default button-shape-square button-primary-default inline-flex h-min w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500">
                            <CareIcon className="care-l-file-upload-alt text-lg" />
                            {t("choose_file")}
                            <input
                              title="changeFile"
                              onChange={onFileChange}
                              type="file"
                              hidden
                            />
                          </label>
                        ) : (
                          <></>
                        )
                      }
                    </AuthorizedChild>
                    <ButtonV2
                      onClick={() => setModalOpenForCamera(true)}
                      className="w-full"
                    >
                      <CareIcon className="care-l-camera mr-2 text-lg" />
                      Open Camera
                    </ButtonV2>
                    <ButtonV2
                      authorizeFor={NonReadOnlyUsers}
                      disabled={!file || !uploadFileName || !isActive}
                      onClick={() => handleUpload({ status })}
                      className="w-full"
                    >
                      <CareIcon className="care-l-cloud-upload text-lg" />
                      {t("upload")}
                    </ButtonV2>
                  </div>
                )}
                {file && (
                  <div className="mt-2 flex items-center justify-between rounded bg-gray-200 px-4 py-2">
                    {file?.name}
                    <button
                      onClick={() => {
                        setFile(null);
                        setUploadFileName("");
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </Page>

      <Page title={`${VIEW_HEADING[type]}`} hideBack={true} breadcrumbs={false}>
        <HeadedTabs
          tabs={tabs}
          handleChange={handleTabChange}
          currentTabState={sortFileState}
        />
        {sortFileState === "UNARCHIVED" ? (
          // First it would check the filtered array contains any files or not else it would state the message
          <>
            {uploadedUnarchievedFiles?.length > 0 ? (
              uploadedUnarchievedFiles.map((item: FileUploadModel) =>
                renderFileUpload(item)
              )
            ) : (
              <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                <div className="text-md flex items-center justify-center font-bold text-gray-500">
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
                renderFileUpload(item)
              )
            ) : (
              <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                <div className="text-md flex items-center justify-center font-bold text-gray-500">
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
                  renderFileUpload(item)
                )
              ) : (
                <div className="mt-4 rounded-lg border bg-white p-4 shadow">
                  <div className="text-md flex items-center justify-center font-bold text-gray-500">
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
