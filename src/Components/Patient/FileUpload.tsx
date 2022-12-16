import axios from "axios";
import { Button, CircularProgress, InputLabel } from "@material-ui/core";
import CloudUploadOutlineIcon from "@material-ui/icons/CloudUpload";
import loadable from "@loadable/component";
import React, { useCallback, useState, useEffect } from "react";
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
import { TextInputField } from "../Common/HelperInputFields";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import Modal from "@material-ui/core/Modal";
import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import imageCompression from "browser-image-compression";
import { formatDate } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import HeadedTabs from "../Common/HeadedTabs";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

interface FileUploadProps {
  type: string;
  patientId: any;
  facilityId: any;
  consultationId: any;
  hideBack: boolean;
  audio: boolean;
  unspecified: boolean;
  sampleId?: number;
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

interface StateInterface {
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
  } = props;
  const id = patientId;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setuploadedFiles] = useState<Array<FileUploadModel>>([
    {},
  ]);
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [audiouploadStarted, setAudioUploadStarted] = useState<boolean>(false);
  const [reload, setReload] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileNameError, setUploadFileNameError] = useState<string>("");
  const [url, seturl] = useState<URLS>({});
  const [fileUrl, setFileUrl] = useState("");
  const [audioName, setAudioName] = useState<string>("");
  const [audioNameError, setAudioNameError] = useState<string>("");
  const [contentType, setcontentType] = useState<string>("");
  const [downloadURL, setDownloadURL] = useState<string>();
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
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [modalOpenForEdit, setModalOpenForEdit] = useState(false);
  const [modalOpenForArchive, setModalOpenForArchive] = useState(false);
  const [modalOpenForMoreDetails, setModalOpenForMoreDetails] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");
  const [modalDetails, setModalDetails] = useState<ModalDetails>();
  const [editFileName, setEditFileName] = useState<any>("");
  const [editFileNameError, setEditFileNameError] = useState("");
  const [btnloader, setbtnloader] = useState(false);
  const [sortFileState, setSortFileState] = useState("UNARCHIVED");
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const currentuser_username = currentUser.data.username;
  const currentuser_type = currentUser.data.user_type;
  const limit = RESULTS_PER_PAGE_LIMIT;
  const [isActive, setIsActive] = useState(true);
  const tabs = [
    { name: "Unarchived Files", value: "UNARCHIVED" },
    { name: "Archived Files", value: "ARCHIVED" },
  ];
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

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const zoom_values = [
    "h-1/6 w-1/6 my-40",
    "h-2/6 w-2/6 my-32",
    "h-3/6 w-3/6 my-24",
    "h-4/6 w-4/6 my-20",
    "h-5/6 w-5/6 my-16",
    "h-full w-full my-12",
  ];

  const handleZoomIn = () => {
    const checkFull = file_state.zoom === zoom_values.length;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom + 1 : file_state.zoom,
    });
  };

  const handleZoomOut = () => {
    const checkFull = file_state.zoom === 1;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom - 1 : file_state.zoom,
    });
  };

  const handleRotate = (rotation: number) => {
    setFileState((prev) => ({
      ...prev,
      rotation: prev.rotation + rotation,
    }));
  };

  const UPLOAD_HEADING: { [index: string]: string } = {
    PATIENT: "Upload Patient Files",
    CONSULTATION: "Upload Consultation Files",
    SAMPLE_MANAGEMENT: "Upload Sample Report",
  };
  const VIEW_HEADING: { [index: string]: string } = {
    PATIENT: "View Patient Files",
    CONSULTATION: "View Consultation Files",
    SAMPLE_MANAGEMENT: "View Sample Report",
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
      case "PATIENT": {
        return patientId;
      }
      case "CONSULTATION": {
        return consultationId;
      }
      case "SAMPLE_MANAGEMENT": {
        return sampleId;
      }
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const data = {
        file_type: type,
        associating_id: getAssociatedId(),
        limit: limit,
        offset: offset,
      };
      const res = await dispatch(viewUpload(data));
      if (!status.aborted) {
        if (res && res.data) {
          audio_urls(res.data.results);
          setuploadedFiles(
            res.data.results.filter(
              (file: FileUploadModel) =>
                file.upload_completed || file.file_category === "AUDIO"
            )
          );
          setTotalCount(res.data.count);
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
    const data = { file_type: type, associating_id: getAssociatedId() };
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
      file_type: type,
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
          className="mt-4 border bg-white shadow rounded-lg p-4"
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
                      <div>
                        <span className="font-semibold leading-relaxed">
                          Created On :
                        </span>{" "}
                        {item.created_date
                          ? formatDate(item.created_date)
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {item.id ? (
                      Object.keys(url).length > 0 ? (
                        <div className="flex flex-wrap">
                          <audio
                            className="max-h-full max-w-full m-auto object-contain"
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
                      Object.keys(url).length > 0 ? (
                        <div className="flex flex-wrap">
                          <a
                            href={url[item.id]}
                            download={true}
                            className="btn btn-primary m-1 sm:w-auto w-full hover:text-white focus:bg-primary-500"
                          >
                            <i className="fa-solid fa-circle-arrow-down mr-2"></i>{" "}
                            DOWNLOAD
                          </a>
                          {item?.uploaded_by?.username ===
                            currentuser_username ||
                          currentuser_type === "DistrictAdmin" ||
                          currentuser_type === "StateAdmin" ? (
                            <>
                              <label
                                onClick={() => {
                                  setModalDetails({
                                    name: item.name,
                                    id: item.id,
                                  });
                                  setEditFileName(item?.name);
                                  setModalOpenForEdit(true);
                                }}
                                className="btn btn-primary m-1 sm:w-auto w-full"
                              >
                                <i className="fa-solid fa-pencil mr-2"></i>EDIT
                                FILE NAME
                              </label>
                            </>
                          ) : (
                            <></>
                          )}
                          {item?.uploaded_by?.username ===
                            currentuser_username ||
                          currentuser_type === "DistrictAdmin" ||
                          currentuser_type === "StateAdmin" ? (
                            <>
                              <label
                                onClick={() => {
                                  setArchiveReason("");
                                  setModalDetails({
                                    name: item.name,
                                    id: item.id,
                                  });
                                  setModalOpenForArchive(true);
                                }}
                                className="btn btn-primary m-1 sm:w-auto w-full"
                              >
                                <i className="fa-solid fa-box-archive mr-2 "></i>
                                ARCHIVE
                              </label>
                            </>
                          ) : (
                            <></>
                          )}
                        </div>
                      ) : (
                        <CircularProgress />
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
                      <div>
                        <span className="font-semibold leading-relaxed">
                          Created By:
                        </span>{" "}
                        {item.uploaded_by ? item.uploaded_by.username : null}
                      </div>
                      <div>
                        <span className="font-semibold leading-relaxed">
                          Created On :
                        </span>{" "}
                        {item.created_date
                          ? formatDate(item.created_date)
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center">
                    <label
                      onClick={() => {
                        loadFile(item.id);
                      }}
                      className="btn btn-primary m-1 sm:w-auto w-full"
                    >
                      {" "}
                      <i className="fa-solid fa-eye mr-2"></i> PREVIEW FILE
                    </label>
                    {item?.uploaded_by?.username === currentuser_username ||
                    currentuser_type === "DistrictAdmin" ||
                    currentuser_type === "StateAdmin" ? (
                      <>
                        {" "}
                        <label
                          onClick={() => {
                            setModalDetails({ name: item.name, id: item.id });
                            setEditFileName(item?.name);
                            setModalOpenForEdit(true);
                          }}
                          className="btn btn-primary m-1 sm:w-auto w-full"
                        >
                          <i className="fa-solid fa-pencil mr-2"></i> EDIT FILE
                          NAME
                        </label>
                      </>
                    ) : (
                      <></>
                    )}
                    {item?.uploaded_by?.username === currentuser_username ||
                    currentuser_type === "DistrictAdmin" ||
                    currentuser_type === "StateAdmin" ? (
                      <>
                        <label
                          onClick={() => {
                            setArchiveReason("");
                            setModalDetails({ name: item.name, id: item.id });
                            setModalOpenForArchive(true);
                          }}
                          className="btn btn-primary m-1 sm:w-auto w-full"
                        >
                          <i className="fa-solid fa-box-archive mr-2 "></i>
                          ARCHIVE
                        </label>
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
                          className="absolute w-6 h-6 bottom-1 right-1 text-red-600"
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
                          className="absolute w-6 h-6 bottom-1 right-1 text-red-600"
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
                    <div>
                      <span className="font-semibold leading-relaxed">
                        Created On :
                      </span>{" "}
                      {item.created_date ? formatDate(item.created_date) : "-"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center">
                  <label className="btn btn-primary disabled m-1 sm:w-auto w-full">
                    {" "}
                    <i className="fa-solid fa-eye-slash mr-2"></i> FILE ARCHIVED
                  </label>
                  <label
                    onClick={() => {
                      setModalDetails({
                        name: item.name,
                        reason: item.archive_reason,
                        userArchived: item.archived_by?.username,
                        archiveTime: item.archived_datetime,
                      });
                      setModalOpenForMoreDetails(true);
                    }}
                    className="btn btn-primary m-1 sm:w-auto w-full"
                  >
                    <i className="fa-solid fa-circle-question mr-2 "></i>MORE
                    DETAILS
                  </label>
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): any => {
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
          Notification.Success({
            msg: "File Uploaded Successfully",
          });
          setUploadFileNameError("");
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
    if (f === undefined) {
      setUploadFileNameError("Please choose a file to upload");
      return false;
    }
    if (filenameLength === 0) {
      setUploadFileNameError("Please give a name !!");
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
    if (f === undefined) {
      return false;
    }
    return true;
  };

  const handleAudioUpload = async () => {
    if (!validateAudioUpload()) return;
    setAudioNameError("");
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
      <Modal
        open={file_state.open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {fileUrl && fileUrl.length > 0 ? (
          <>
            <div className="flex absolute h-full sm:h-auto sm:inset-x-4 sm:top-4 p-4 sm:p-0 justify-between flex-col sm:flex-row">
              <div className="flex gap-3">
                {file_state.isImage && (
                  <>
                    {[
                      [
                        t("Zoom In"),
                        "magnifying-glass-plus",
                        handleZoomIn,
                        file_state.zoom === zoom_values.length,
                      ],
                      [
                        t("Zoom Out"),
                        "magnifying-glass-minus",
                        handleZoomOut,
                        file_state.zoom === 1,
                      ],
                      [
                        t("Rotate Left"),
                        "rotate-left",
                        () => handleRotate(-90),
                        false,
                      ],
                      [
                        t("Rotate Right"),
                        "rotate-right",
                        () => handleRotate(90),
                        false,
                      ],
                    ].map((button, index) => (
                      <button
                        key={index}
                        onClick={button[2] as () => void}
                        className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70 z-50"
                        disabled={button[3] as boolean}
                      >
                        <i className={`fas fa-${button[1]} mr-2`} />
                        {button[0] as string}
                      </button>
                    ))}
                  </>
                )}
              </div>
              <div className="flex gap-3">
                {downloadURL && downloadURL.length > 0 && (
                  <a
                    href={downloadURL}
                    download
                    className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70"
                  >
                    <i className="fas fa-download mr-2" />
                    Download
                  </a>
                )}
                <button
                  onClick={handleClose}
                  className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70"
                >
                  <i className="fas fa-times mr-2" />
                  Close
                </button>
              </div>
            </div>
            {file_state.isImage ? (
              <img
                src={fileUrl}
                alt="file"
                className={
                  "object-contain mx-auto " + zoom_values[file_state.zoom]
                }
                style={{
                  transform: `rotate(${file_state.rotation}deg)`,
                }}
              />
            ) : (
              <iframe
                title="Source Files"
                src={fileUrl}
                className="border-2 border-black bg-white w-4/6 h-5/6 mx-auto my-6"
              />
            )}
          </>
        ) : (
          <div className="flex h-screen justify-center items-center">
            <div className="text-center">
              <CircularProgress />
            </div>
          </div>
        )}
      </Modal>
      <Modal open={modalOpenForEdit}>
        <div className="h-screen w-full absolute flex items-center justify-center ">
          <form
            onSubmit={(event: any) => {
              event.preventDefault();
              setbtnloader(true);
              partialupdateFileName(modalDetails?.id, editFileName);
            }}
            className="bg-white rounded shadow p-8 m-4 max-h-full flex flex-col max-w-lg w-2/3 min-w-max-content"
          >
            <div>
              <InputLabel className="text-xl" id="editfilenamelabel">
                Please enter the file name
              </InputLabel>
              <TextInputField
                name="editFileName"
                variant="outlined"
                margin="dense"
                value={editFileName}
                onChange={(e) => setEditFileName(e.target.value)}
                errors={editFileNameError}
              />
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
              <button
                type="submit"
                disabled={modalDetails?.name === editFileName || btnloader}
                className="btn-primary btn mr-2 w-full md:w-auto"
              >
                <svg
                  className={`animate-spin -ml-1 mr-3 h-5 w-5 text-primary ${
                    !btnloader ? " hidden " : " "
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Proceed
              </button>
              <button
                type="button"
                className="btn-danger btn mr-2 w-full md:w-auto"
                disabled={btnloader}
                onClick={(_) => setModalOpenForEdit(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={modalOpenForArchive}>
        <div className="h-screen w-full absolute flex items-center justify-center ">
          <form
            onSubmit={(event: any) => {
              event.preventDefault();
              setbtnloader(true);
              archiveFile(modalDetails?.id, archiveReason);
            }}
            className="bg-white rounded shadow p-8 m-4 max-h-full flex flex-col max-w-lg w-2/3 min-w-max-content"
          >
            <div className="text-center m-2">
              <i className="fa-solid fa-5x fa-triangle-exclamation text-red-500"></i>
            </div>
            <div className="text-xl text-center text-black m-2">
              This action is irreversible. Once a file is archived it cannot be
              unarchived.
            </div>
            <div>
              <InputLabel
                className="text-md text-black text-center"
                id="archivereasonlabel"
              >
                Please state the reason for archiving{" "}
                <b>{modalDetails?.name}</b> file?
              </InputLabel>
              <TextInputField
                name="editFileName"
                variant="outlined"
                rows={6}
                multiline
                required
                className="w-full border p-2 max-h-64"
                placeholder="Type the reason..."
                margin="dense"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                errors={archiveReasonError}
              />
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
              <button
                type="submit"
                className="btn-primary btn mr-2 w-full md:w-auto"
              >
                <svg
                  className={`animate-spin -ml-1 mr-3 h-5 w-5 text-white ${
                    !btnloader ? " hidden " : " "
                  } `}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Proceed
              </button>
              <button
                type="button"
                className="btn-danger btn mr-2 w-full md:w-auto"
                onClick={(_) => setModalOpenForArchive(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={modalOpenForMoreDetails}>
        <div className="h-screen w-full absolute flex items-center justify-center">
          <div className="bg-white rounded shadow p-8 m-4 max-h-full flex flex-col max-w-lg w-2/3 min-w-max-content">
            <div>
              <div className="text-center">
                <i className="fa-solid fa-file-circle-xmark my-2 fa-4x text-primary-500"></i>
              </div>
              <div className="text-md text-center m-2">
                <b>{modalDetails?.name} file is archived.</b>
              </div>
              <div className="text-md text-center">
                <b>Reason:</b> {modalDetails?.reason}
              </div>
              <div className="text-md text-center">
                <b>Archived_by:</b> {modalDetails?.userArchived}
              </div>
              <div className="text-md text-center">
                <b>Time of Archive:</b>
                {formatDate(modalDetails?.archiveTime)}
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
              <button
                type="button"
                className="btn-danger btn mr-2 w-full md:w-auto"
                onClick={(_) => setModalOpenForMoreDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
      <PageTitle
        title={`${UPLOAD_HEADING[type]}`}
        hideBack={hideBack}
        breadcrumbs={false}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      <div className="mt-4">
        <div className="md:grid grid-cols-2 gap-4">
          {audio ? (
            <div className="bg-white border rounded-lg shadow p-4">
              <div>
                <h4>Record and Upload Audio File</h4>
              </div>
              <InputLabel id="spo2-label">
                Enter Audio File Name (optional)
              </InputLabel>
              <TextInputField
                name="consultation_audio_file"
                variant="outlined"
                margin="dense"
                type="text"
                InputLabelProps={{ shrink: !!audioName }}
                value={audioName}
                disabled={uploadStarted}
                onChange={(e: any) => {
                  setAudioName(e.target.value);
                }}
                errors={audioNameError}
              />
              {audiouploadStarted ? (
                <LinearProgressWithLabel value={uploadPercent} />
              ) : (
                <>
                  <VoiceRecorder createAudioBlob={createAudioBlob} />
                  {audioBlob && (
                    <Button
                      color="primary"
                      variant="contained"
                      type="submit"
                      style={{ marginLeft: "auto" }}
                      startIcon={
                        <CloudUploadOutlineIcon>save</CloudUploadOutlineIcon>
                      }
                      onClick={() => {
                        handleAudioUpload();
                      }}
                    >
                      Save Recording
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : null}
          {unspecified ? (
            <div className="mt-4 md:mt-0 bg-white border rounded-lg shadow p-4">
              <div>
                <h4>Upload New File</h4>
              </div>
              <div>
                <InputLabel id="spo2-label">Enter File Name</InputLabel>
                <TextInputField
                  name="consultation_file"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  InputLabelProps={{ shrink: !!uploadFileName }}
                  value={uploadFileName}
                  disabled={uploadStarted}
                  onChange={(e: any) => {
                    setUploadFileName(e.target.value);
                  }}
                  errors={uploadFileNameError}
                />
              </div>
              <div className="mt-4">
                {uploadStarted ? (
                  <LinearProgressWithLabel value={uploadPercent} />
                ) : (
                  <div className="flex flex-col gap-2 md:flex-row justify-between md:items-center items-stretch">
                    <label className="flex items-center btn btn-primary">
                      <i className="fas fa-file-arrow-down mr-2" /> Choose file
                      <input
                        title="changeFile"
                        onChange={onFileChange}
                        type="file"
                        hidden
                      />
                    </label>
                    <button
                      className="btn btn-primary"
                      disabled={!file || !uploadFileName || !isActive}
                      onClick={() => {
                        handleUpload({ status });
                      }}
                    >
                      <i className="fas fa-cloud-arrow-up mr-2" /> Upload
                    </button>
                  </div>
                )}
                {file && (
                  <div className="mt-2 bg-gray-200 rounded flex items-center justify-between py-2 px-4">
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
      </div>

      <PageTitle
        title={`${VIEW_HEADING[type]}`}
        hideBack={true}
        breadcrumbs={false}
      />
      <HeadedTabs
        tabs={tabs}
        handleChange={handleTabChange}
        currentTabState={sortFileState}
      />

      <div>
        {uploadedFiles && uploadedFiles.length > 0 ? (
          sortFileState === "UNARCHIVED" ? (
            // First it would check the filtered array contains any files or not else it would state the message
            <>
              {[
                ...uploadedFiles.filter(
                  (item: FileUploadModel) => !item.is_archived
                ),
              ].length > 0 ? (
                [
                  ...uploadedFiles.filter(
                    (item: FileUploadModel) => !item.is_archived
                  ),
                ].map((item: FileUploadModel) => renderFileUpload(item))
              ) : (
                <div className="mt-4 border bg-white shadow rounded-lg p-4">
                  <div className="font-bold text-gray-500 text-md flex justify-center items-center">
                    {"No Unarchived File in the Current Page"}
                  </div>
                </div>
              )}
            </>
          ) : (
            // First it would check the filtered array contains any files or not else it would state the message
            <>
              {[
                ...uploadedFiles.filter(
                  (item: FileUploadModel) => item.is_archived
                ),
              ].length > 0 ? (
                [
                  ...uploadedFiles.filter(
                    (item: FileUploadModel) => item.is_archived
                  ),
                ].map((item: FileUploadModel) => renderFileUpload(item))
              ) : (
                <div className="mt-4 border bg-white shadow rounded-lg p-4">
                  <div className="font-bold text-gray-500 text-md flex justify-center items-center">
                    {"No Archived File in the Current Page"}
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          <div className="mt-4 border bg-white shadow rounded-lg p-4">
            <div className="font-bold text-gray-500 text-md flex justify-center items-center">
              {"No Data Found"}
            </div>
          </div>
        )}
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};
