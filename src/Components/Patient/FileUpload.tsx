import { useState, ChangeEvent, useEffect, ReactNode } from "react";
import { CreateFileResponse, FileUploadModel } from "./models";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";
import Pagination from "../Common/Pagination";
import {
  FILE_EXTENSIONS,
  RESULTS_PER_PAGE_LIMIT,
} from "../../Common/constants";
import imageCompression from "browser-image-compression";
import { classNames } from "../../Utils/utils";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon, { IconName } from "../../CAREUI/icons/CareIcon";
import TextFormField from "../Form/FormFields/TextFormField";
import { NonReadOnlyUsers } from "../../Utils/AuthorizeFor";
import AuthorizedChild from "../../CAREUI/misc/AuthorizedChild";
import useAuthUser from "../../Common/hooks/useAuthUser";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import uploadFile from "../../Utils/request/uploadFile";
import useFileUpload from "../../Utils/useFileUpload";
import useFileManager from "../../Utils/useFileManager";
import Tabs from "../Common/components/Tabs";
import FileBlock from "../Files/FileBlock";

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
  patientId?: string;
  consultationId?: string;
  consentId?: string;
  allowAudio?: boolean;
  sampleId?: string;
  claimId?: string;
  className?: string;
  hideUpload?: boolean;
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
    consultationId,
    patientId,
    consentId,
    type,
    sampleId,
    claimId,
    allowAudio,
    hideUpload
  } = props;
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [audiouploadStarted, setAudioUploadStarted] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadFileError, setUploadFileError] = useState<string>("");
  const [audioName, setAudioName] = useState<string>("");
  const [audioFileError, setAudioFileError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState("UNARCHIVED");
  const authUser = useAuthUser();
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

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: { id: patientId || "" },
    prefetch: !!patientId,
  });

  const { data: consultation } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId || "" },
    prefetch: !!consultationId,
  });

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const UPLOAD_HEADING: { [index: string]: string } = {
    PATIENT: "Upload New Patient File",
    CONSULTATION: "Upload New Consultation File",
    SAMPLE_MANAGEMENT: "Upload Sample Report",
    CLAIM: "Upload Supporting Info",
  };
  const VIEW_HEADING: { [index: string]: string } = {
    PATIENT: "Patient Files",
    CONSULTATION: "Consultation Files",
    SAMPLE_MANAGEMENT: "Sample Report",
    CLAIM: "Supporting Info",
  };

  const associatedId = {
    "PATIENT": patientId,
    "CONSENT_RECORD": consentId,
    "CONSULTATION": consultationId,
    "SAMPLE_MANAGEMENT": sampleId,
    "CLAIM": claimId
  }[type] || ""

  const activeFilesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: type,
      associating_id: associatedId,
      is_archived: false,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset: offset,
    },
  })

  const archivedFilesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: type,
      associating_id: associatedId,
      is_archived: true,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset: offset,
    },
  });

  const dischargeSummaryQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: "DISCHARGE_SUMMARY",
      associating_id: associatedId,
      is_archived: false,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset: offset,
    },
    prefetch: type === "CONSULTATION"
  });

  const queries = {
    "UNARCHIVED": activeFilesQuery,
    "ARCHIVED": archivedFilesQuery,
    "DISCHARGE_SUMMARY": dischargeSummaryQuery
  }

  const refetchAll = async () => Promise.all(Object.values(queries).map(q => q.refetch()));
  const loading = Object.values(queries).some(q => q.loading)

  const fileQuery = queries[tab as keyof typeof queries];

  const tabs = [
    { text: "Active Files", value: "UNARCHIVED" },
    { text: "Archived Files", value: "ARCHIVED" },
    ...(dischargeSummaryQuery.data?.results?.length ? [
      {
        text: "Discharge Summary",
        value: "DISCHARGE_SUMMARY",
      },
    ] : [])
  ]

  const fileUpload = useFileUpload({
    type,
    allowAllExtensions: true,
  });

  const fileManager = useFileManager({
    type,
    onArchive: refetchAll,
    onEdit: refetchAll
  });

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

    if (FILE_EXTENSIONS.IMAGE.includes(ext as (typeof FILE_EXTENSIONS.IMAGE)[number])) {
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
            refetchAll()
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
        associatingId: associatedId,
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
        associating_id: associatedId,
        file_category: category,
        mime_type: f?.type ?? "",
      },
    });

    if (data) {
      await uploadfile(data);
      await markUploadComplete(data);
      await refetchAll();
    }
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
          refetchAll()
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
        associating_id: associatedId,
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

  const uploadButtons: { name: string, icon: IconName, onClick?: () => void, children?: ReactNode }[] = [
    {
      name: t("choose_file"),
      icon: "l-file-upload-alt",
      children: <fileUpload.Input />
    },
    {
      name: t("open_camera"),
      icon: "l-camera",
      onClick: fileUpload.handleCameraCapture
    },
    {
      name: t("record"),
      icon: "l-microphone"
    }
  ]

  return (
    <div className={`md:p-4 ${props.className}`}>
      {fileUpload.Dialogues}
      {fileManager.Dialogues}
      {!hideUpload && (
        <>
          <h4 className="text-2xl mb-6">{UPLOAD_HEADING[type]}</h4>
          <div className="mb-8 flex items-center gap-4 md:flex-row flex-col">
            {uploadButtons.map((button, i) => (
              <label
                key={i}
                className="cursor-pointer text-primary-700 bg-primary-500/10 hover:bg-primary-500/20 transition-all border border-dashed border-primary-500/20 rounded-lg p-3 md:p-6 w-full flex items-center justify-center gap-2"
                onClick={button.onClick}
              >
                <CareIcon icon={button.icon} className="text-2xl" />
                <div className="text-lg">
                  {button.name}
                </div>
                {button.children}
              </label>
            ))}
          </div>
          <div className="rounded-lg hidden border border-secondary-300 bg-white p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4>{UPLOAD_HEADING[type]}</h4>
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
                  <div className="flex w-full items-center gap-2 md:flex-row flex-col">
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
                      {t("open_camera")}
                    </ButtonV2>
                    <VoiceRecorder
                      isDisabled={!!consultation?.discharge_date}
                      createAudioBlob={(createdBlob: Blob) =>
                        setAudioBlob(createdBlob)
                      }
                      confirmAudioBlobExists={() => setAudioBlobExists(true)}
                      reset={resetRecording}
                      setResetRecording={setResetRecording}
                      handleSetMicPermission={setIsMicPermission}
                    />
                  </div>
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
                          setAudioBlobExists(false);
                          setResetRecording(true);
                        }}
                      >
                        <CareIcon icon="l-trash" className="h-4" /> Delete
                      </ButtonV2>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-4 md:flex-row md:flex-wrap lg:flex-nowrap">

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
        </>
      )}
      <div className="flex flex-col gap-4 md:flex-row items-center justify-between mb-4">
        <h3>
          {VIEW_HEADING[type]}
        </h3>
        <Tabs
          tabs={tabs}
          onTabChange={(v) => setTab(v.toString())}
          currentTab={tab}
        />
      </div>
      <div className="flex flex-col gap-2">
        {loading && <div className="skeleton-animate-alpha h-32 rounded-lg" />}
        {fileQuery?.data?.results.map((item: FileUploadModel) =>
          <FileBlock
            file={item}
            key={item.id}
            fileManager={fileManager}
            associating_id={associatedId}
            editable={item?.uploaded_by?.username === authUser.username ||
              authUser.user_type === "DistrictAdmin" ||
              authUser.user_type === "StateAdmin"}
          />,
        )}
        {!(fileQuery?.data?.results || []).length && (
          <div className="mt-4">
            <div className="text-md flex items-center justify-center font-semibold text-secondary-500 capitalize">
              No {tab.toLowerCase()} files found
            </div>
          </div>
        )}
      </div>
      {(fileQuery?.data?.results || []).length > RESULTS_PER_PAGE_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={RESULTS_PER_PAGE_LIMIT}
            data={{ totalCount: (fileQuery?.data?.results || []).length }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};