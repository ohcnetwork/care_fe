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

export default function PatientConsentRecordBlockGroup(props: {
  consentRecord: ConsentRecord;
  previewFile: (file_id: string, file_associating_id: string) => void;
  onDelete: (consentRecord: ConsentRecord) => void;
  refreshTrigger: any;
}) {
  const { consentRecord, previewFile } = props;

  const filesQuery = useQuery(routes.viewUpload, {
    query: {
      file_type: "CONSENT_RECORD",
      associating_id: consentRecord.id,
      is_archived: false,
      limit: 30,
      offset: 0,
    },
  });

  const consent = CONSENT_TYPE_CHOICES.find((c) => c.id === consentRecord.type);
  const consentPCS = CONSENT_PATIENT_CODE_STATUS_CHOICES.find(
    (c) => c.id === consentRecord.patient_code_status,
  );

  useEffect(() => {
    filesQuery.refetch();
  }, [props.refreshTrigger]);

  return (
    <div
      className={`flex flex-col gap-2 ${(filesQuery.data?.results.length || 0) < 1 && "hidden"}`}
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
        {!consentRecord.deleted && (
          <button
            className="text-red-500 hover:text-red-600"
            onClick={() => props.onDelete(consentRecord)}
          >
            <CareIcon icon="l-archive" className="mr-1" />
            Archive
          </button>
        )}
      </div>

      {filesQuery?.data?.results.map((file: FileUploadModel, i: number) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded-lg border border-gray-300 ${consentRecord.deleted ? "text-gray-600" : "bg-white"}  px-4 py-2 transition-all hover:bg-gray-100`}
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
            <ButtonV2
              onClick={() => previewFile(file.id || "", consentRecord.id)}
              className=""
            >
              <CareIcon icon="l-eye" />
              View
            </ButtonV2>
          </div>
        </div>
      ))}
    </div>
  );
}
