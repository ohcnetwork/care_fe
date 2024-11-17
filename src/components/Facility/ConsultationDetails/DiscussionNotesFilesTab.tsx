import { useState } from "react";
import { useTranslation } from "react-i18next";

import Pagination from "@/components/Common/Pagination";
import Tabs from "@/components/Common/Tabs";
import FileBlock from "@/components/Files/FileBlock";
import { FileUploadModel } from "@/components/Patient/models";

import useAuthUser from "@/hooks/useAuthUser";
import useFileManager from "@/hooks/useFileManager";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

interface DiscussionNotesProps {
  patientId: string;
  consultationId: string;
  facilityId: string;
  className?: string;
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

export const DiscussionNotesFiles = (props: DiscussionNotesProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState("UNARCHIVED");
  const authUser = useAuthUser();

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const FILE_TYPE = "NOTES" as const;

  const {
    data: activeFilesData,
    loading: activeFilesLoading,
    refetch: refetchActive,
  } = useQuery(routes.listConsultationFileUploads, {
    query: {
      is_archived: false,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset,
    },
    pathParams: { consultation_external_id: props.consultationId },
  });

  const {
    data: archivedFilesData,
    loading: archivedFilesLoading,
    refetch: refetchArchived,
  } = useQuery(routes.listConsultationFileUploads, {
    query: {
      is_archived: true,
      limit: RESULTS_PER_PAGE_LIMIT,
      offset,
    },
    pathParams: { consultation_external_id: props.consultationId },
  });

  const queries = {
    UNARCHIVED: {
      data: activeFilesData,
      loading: activeFilesLoading,
      refetch: refetchActive,
    },
    ARCHIVED: {
      data: archivedFilesData,
      loading: archivedFilesLoading,
      refetch: refetchArchived,
    },
  };

  const loading = Object.values(queries).some((q) => q.loading);
  const refetchAll = async () =>
    Promise.all(
      Object.values(queries).map((q) =>
        q.refetch?.().catch(() => {
          Notification.Error({ msg: "Failed to refetch files" });
        }),
      ),
    );

  const fileQuery = queries[tab as keyof typeof queries];

  const tabs = [
    { text: "Active Files", value: "UNARCHIVED" },
    { text: "Archived Files", value: "ARCHIVED" },
  ];

  const fileManager = useFileManager({
    type: FILE_TYPE,
    onArchive: refetchAll,
    onEdit: refetchAll,
  });

  return (
    <div className={`md:p-4 ${props.className}`}>
      {fileManager.Dialogues}
      <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h3>Discussion Notes Files</h3>
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
        {fileQuery?.data?.results.map((item: FileUploadModel) => {
          if (!item.associating_id) return null;
          return (
            <FileBlock
              file={item}
              key={item.id}
              fileManager={fileManager}
              associating_id={item.associating_id}
              editable={
                item?.uploaded_by?.username === authUser.username ||
                authUser.user_type === "DistrictAdmin" ||
                authUser.user_type === "StateAdmin"
              }
              archivable={true}
            />
          );
        })}
        {!(fileQuery?.data?.results || []).length && (
          <div className="mt-4">
            <div className="text-md flex items-center justify-center font-semibold capitalize text-secondary-500">
              {t("no_files_found", { type: tab.toLowerCase() })}
            </div>
          </div>
        )}
      </div>
      {fileQuery?.data && fileQuery.data.count > RESULTS_PER_PAGE_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={RESULTS_PER_PAGE_LIMIT}
            data={{ totalCount: fileQuery?.data?.count }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
