import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import AuthorizedChild from "@/CAREUI/misc/AuthorizedChild";

import ButtonV2 from "@/components/Common/ButtonV2";
import Pagination from "@/components/Common/Pagination";
import Tabs from "@/components/Common/Tabs";
import FileBlock from "@/components/Files/FileBlock";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import { FileUploadModel } from "@/components/Patient/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFileManager from "@/hooks/useFileManager";
import useFileUpload from "@/hooks/useFileUpload";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export const LinearProgressWithLabel = (props: { value: number }) => {
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

export const FileUpload = (props: FileUploadProps) => {
  const { t } = useTranslation();
  const {
    consultationId,
    patientId,
    consentId,
    type,
    sampleId,
    claimId,
    allowAudio,
    hideUpload,
  } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState("UNARCHIVED");
  const authUser = useAuthUser();

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const UPLOAD_HEADING: { [index: string]: string } = {
    PATIENT: t("upload_headings__patient"),
    CONSULTATION: t("upload_headings__consultation"),
    SAMPLE_MANAGEMENT: t("upload_headings__sample_report"),
    CLAIM: t("upload_headings__supporting_info"),
  };
  const VIEW_HEADING: { [index: string]: string } = {
    PATIENT: t("file_list_headings__patient"),
    CONSULTATION: t("file_list_headings__consultation"),
    SAMPLE_MANAGEMENT: t("file_list_headings__sample_report"),
    CLAIM: t("file_list_headings__supporting_info"),
  };

  const associatedId =
    {
      PATIENT: patientId,
      CONSENT_RECORD: consentId,
      CONSULTATION: consultationId,
      SAMPLE_MANAGEMENT: sampleId,
      CLAIM: claimId,
    }[type] || "";

  const activeFilesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: type,
      associating_id: associatedId,
      is_archived: false,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset: offset,
    },
  });

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
    prefetch: type === "CONSULTATION",
    silent: true,
  });

  const queries = {
    UNARCHIVED: activeFilesQuery,
    ARCHIVED: archivedFilesQuery,
    DISCHARGE_SUMMARY: dischargeSummaryQuery,
  };

  const refetchAll = async () =>
    Promise.all(Object.values(queries).map((q) => q.refetch()));
  const loading = Object.values(queries).some((q) => q.loading);

  const fileQuery = queries[tab as keyof typeof queries];

  const tabs = [
    { text: "Active Files", value: "UNARCHIVED" },
    { text: "Archived Files", value: "ARCHIVED" },
    ...(dischargeSummaryQuery.data?.results?.length
      ? [
          {
            text: "Discharge Summary",
            value: "DISCHARGE_SUMMARY",
          },
        ]
      : []),
  ];

  const fileUpload = useFileUpload({
    type,
    allowedExtensions: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "tiff",
      "mp4",
      "mov",
      "avi",
      "wmv",
      "mp3",
      "wav",
      "ogg",
      "txt",
      "csv",
      "rtf",
      "doc",
      "odt",
      "pdf",
      "xls",
      "xlsx",
      "ods",
      "pdf",
    ],
    allowNameFallback: false,
    onUpload: refetchAll,
  });

  const fileManager = useFileManager({
    type,
    onArchive: refetchAll,
    onEdit: refetchAll,
  });

  const dischargeSummaryFileManager = useFileManager({
    type: "DISCHARGE_SUMMARY",
    onArchive: refetchAll,
    onEdit: refetchAll,
  });

  const uploadButtons: {
    name: string;
    icon: IconName;
    onClick?: () => void;
    children?: ReactNode;
    show?: boolean;
    id: string;
  }[] = [
    {
      name: t("choose_file"),
      icon: "l-file-upload-alt",
      children: <fileUpload.Input />,
      id: "upload-file",
    },
    {
      name: t("open_camera"),
      icon: "l-camera",
      onClick: fileUpload.handleCameraCapture,
      id: "open-webcam",
    },
    {
      name: t("record"),
      icon: "l-microphone",
      onClick: fileUpload.handleAudioCapture,
      show: allowAudio,
      id: "record-audio",
    },
  ];

  return (
    <div className={`md:p-4 ${props.className}`}>
      {fileUpload.Dialogues}
      {fileManager.Dialogues}
      {dischargeSummaryFileManager.Dialogues}
      {!hideUpload && (
        <AuthorizedChild authorizeFor={NonReadOnlyUsers}>
          {({ isAuthorized }) =>
            isAuthorized ? (
              <>
                <h4 className="mb-6 text-2xl">{UPLOAD_HEADING[type]}</h4>
                {fileUpload.files[0] ? (
                  <div className="mb-8 rounded-lg border border-secondary-300 bg-white p-4">
                    <div className="mb-4 flex items-center justify-between gap-2 rounded-md bg-secondary-300 px-4 py-2">
                      <span>
                        <CareIcon icon="l-paperclip" className="mr-2" />
                        {fileUpload.files[0].name}
                      </span>
                      <button
                        onClick={fileUpload.clearFiles}
                        disabled={fileUpload.uploading}
                        className="text-lg"
                      >
                        <CareIcon icon="l-times" />
                      </button>
                    </div>
                    <TextFormField
                      name="consultation_file"
                      type="text"
                      label={t("enter_file_name")}
                      id="upload-file-name"
                      required
                      value={fileUpload.fileNames[0] || ""}
                      disabled={fileUpload.uploading}
                      onChange={(e) => fileUpload.setFileName(e.value)}
                      error={fileUpload.error || undefined}
                    />
                    <div className="flex items-center gap-2">
                      <ButtonV2
                        onClick={() =>
                          fileUpload.handleFileUpload(associatedId)
                        }
                        loading={fileUpload.uploading}
                        className="w-full"
                        id="upload_file_button"
                      >
                        <CareIcon icon="l-check" className="" />
                        {t("upload")}
                      </ButtonV2>
                      <ButtonV2
                        variant="danger"
                        onClick={fileUpload.clearFiles}
                        disabled={fileUpload.uploading}
                      >
                        <CareIcon icon="l-trash-alt" className="" />
                        {t("discard")}
                      </ButtonV2>
                    </div>
                    {!!fileUpload.progress && (
                      <LinearProgressWithLabel value={fileUpload.progress} />
                    )}
                  </div>
                ) : (
                  <div className="mb-8 flex flex-col items-center gap-4 md:flex-row">
                    {uploadButtons
                      .filter((b) => b.show !== false)
                      .map((button, i) => (
                        <label
                          key={i}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary-500/20 bg-primary-500/10 p-3 text-primary-700 transition-all hover:bg-primary-500/20 md:p-6"
                          onClick={button.onClick}
                          id={button.id}
                        >
                          <CareIcon icon={button.icon} className="text-2xl" />
                          <div className="text-lg">{button.name}</div>
                          {button.children}
                        </label>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <></>
            )
          }
        </AuthorizedChild>
      )}
      <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h3>{VIEW_HEADING[type]}</h3>
        <Tabs
          tabs={tabs}
          onTabChange={(v) => setTab(v.toString())}
          currentTab={tab}
        />
      </div>
      <div className="flex flex-col gap-2">
        {!(fileQuery?.data?.results || []).length && loading && (
          <div className="skeleton-animate-alpha h-32 rounded-lg" />
        )}
        {fileQuery?.data?.results.map((item: FileUploadModel) => (
          <FileBlock
            file={item}
            key={item.id}
            fileManager={
              tab !== "DISCHARGE_SUMMARY"
                ? fileManager
                : dischargeSummaryFileManager
            }
            associating_id={associatedId}
            editable={
              item?.uploaded_by?.username === authUser.username ||
              authUser.user_type === "DistrictAdmin" ||
              authUser.user_type === "StateAdmin"
            }
            archivable={tab !== "DISCHARGE_SUMMARY"}
          />
        ))}
        {!(fileQuery?.data?.results || []).length && (
          <div className="mt-4">
            <div className="text-md flex items-center justify-center font-semibold capitalize text-secondary-500">
              {t("no_files_found", { type: tab.toLowerCase() })}
            </div>
          </div>
        )}
      </div>
      {(fileQuery?.data?.count ?? 0) > RESULTS_PER_PAGE_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={RESULTS_PER_PAGE_LIMIT}
            data={{ totalCount: fileQuery?.data?.count ?? 0 }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
