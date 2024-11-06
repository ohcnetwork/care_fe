import { useState } from "react";
import {
  CONSENT_PATIENT_CODE_STATUS_CHOICES,
  CONSENT_TYPE_CHOICES,
} from "@/common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Page from "@/components/Common/components/Page";
import request from "../../Utils/request/request";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { formatDateTime } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import useFileUpload from "../../Utils/useFileUpload";
import PatientConsentRecordBlockGroup from "./PatientConsentRecordBlock";
import useFileManager from "../../Utils/useFileManager";
import { PatientConsentModel } from "../Facility/models";
import Tabs from "@/components/Common/components/Tabs";
import { t } from "i18next";

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

  const fileUpload = useFileUpload({
    type: "CONSENT_RECORD",
    allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
    allowNameFallback: false,
  });

  const fileManager = useFileManager({
    type: "CONSENT_RECORD",
    onArchive: async () => {
      refetch();
    },
    onEdit: async () => {
      refetch();
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
      <Tabs
        tabs={[
          { text: t("active"), value: 0 },
          { text: t("archived"), value: 1 },
        ]}
        className="my-4"
        onTabChange={(v) => setShowArchived(!!v)}
        currentTab={showArchived ? 1 : 0}
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
            value={fileUpload.fileNames[0] || ""}
            onChange={(e) => fileUpload.setFileName(e.value)}
          />
          <div className="flex gap-2">
            {fileUpload.files[0] ? (
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
                  loading={fileUpload.uploading}
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
                  onClick={fileUpload.clearFiles}
                  disabled={fileUpload.uploading}
                >
                  <CareIcon icon="l-trash" className="text-lg" />
                  <span>{t("delete")}</span>
                </ButtonV2>
              </>
            ) : (
              <>
                <label
                  className={
                    "button-size-default button-shape-square button-primary-default inline-flex h-min w-full cursor-pointer items-center justify-center gap-2 whitespace-pre font-medium outline-offset-1 transition-all duration-200 ease-in-out"
                  }
                >
                  <CareIcon icon={"l-file-upload-alt"} className="text-lg" />
                  {t("choose_file")}
                  <fileUpload.Input />
                </label>
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
              r.files?.filter(
                (f) =>
                  f.associating_id === r.id && f.is_archived === showArchived,
              ).length,
          ).length === 0 ? (
            <div className="flex h-32 items-center justify-center text-secondary-500">
              No consent records found
            </div>
          ) : (
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
                fileManager={fileManager}
                files={record.files?.filter(
                  (f) =>
                    f.associating_id === record.id &&
                    showArchived === f.is_archived,
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
