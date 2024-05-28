import { useEffect, useState } from "react";
import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Page from "../Common/components/Page";
import { ConsentRecord } from "../Facility/models";
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

export default function PatientConsentRecords(props: {
  facilityId: string;
  patientId: string;
  consultationId: string;
}) {
  const { facilityId, patientId, consultationId } = props;
  const [showArchived, setShowArchived] = useState(false);
  const [filesFound, setFilesFound] = useState(false);
  const [showPCSChangeModal, setShowPCSChangeModal] = useState<number | null>(
    null,
  );
  const [newConsent, setNewConsent] = useState({
    type: 0,
    patient_code_status: 4,
  });

  const fileUpload = useFileUpload({
    type: "CONSENT_RECORD",
  });

  const fileManager = useFileManager({
    type: "CONSENT_RECORD",
    onArchive: async () => {
      refetch();
    },
  });

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: {
      id: patientId,
    },
  });
  const {
    data: consultation,
    refetch,
    loading,
  } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId! },
    onResponse: (data) => {
      if (data.data && data.data.consent_records) {
        setConsentRecords(data.data.consent_records);
      }
    },
  });

  const [showDeleteConsent, setShowDeleteConsent] = useState<string | null>(
    null,
  );

  const [consentRecords, setConsentRecords] = useState<ConsentRecord[] | null>(
    null,
  );

  const handleDeleteConsent = async () => {
    const consent_id = showDeleteConsent;
    if (!consent_id || !consultationId || !consentRecords) return;
    const newRecords = consentRecords.map((cr) =>
      cr.id === consent_id ? { ...cr, deleted: true } : cr,
    );
    setConsentRecords(newRecords);
    setShowDeleteConsent(null);
  };

  const selectField = (name: string) => {
    return {
      name,
      optionValue: (option: any) => option.id,
      optionLabel: (option: any) => option.text,
      optionDescription: (option: any) => option.desc,
    };
  };

  const handleUpload = async (diffPCS?: ConsentRecord) => {
    if (newConsent.type === 0) return;
    const consentTypeExists = consentRecords?.find(
      (record) => record.type === newConsent.type && record.deleted !== true,
    );
    if (consentTypeExists && !diffPCS) {
      await fileUpload.handleFileUpload(consentTypeExists.id);
    } else {
      const randomId = "consent-" + new Date().getTime().toString();
      const newRecords = [
        ...(consentRecords?.map((r) =>
          r.id === diffPCS?.id ? { ...r, deleted: true } : r,
        ) || []),
        {
          id: randomId,
          type: newConsent.type,
          patient_code_status:
            newConsent.type === 2 ? newConsent.patient_code_status : undefined,
        },
      ];
      await request(routes.partialUpdateConsultation, {
        pathParams: { id: consultationId },
        body: { consent_records: newRecords },
      });
      await fileUpload.handleFileUpload(randomId);
      setConsentRecords(newRecords);
    }

    refetch();
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (consentRecords) {
        await request(routes.partialUpdateConsultation, {
          pathParams: { id: consultationId },
          body: { consent_records: consentRecords },
        });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [consentRecords]);

  const tabConsents = consentRecords?.filter((c) => showArchived || !c.deleted);

  useEffect(() => {
    setFilesFound(false);
  }, [showArchived]);

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
        show={showDeleteConsent !== null}
        onClose={() => setShowDeleteConsent(null)}
        onConfirm={handleDeleteConsent}
        action="Archive"
        variant="danger"
        description={
          "Are you sure you want to archive this consent record? You can find it in the archive section."
        }
        title="Archive Consent"
        className="w-auto"
      />
      <ConfirmDialog
        show={showPCSChangeModal !== null}
        onClose={() => setShowPCSChangeModal(null)}
        onConfirm={() => {
          if (showPCSChangeModal !== null) {
            handleUpload(
              consentRecords?.find(
                (record) =>
                  record.type === 2 &&
                  !record.deleted &&
                  record.patient_code_status !== showPCSChangeModal,
              ),
            );
          }
          setShowPCSChangeModal(null);
        }}
        action="Change Patient Code Status"
        variant="danger"
        description={`Consent records exist with the "${CONSENT_PATIENT_CODE_STATUS_CHOICES.find((c) => consentRecords?.find((c) => c.type === 2 && !c.deleted)?.patient_code_status === c.id)?.text}" patient code status. Adding a new record for a different type will archive the existing records. Are you sure you want to proceed?`}
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
                        record.deleted !== true,
                    );
                    if (diffPCS) {
                      setShowPCSChangeModal(newConsent.patient_code_status);
                    } else {
                      handleUpload();
                    }
                  }}
                  loading={!!fileUpload.progress}
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
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="skeleton-animate-alpha h-32 rounded-lg" />
            ) : tabConsents?.length === 0 || !filesFound ? (
              <div className="flex h-32 items-center justify-center text-gray-500">
                No records found
              </div>
            ) : null}
            {!loading &&
              tabConsents?.map((record, index) => (
                <PatientConsentRecordBlockGroup
                  key={index}
                  consentRecord={record}
                  previewFile={fileManager.viewFile}
                  archiveFile={fileManager.archiveFile}
                  onDelete={(record) => setShowDeleteConsent(record.id)}
                  refreshTrigger={consultation}
                  showArchive={showArchived}
                  onFilesFound={() => setFilesFound(true)}
                />
              ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
