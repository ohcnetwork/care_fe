import axios from "axios";
import { Button, CircularProgress, InputLabel } from "@material-ui/core";
import moment from "moment";
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
  deleteUpload,
  partialUpdateUploadFileName,
} from "../../Redux/actions";
import { FileUploadModel } from "./models";
import { TextInputField } from "../Common/HelperInputFields";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { GetApp, Visibility } from "@material-ui/icons";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import Modal from "@material-ui/core/Modal";
import { Close, ZoomIn, ZoomOut } from "@material-ui/icons";

import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import imageCompression from "browser-image-compression";
import clsx from "clsx";

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

interface ModalDetails {
  name?: string;
  id?: string;
}

interface URLS {
  [id: string]: string;
}

interface StateInterface {
  open: boolean;
  isImage: boolean;
  name: string;
  extension: string;
  zoom: number;
  isZoomInDisabled: boolean;
  isZoomOutDisabled: boolean;
}

export const FileUpload = (props: FileUploadProps) => {
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
  // const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reload, setReload] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileNameError, setUploadFileNameError] = useState<string>("");
  const [url, seturl] = useState<URLS>({});
  const [fileUrl, setFileUrl] = useState("");
  const [audioName, setAudioName] = useState<string>("");
  const [audioNameError, setAudioNameError] = useState<string>("");
  const [contentType, setcontentType] = useState<string>("");
  // const classes = useStyles();
  // const [modalStyle] = React.useState(getModalStyle);
  const [downloadURL, setDownloadURL] = useState<string>();
  const initialState = {
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 3,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
  };
  const [file_state, setFileState] = useState<StateInterface>(initialState);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [modalOpenForEdit, setModalOpenForEdit] = useState(false);
  const [modalDetails, setModalDetails] = useState<ModalDetails>();
  const [editFileName, setEditFileName] = useState<any>("");
  const [editFileNameError, setEditFileNameError] = useState("");
  const [modalOpenForDelete, setModalOpenForDelete] = useState(false);
  const [btnloader, setbtnloader] = useState(false);
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const currentuser_username = currentUser.data.username;
  const limit = RESULTS_PER_PAGE_LIMIT;

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatch(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
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
    const len = zoom_values.length - 1;
    if (file_state.zoom + 1 === len) {
      setFileState({
        ...file_state,
        zoom: file_state.zoom + 1,
        isZoomOutDisabled: false,
        isZoomInDisabled: true,
      });
      // setZoomInDisabled(true);
    } else {
      setFileState({
        ...file_state,
        zoom: file_state.zoom + 1,
        isZoomOutDisabled: false,
      });
    }
  };

  const handleZoomOut = () => {
    if (file_state.zoom - 1 === 0) {
      setFileState({
        ...file_state,
        zoom: file_state.zoom - 1,
        isZoomOutDisabled: true,
        isZoomInDisabled: false,
      });
    } else {
      setFileState({
        ...file_state,
        zoom: file_state.zoom - 1,
        isZoomInDisabled: false,
      });
    }
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
          setuploadedFiles(res.data.results);
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

  const deleteFile = async (id: any) => {
    const data = { file_type: type, associating_id: getAssociatedId() };

    const res = await dispatch(deleteUpload(data, id));
    if (res && res.status === 204) {
      fetchData(res.status);
      Notification.Success({
        msg: "File deleted successfully",
      });
      setbtnloader(false);
      setModalOpenForDelete(false);
    } else {
      setbtnloader(false);
    }
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

  const partialupdateFileName = async (id: any, name: string) => {
    const data = {
      file_type: type,
      name: name,
      associating_id: getAssociatedId(),
    };
    if (validateEditFileName(name)) {
      const res = await dispatch(partialUpdateUploadFileName(data, id));
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

  const renderFileUpload = (item: FileUploadModel) => {
    return (
      <div className="mt-4 border bg-white shadow rounded-lg p-4" key={item.id}>
        <Modal open={modalOpenForEdit}>
          <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
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
                  className="btn-primary btn mr-2 w-full md:w-auto"
                >
                  <svg
                    className={clsx(
                      "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
                      !btnloader ? " hidden" : ""
                    )}
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
                  onClick={(_) => setModalOpenForEdit(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
        <Modal open={modalOpenForDelete}>
          <div className="h-screen w-full absolute flex items-center justify-center bg-modal">
            <div className="bg-white rounded shadow p-8 m-4 max-h-full flex flex-col max-w-lg w-2/3 min-w-max-content">
              <h1 className="text-xl">
                Are you sure you want to delete the "{modalDetails?.name}" file
                ?
              </h1>
              <div className="flex flex-col-reverse md:flex-row gap-2 mt-4 justify-end">
                <button
                  type="submit"
                  onClick={() => {
                    setbtnloader(true);
                    deleteFile(modalDetails?.id);
                  }}
                  className="btn-primary btn mr-2 w-full md:w-auto"
                >
                  <svg
                    className={clsx(
                      "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
                      !btnloader ? " hidden" : ""
                    )}
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
                  Yes
                </button>
                <button
                  type="button"
                  className="btn-danger btn mr-2 w-full md:w-auto"
                  onClick={(_) => setModalOpenForDelete(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </Modal>
        {item.file_category === "AUDIO" ? (
          <div className="flex flex-wrap justify-between space-y-2">
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
                  ? moment(item.created_date).format("lll")
                  : "-"}
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
                    {item?.uploaded_by?.username === currentuser_username ? (
                      <>
                        <label
                          onClick={() => {
                            setModalDetails({ name: item.name, id: item.id });
                            setEditFileName(item?.name);
                            setModalOpenForEdit(true);
                          }}
                          className="btn btn-primary m-1 sm:w-auto w-full"
                        >
                          <i className="fa-solid fa-pencil mr-2"></i>EDIT FILE
                          NAME
                        </label>

                        <label
                          onClick={() => {
                            setModalDetails({ name: item.name, id: item.id });
                            setModalOpenForDelete(true);
                          }}
                          className="btn btn-primary m-1 sm:w-auto w-full"
                        >
                          <i className="fa-solid fa-trash-can mr-2"></i>DELETE
                          FILE
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
                  ? moment(item.created_date).format("lll")
                  : "-"}
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
              {item?.uploaded_by?.username === currentuser_username ? (
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
                    <i className="fa-solid fa-pencil mr-2"></i> EDIT FILE NAME
                  </label>
                  <label
                    onClick={() => {
                      setModalDetails({ name: item.name, id: item.id });
                      setModalOpenForDelete(true);
                    }}
                    className="btn btn-primary m-1 sm:w-auto w-full"
                  >
                    <i className="fa-solid fa-trash-can mr-2"></i> DELETE FILE
                  </label>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        )}
      </div>
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
      })
      .catch(() => {
        setUploadStarted(false);
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
      .catch(() => {
        setUploadStarted(false);
      })
      .then(fetchData(status).then(() => {}));

    // setting the value of file name to empty
    setUploadFileNameError("");
    setUploadFileName("");
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
    const filenameLength = audioName.trim().length;
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
            <div className="flex absolute w-3/5 top-16 md:top-0 md:right-4">
              {file_state.isImage && (
                <div className="flex flex-col gap-2 md:flex-row">
                  <div>
                    <Button
                      color="default"
                      variant="contained"
                      startIcon={<ZoomIn />}
                      onClick={() => {
                        handleZoomIn();
                      }}
                      disabled={file_state.isZoomInDisabled}
                    >
                      Zoom in
                    </Button>
                  </div>
                  <div>
                    <Button
                      color="default"
                      variant="contained"
                      startIcon={<ZoomOut />}
                      onClick={() => {
                        handleZoomOut();
                      }}
                      disabled={file_state.isZoomOutDisabled}
                    >
                      Zoom Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center md:absolute md:right-2">
              {downloadURL && downloadURL.length > 0 && (
                <a
                  href={downloadURL}
                  download={file_state.name + "." + file_state.extension}
                >
                  <Button
                    color="primary"
                    variant="contained"
                    startIcon={<GetApp />}
                  >
                    Download
                  </Button>
                </a>
              )}
              <Button
                color="primary"
                variant="contained"
                style={{ marginLeft: "10px" }}
                startIcon={<Close />}
                onClick={() => {
                  handleClose();
                }}
              >
                Close
              </Button>
            </div>
            {file_state.isImage ? (
              <img
                src={fileUrl}
                alt="file"
                className={
                  "object-contain mx-auto " + zoom_values[file_state.zoom]
                }
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
                      disabled={!file || !uploadFileName}
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
      {uploadedFiles && uploadedFiles.length > 0 ? (
        uploadedFiles.map((item: FileUploadModel) => renderFileUpload(item))
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
  );
};
