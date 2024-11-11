import { useEffect, useState } from "react";

import ButtonV2 from "@/components/Common/ButtonV2";
import { PatientConsentModel } from "@/components/Facility/models";
import FileBlock from "@/components/Files/FileBlock";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FileUploadModel } from "@/components/Patient/models";

import useAuthUser from "@/hooks/useAuthUser";
import { FileManagerResult } from "@/hooks/useFileManager";

import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

export default function PatientConsentRecordBlockGroup(props: {
  consentRecord: PatientConsentModel;
  consultationId: string;
  fileManager: FileManagerResult;
  files?: FileUploadModel[];
}) {
  const { consentRecord, fileManager, files, consultationId } = props;

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
            onChange={(e) => setPatientCodeStatus(e.value)}
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
        <FileBlock
          fileManager={fileManager}
          key={i}
          file={file}
          editable={hasEditPermission(file)}
          associating_id={consentRecord.id}
          archivable
        />
      ))}
    </div>
  );
}
