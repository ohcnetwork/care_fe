import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
} from "@material-ui/core";
import moment from "moment";
import CloudUploadOutlineIcon from "@material-ui/icons/CloudUpload";
import loadable from "@loadable/component";
import React, {
  useCallback,
  useState,
  useRef,
  ChangeEvent,
  useEffect,
} from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  viewUpload,
  retrieveUpload,
  retrieveUploadFilesURL,
  createUpload,
  getUserList,
} from "../../Redux/actions";
import { FlowModel, FileUploadModel } from "./models";
import { TextInputField } from "../Common/HelperInputFields";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import GetAppIcon from "@material-ui/icons/GetApp";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import { Close, ZoomIn, ZoomOut } from "@material-ui/icons";

import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";

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

function getModalStyle() {
  const top = 100;
  const left = 100;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      position: "absolute",
      width: "60%",
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
    },
  })
);

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
  const [file, setfile] = useState<File>();
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
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reload, setReload] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [url, seturl] = useState<URLS>({});
  const [fileUrl, setFileUrl] = useState("");
  const [contentType, setcontentType] = useState<string>("");
  const classes = useStyles();
  const [modalStyle] = React.useState(getModalStyle);
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
  const limit = RESULTS_PER_PAGE_LIMIT;

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const zoom_values = [
    "h-1/6 my-40",
    "h-2/6 my-32",
    "h-3/6 my-24",
    "h-4/6 my-20",
    "h-5/6 my-16",
    "h-full my-12",
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
      var data = {
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
    let audio_files = files;
    audio_files = audio_files.filter(
      (x: FileUploadModel) => x.file_category === "AUDIO"
    );

    const getURL = async (audio_files: any) => {
      var data = { file_type: type, associating_id: getAssociatedId() };
      let all_urls: any = {};

      for (const x of audio_files) {
        if (x.id) {
          var responseData = await dispatch(retrieveUpload(data, x.id));
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
    var data = { file_type: type, associating_id: getAssociatedId() };
    var responseData = await dispatch(retrieveUpload(data, id));
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
          <div>
            {item.file_category === "AUDIO" ? (
              <div>
                {item.id ? (
                  Object.keys(url).length > 0 ? (
                    <audio src={url[item.id]} controls preload="auto" />
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
                  startIcon={<GetAppIcon>load</GetAppIcon>}
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
    setfile(e.target.files[0]);
    const fileName = e.target.files[0].name;
    const ext: string = fileName.split(".")[1];
    setcontentType(header_content_type[ext]);
    return e.target.files[0];
  };

  const uploadfile = (response: any) => {
    var url = response.data.signed_url;
    var internal_name = response.data.internal_name;
    const f = file;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`);

    const config = {
      headers: {
        "Content-type": contentType,
        "Content-disposition": "inline",
      },
      onUploadProgress: (progressEvent: any) => {
        var percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };
    axios
      .put(url, newFile, config)
      .then((result) => {
        setUploadStarted(false);
        setUploadSuccess(true);
        setUploadFileName("");
        setReload(!reload);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch((error) => {
        setUploadStarted(false);
      });
  };

  const handleUpload = async (e: any) => {
    const f = file;
    if (f === undefined) return;
    const category = "UNSPECIFIED";
    const filename = uploadFileName;
    let name = f.name;
    setUploadStarted(true);
    setUploadSuccess(false);
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
      });
  };

  const createAudioBlob = (createdBlob: Blob) => {
    setAudioBlob(createdBlob);
  };

  const uploadAudiofile = (response: any) => {
    var url = response.data.signed_url;
    var internal_name = response.data.internal_name + ".mp3";
    const f = audioBlob;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`, { type: "audio/mpeg" });

    const config = {
      onUploadProgress: (progressEvent: any) => {
        var percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };

    axios
      .put(url, newFile, config)
      .then((result) => {
        setUploadStarted(false);
        setUploadSuccess(true);
        setUploadFileName("");
        setReload(!reload);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch((error) => {
        setUploadStarted(false);
      });
  };

  const handleAudioUpload = async (e: any) => {
    const f = audioBlob;
    if (f === undefined) return;
    const category = "AUDIO";
    const filename = Date.now().toString();
    let name = "audio";
    setUploadStarted(true);
    setUploadSuccess(false);
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
        setUploadStarted(false);
      });
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
            <div className="flex absolute w-3/5 right-2">
              {file_state.isImage && (
                <div className="w-2/6 flex">
                  <div className="mr-4">
                    <Button
                      color="default"
                      variant="contained"
                      style={{ marginLeft: "auto" }}
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
                      style={{ marginLeft: "4px" }}
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
              <div className="flex absolute right-2">
                {downloadURL && downloadURL.length > 0 && (
                  <div>
                    <a
                      href={downloadURL}
                      download
                      className="text-white p-4 my-2 rounded m-2 bg-primary-500"
                    >
                      <GetAppIcon>load</GetAppIcon>
                      Download
                    </a>
                  </div>
                )}

                <div>
                  <Button
                    color="primary"
                    variant="contained"
                    style={{ marginLeft: "auto" }}
                    startIcon={<Close />}
                    onClick={() => {
                      handleClose();
                    }}
                  >
                    Close
                  </Button>
                </div>
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

      <PageTitle title={`${UPLOAD_HEADING[type]}`} hideBack={hideBack} />
      <div className="mt-4">
        <div className="md:grid grid-cols-2 gap-4">
          {audio ? (
            <div className="bg-white border rounded-lg shadow p-4">
              <div>
                <h4>Record and Upload Audio File</h4>
              </div>
              <VoiceRecorder createAudioBlob={createAudioBlob} />
              {audioBlob && (
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto", float: "left" }}
                  startIcon={
                    <CloudUploadOutlineIcon>save</CloudUploadOutlineIcon>
                  }
                  onClick={(e: any) => {
                    handleAudioUpload(e);
                  }}
                >
                  Save Recording
                </Button>
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
                  name="temperature"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  InputLabelProps={{ shrink: !!uploadFileName }}
                  value={uploadFileName}
                  disabled={uploadStarted}
                  onChange={(e: any) => {
                    setUploadFileName(e.target.value);
                  }}
                  errors={`${[]}`}
                />
              </div>
              <div className="mt-4">
                {uploadStarted ? (
                  <LinearProgressWithLabel value={uploadPercent} />
                ) : (
                  <div className="md:flex justify-between">
                    <input
                      title="changeFile"
                      onChange={onFileChange}
                      type="file"
                    />
                    <div className="mt-2">
                      <Button
                        color="primary"
                        variant="contained"
                        type="submit"
                        startIcon={
                          <CloudUploadOutlineIcon>save</CloudUploadOutlineIcon>
                        }
                        onClick={(e: any) => {
                          handleUpload(e);
                        }}
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <PageTitle title={`${VIEW_HEADING[type]}`} hideBack={true} />
      {uploadedFiles.length > 0 &&
        uploadedFiles.map((item: FileUploadModel) => renderFileUpload(item))}
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
