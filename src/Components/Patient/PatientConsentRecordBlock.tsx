import dayjs from "dayjs";
import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "../../Common/constants";
import { FileUploadModel } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "../Common/components/ButtonV2";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { PatientConsentModel } from "../Facility/models";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { useEffect, useState } from "react";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";

export default function PatientConsentRecordBlockGroup(props: {
  consentRecord: PatientConsentModel;
  consultationId: string;
  previewFile: (file: FileUploadModel, file_associating_id: string) => void;
  archiveFile: (
    file: FileUploadModel,
    file_associating_id: string,
    skipPrompt?: { reason: string },
  ) => void;
  editFile: (file: FileUploadModel) => void;
  showArchive: boolean;
  files?: FileUploadModel[];
}) {
  const {
    consentRecord,
    previewFile,
    archiveFile,
    editFile,
    files,
    showArchive,
    consultationId,
  } = props;

  const authUser = useAuthUser();

  const consent = CONSENT_TYPE_CHOICES.find((c) => c.id === consentRecord.type);
  const consentPCS = CONSENT_PATIENT_CODE_STATUS_CHOICES.find(
    (c) => c.id === consentRecord.patient_code_status,
  );
  const [patientCodeStatus, setPatientCodeStatus] = useState(1);

  const handlePCSUpdate = async (status: number) => {
    const res = await request(routes.partialUpdateConsent, {
      pathParams: {
        id: consentRecord.id,
        consultationId: consultationId,
      },
      body: {
        patient_code_status: status,
      },
    });
    if (res.data) window.location.reload();
  };

  useEffect(() => {
    if (consentRecord.patient_code_status !== null)
      setPatientCodeStatus(consentRecord.patient_code_status);
  }, [consentRecord]);

  // see if the user has permission to edit the file.
  // only the user who uploaded the file, district admin and state admin can edit the file
  const hasEditPermission = (file: FileUploadModel) =>
    file?.uploaded_by?.username === authUser.username ||
    authUser.user_type === "DistrictAdmin" ||
    authUser.user_type === "StateAdmin";

  return (
    <div
      className={`flex flex-col gap-2 ${(files?.length || 0) < 1 && "hidden"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4>
            {consent?.text} {consentPCS?.text && `(${consentPCS.text})`}
          </h4>
        </div>
      </div>
      {consentRecord.type === 2 && consentRecord.patient_code_status === 0 && (
        <div className="flex gap-2">
          <SelectFormField
            name="patient_code_status"
            className="flex-1"
            onChange={(e) => {
              console.log(e.value);
              setPatientCodeStatus(e.value);
            }}
            value={
              CONSENT_PATIENT_CODE_STATUS_CHOICES.find(
                (c) => c.id === patientCodeStatus,
              )?.id
            }
            optionValue={(option: any) => option.id}
            optionLabel={(option: any) => option.text}
            options={CONSENT_PATIENT_CODE_STATUS_CHOICES}
            required
            error="Please select a patient code status type"
          />
          <ButtonV2
            onClick={() => {
              handlePCSUpdate(patientCodeStatus);
            }}
            disabled={patientCodeStatus === consentRecord.patient_code_status}
            className="h-[46px]"
          >
            Update
          </ButtonV2>
        </div>
      )}
      {files?.map((file: FileUploadModel, i: number) => (
        <div
          key={i}
          className={`flex flex-col justify-between gap-2 rounded-lg border border-gray-300 xl:flex-row xl:items-center ${showArchive ? "text-gray-600" : "bg-white"}  px-4 py-2 transition-all hover:bg-gray-100`}
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
                {dayjs(
                  file.is_archived ? file.archived_datetime : file.created_date,
                ).format("DD MMM YYYY, hh:mm A")}{" "}
                by{" "}
                {file.is_archived
                  ? file.archived_by?.username
                  : file.uploaded_by?.username}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {!file.is_archived && (
              <ButtonV2
                onClick={() => previewFile(file, consentRecord.id)}
                className=""
              >
                <CareIcon icon="l-eye" />
                View
              </ButtonV2>
            )}
            {!file.is_archived && hasEditPermission(file) && (
              <ButtonV2
                variant={"secondary"}
                onClick={() => editFile(file)}
                className=""
              >
                <CareIcon icon={"l-pen"} />
                Rename
              </ButtonV2>
            )}
            {(file.is_archived || hasEditPermission(file)) && (
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
