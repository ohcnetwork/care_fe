import axios from "axios";
import { Button, CircularProgress, InputLabel } from "@material-ui/core";
import moment from "moment";
import CloudUploadOutlineIcon from "@material-ui/icons/CloudUpload";
import loadable from "@loadable/component";
import React, { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  viewUpload,
  retrieveUpload,
  createUpload,
  getPatient,
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

// Object for possible extension of image files
const ExtImage: URLS = {
  jpeg: "1",
  jpg: "1",
  gif: "1",
  png: "1",
  svg: "1",
};

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

interface StateInterface {
  open: boolean;
  isImage: boolean;
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

  // Function to extract the extension of the file and check if its image or not
  const getExtension = (url: string) => {
    const div1 = url.split("?")[0].split(".");
    const ext: string = div1[div1.length - 1].toLowerCase();
    if (ExtImage[ext] && ExtImage[ext] === "1") {
      return true;
    }
    return false;
  };

  const loadFile = async (id: any) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const data = { file_type: type, associating_id: getAssociatedId() };
    const responseData = await dispatch(retrieveUpload(data, id));
    setFileState({
      ...file_state,
      open: true,
      isImage: getExtension(responseData.data.read_signed_url),
    });
    downloadFileUrl(responseData.data.read_signed_url);
    setFileUrl(responseData.data.read_signed_url);
  };

  const renderFileUpload = (item: FileUploadModel) => {
    return (
      <div className="mt-4 border bg-white shadow rounded-lg p-4" key={item.id}>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
          <div>
            <div>
              <span className="font-semibold leading-relaxed">File Name: </span>{" "}
              {item.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Created By:</span>{" "}
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
            {item.file_category === "AUDIO" ? (
              <div className="flex space-x-2">
                {item.id ? (
                  Object.keys(url).length > 0 ? (
                    <>
                      <audio
                        className="max-h-full max-w-full m-auto object-contain"
                        src={url[item.id]}
                        controls
                        preload="auto"
                        controlsList="nodownload"
                      />
                      <a
                        href={url[item.id]}
                        className="text-black p-4"
                        download={true}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </a>
                    </>
                  ) : (
                    <CircularProgress />
                  )
                ) : (
                  <div>File Not found</div>
                )}
              </div>
            ) : (
              <div>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  startIcon={<Visibility />}
                  onClick={() => {
                    loadFile(item.id);
                  }}
                >
                  Preview File
                </Button>
              </div>
            )}
          </div>
        </div>
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

    if (ExtImage[ext] && ExtImage[ext] === "1") {
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
    const filename = uploadFileName === ""  && f ? f.name : uploadFileName;
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
            <div className="flex absolute inset-x-4 top-4 justify-between">
              <div className="flex gap-3">
              {file_state.isImage && (
                <>
                  {
                    [
                      ["Zoom In", "magnifying-glass-plus", handleZoomIn, file_state.zoom === zoom_values.length],
                      ["Zoom Out", "magnifying-glass-minus", handleZoomOut, file_state.zoom === 1],
                    ].map((button, index) => 
                      <button 
                        key={index}
                        onClick={button[2] as () => void}
                        className="bg-white/60 text-black backdrop-blur rounded px-4 py-2 transition hover:bg-white/70"
                        disabled={button[3] as boolean}
                      >
                        <i 
                          className={`fas fa-${button[1]} mr-2`}
                        />
                        {button[0] as String}
                      </button>
                    )
                  }
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
                    <label
                      className="flex items-center btn btn-primary"
                    >
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
                {file && <div className="mt-2 bg-gray-200 rounded flex items-center justify-between py-2 px-4">
                  {file?.name}
                  <button
                    onClick={()=>{
                      setFile(null);
                      setUploadFileName("");
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>}
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
