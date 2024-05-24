import dayjs from "dayjs";
import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { ConsentRecord } from "../Facility/models";
import { FileUploadModel } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import { useEffect } from "react";
import useAuthUser from "../../Common/hooks/useAuthUser";

export default function PatientConsentRecordBlockGroup(props: {
  consentRecord: ConsentRecord;
  previewFile: (file: FileUploadModel, file_associating_id: string) => void;
  archiveFile: (file: FileUploadModel, file_associating_id: string) => void;
  onDelete: (consentRecord: ConsentRecord) => void;
  refreshTrigger: any;
  showArchive: boolean;
  onFilesFound: () => void;
}) {
  const {
    consentRecord,
    previewFile,
    archiveFile,
    refreshTrigger,
    showArchive,
  } = props;

  const authUser = useAuthUser();

  const filesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: "CONSENT_RECORD",
      associating_id: consentRecord.id,
      is_archived: false,
      limit: 100,
      offset: 0,
    },
  });

  const archivedFilesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: "CONSENT_RECORD",
      associating_id: consentRecord.id,
      is_archived: true,
      limit: 100,
      offset: 0,
    },
  });

  const consent = CONSENT_TYPE_CHOICES.find((c) => c.id === consentRecord.type);
  const consentPCS = CONSENT_PATIENT_CODE_STATUS_CHOICES.find(
    (c) => c.id === consentRecord.patient_code_status,
  );

  const data = showArchive
    ? [
        ...(archivedFilesQuery.data?.results || []),
        ...(filesQuery.data?.results || []),
      ]
    : filesQuery.data?.results;

  useEffect(() => {
    filesQuery.refetch();
    archivedFilesQuery.refetch();
  }, [refreshTrigger]);

  useEffect(() => {
    if ((data?.length || 0) > 1) {
      props.onFilesFound();
    }
  }, [data]);

  return (
    <div
      className={`flex flex-col gap-2 ${(data?.length || 0) < 1 && "hidden"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4>
            {consent?.text} {consentPCS?.text && `(${consentPCS.text})`}
          </h4>
          {consentRecord.deleted && (
            <div>
              <div className="text-sm">
                <CareIcon icon="l-archive" className="mr-1" />
                Archived
              </div>
            </div>
          )}
        </div>
        {/*
        {!consentRecord.deleted && !showArchive && (
          <button
            className="text-red-500 hover:text-red-600"
            onClick={() => props.onDelete(consentRecord)}
          >
            <CareIcon icon="l-archive" className="mr-1" />
            Archive
          </button>
        )}
      */}
      </div>

      {data?.map((file: FileUploadModel, i: number) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded-lg border border-gray-300 ${showArchive ? "text-gray-600" : "bg-white"}  px-4 py-2 transition-all hover:bg-gray-100`}
        >
          <div className="flex items-center gap-4 ">
            <div>
              <CareIcon icon="l-file" className="text-5xl text-gray-600" />
            </div>
            <div className="min-w-[40%] break-all">
              <div className="">
                {file.name}
                {file.extension} {file.is_archived && "(Archived)"}
              </div>
              <div className="text-xs text-gray-700">
                {dayjs(file.created_date).format("DD MMM YYYY, hh:mm A")}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {!file.is_archived && (
              <ButtonV2
                onClick={() => previewFile(file, consentRecord.id)}
                className=""
              >
                <CareIcon icon="l-eye" />
                View
              </ButtonV2>
            )}
            {(file.is_archived ||
              file?.uploaded_by?.username === authUser.username ||
              authUser.user_type === "DistrictAdmin" ||
              authUser.user_type === "StateAdmin") && (
              <ButtonV2
                variant={file.is_archived ? "primary" : "secondary"}
                onClick={() => archiveFile(file, consentRecord.id)}
                className=""
              >
                <CareIcon
                  icon={file.is_archived ? "l-info-circle" : "l-archive"}
                />
                {file.is_archived ? "More Info" : "Archive"}
              </ButtonV2>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
