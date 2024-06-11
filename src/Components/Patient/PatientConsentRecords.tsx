import { useEffect, useState } from "react";
import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Page from "../Common/components/Page";
import request from "../../Utils/request/request";
import ConfirmDialog from "../Common/ConfirmDialog";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDateTime } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import useFileUpload from "../../Utils/useFileUpload";
import PatientConsentRecordBlockGroup from "./PatientConsentRecordBlock";
import SwitchTabs from "../Common/components/SwitchTabs";
import useFileManager from "../../Utils/useFileManager";
import { PatientConsentModel } from "../Facility/models";

export default function PatientConsentRecords(props: {
  facilityId: string;
  patientId: string;
  consultationId: string;
}) {
  const { facilityId, patientId, consultationId } = props;
  const [showArchived, setShowArchived] = useState(false);
  const [showPCSChangeModal, setShowPCSChangeModal] = useState<number | null>(
    null,
  );
  const [newConsent, setNewConsent] = useState({
    type: 0,
    patient_code_status: 4,
  });

  const refetchAll = () => {
    refetch();
    refetchFiles();
    refetchArchivedFiles();
  };

  const fileUpload = useFileUpload({
    type: "CONSENT_RECORD",
    allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
  });

  const fileManager = useFileManager({
    type: "CONSENT_RECORD",
    onArchive: async () => {
      refetchAll();
    },
    onEdit: async () => {
      refetchAll();
    },
  });

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: {
      id: patientId,
    },
  });

  const { data: consentRecordsData, refetch } = useQuery(routes.listConsents, {
    pathParams: {
      consultationId,
    },
    query: {
      limit: 1000,
      offset: 0,
    },
  });

  const consentRecords = consentRecordsData?.results;

  const { data: unarchivedFiles, refetch: refetchFiles } = useQuery(
    routes.viewUpload,
    {
      query: {
        file_type: "CONSENT_RECORD",
        associating_id: consentRecords?.map((cr) => cr.id).join(","),
        limit: 1000,
        offset: 0,
        is_archived: false,
      },
      prefetch: (consentRecords?.length || 0) > 0 && showArchived,
    },
  );

  const { data: archivedFiles, refetch: refetchArchivedFiles } = useQuery(
    routes.viewUpload,
    {
      query: {
        file_type: "CONSENT_RECORD",
        associating_id: consentRecords?.map((cr) => cr.id).join(","),
        limit: 1000,
        offset: 0,
        is_archived: true,
      },
      prefetch: (consentRecords?.length || 0) > 0 && !showArchived,
    },
  );

  const files = showArchived ? archivedFiles : unarchivedFiles;

  const selectField = (name: string) => {
    return {
      name,
      optionValue: (option: any) => option.id,
      optionLabel: (option: any) => option.text,
      optionDescription: (option: any) => option.desc,
    };
  };

  const handleUpload = async (diffPCS?: PatientConsentModel) => {
    const consentExists = consentRecords?.find(
      (record) => record.type === newConsent.type && !record.archived,
    );
    let consentId = consentExists?.id;
    if (!consentExists || diffPCS) {
      consentId = undefined;
      const res = await request(routes.createConsent, {
        pathParams: { consultationId: consultationId },
        body: {
          ...newConsent,
          patient_code_status:
            newConsent.type === 2 ? newConsent.patient_code_status : undefined,
        },
      });
      if (res.data) {
        consentId = res.data.id;
      }
    }
    consentId && (await fileUpload.handleFileUpload(consentId));
    refetch();
  };

  useEffect(() => {
    if (consentRecords && consentRecords.length > 0) {
      refetchFiles();
      refetchArchivedFiles();
    }
  }, [consentRecords]);

  return (
    <Page
      title={"Patient Consent Records"}
      crumbsReplacements={{
        [facilityId]: { name: patient?.facility_object?.name },
        [patientId]: { name: patient?.name },
        [consultationId]: {
          name:
            patient?.last_consultation?.suggestion === "A"
              ? `Admitted on ${formatDateTime(
                  patient?.last_consultation?.encounter_date,
                )}`
              : patient?.last_consultation?.suggestion_text,
        },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/`}
    >
      {fileUpload.Dialogues}
      {fileManager.Dialogues}
      <ConfirmDialog
        show={showPCSChangeModal !== null}
        onClose={() => setShowPCSChangeModal(null)}
        onConfirm={() => {
          if (showPCSChangeModal !== null) {
            handleUpload(
              consentRecords?.find(
                (record) =>
                  record.type === 2 &&
                  !record.archived &&
                  record.patient_code_status !== showPCSChangeModal,
              ),
            );
          }
          setShowPCSChangeModal(null);
        }}
        action="Change Patient Code Status"
        variant="danger"
        description={`Consent records exist with the "${CONSENT_PATIENT_CODE_STATUS_CHOICES.find((c) => consentRecords?.find((c) => c.type === 2 && !c.archived)?.patient_code_status === c.id)?.text}" patient code status. Adding a new record for a different type will archive the existing records. Are you sure you want to proceed?`}
        title="Archive Previous Records"
        className="w-auto"
      />
      <SwitchTabs
        tab1="Active"
        tab2="Archived"
        className="my-4"
        onClickTab1={() => setShowArchived(false)}
        onClickTab2={() => setShowArchived(true)}
        isTab2Active={showArchived}
      />
      <div className="mt-8 flex flex-col gap-4 lg:flex-row-reverse">
        <div className="shrink-0 lg:w-[350px]">
          <h4 className="font-black">Add New Record</h4>
          <SelectFormField
            {...selectField("consent_type")}
            onChange={async (e) => {
              setNewConsent({ ...newConsent, type: e.value });
            }}
            value={newConsent.type}
            label="Consent Type"
            options={CONSENT_TYPE_CHOICES}
            required
          />
          {newConsent.type === 2 && (
            <SelectFormField
              {...selectField("consent_type")}
              onChange={(e) => {
                setNewConsent({
                  ...newConsent,
                  patient_code_status: e.value,
                });
              }}
              label="Patient Code Status"
              value={newConsent.patient_code_status}
              options={CONSENT_PATIENT_CODE_STATUS_CHOICES}
              required
            />
          )}
          <TextFormField
            name="filename"
            label="File Name"
            value={fileUpload.fileName}
            onChange={(e) => fileUpload.setFileName(e.value)}
          />
          <div className="flex gap-2">
            {fileUpload.file ? (
              <>
                <ButtonV2
                  onClick={() => {
                    const diffPCS = consentRecords?.find(
                      (record) =>
                        record.type === 2 &&
                        newConsent.type === 2 &&
                        record.patient_code_status !==
                          newConsent.patient_code_status &&
                        record.archived !== true,
                    );
                    if (diffPCS) {
                      setShowPCSChangeModal(newConsent.patient_code_status);
                    } else {
                      handleUpload();
                    }
                  }}
                  loading={!!fileUpload.progress}
                  disabled={
                    newConsent.type === 2 &&
                    newConsent.patient_code_status === 0
                  }
                  className="flex-1"
                >
                  <CareIcon icon="l-check" className="mr-2" />
                  Upload
                </ButtonV2>
                <ButtonV2
                  variant="danger"
                  onClick={fileUpload.clearFile}
                  disabled={!!fileUpload.progress}
                >
                  <CareIcon icon="l-trash-alt" className="" />
                </ButtonV2>
              </>
            ) : (
              <>
                <fileUpload.UploadButton />
                <button
                  type="button"
                  className="flex aspect-square h-9 shrink-0 items-center justify-center rounded text-xl transition-all hover:bg-black/10"
                  onClick={fileUpload.handleCameraCapture}
                >
                  <CareIcon icon={"l-camera"} />
                </button>
              </>
            )}
          </div>
          <div className="mt-2 text-sm text-red-500">{fileUpload.error}</div>
        </div>
        <div className="flex-1">
          {consentRecords?.filter(
            (r) =>
              files?.results.filter((f) => f.associating_id === r.id).length,
          ).length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-500">
              No consent records found
            </div>
          ) : (
            (!unarchivedFiles || !archivedFiles) &&
            !consentRecords && (
              <div className="skeleton-animate-alpha h-32 rounded-lg" />
            )
          )}
          <div className="flex flex-col gap-4">
            {consentRecords?.map((record, index) => (
              <PatientConsentRecordBlockGroup
                key={index}
                consultationId={consultationId}
                consentRecord={record}
                previewFile={fileManager.viewFile}
                archiveFile={fileManager.archiveFile}
                editFile={fileManager.editFile}
                showArchive={showArchived}
                files={files?.results.filter(
                  (f) => f.associating_id === record.id,
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
