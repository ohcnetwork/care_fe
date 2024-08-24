import { useState } from "react";
import { FileUploadModel } from "./models";
import Pagination from "../Common/Pagination";
import { RESULTS_PER_PAGE_LIMIT } from "../../Common/constants";
import { useTranslation } from "react-i18next";
import useAuthUser from "../../Common/hooks/useAuthUser";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Tabs from "../Common/components/Tabs";
import FileBlock from "../Files/FileBlock";
import useFileManager from "../../Utils/useFileManager";

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

  // TODO : Change this
  const associatedId = "ea85f2dd-0f2c-4079-8e38-f41bc8fe64a5";
  const type = "NOTES";
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

  const queries = {
    UNARCHIVED: activeFilesQuery,
    ARCHIVED: archivedFilesQuery,
  };

  const loading = Object.values(queries).some((q) => q.loading);
  const refetchAll = async () =>
    Promise.all(Object.values(queries).map((q) => q.refetch()));

  const fileQuery = queries[tab as keyof typeof queries];

  const tabs = [
    { text: "Active Files", value: "UNARCHIVED" },
    { text: "Archived Files", value: "ARCHIVED" },
  ];

  const fileManager = useFileManager({
    type,
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
        {fileQuery?.data?.results.map((item: FileUploadModel) => (
          <FileBlock
            file={item}
            key={item.id}
            fileManager={fileManager}
            associating_id={associatedId}
            editable={
              item?.uploaded_by?.username === authUser.username ||
              authUser.user_type === "DistrictAdmin" ||
              authUser.user_type === "StateAdmin"
            }
            archivable={true}
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
