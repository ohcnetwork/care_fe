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
import { ExtImage, StateInterface } from "./FileUpload";
import { formatDateTime } from "../../Utils/utils";
import TextFormField from "../Form/FormFields/TextFormField";
import ButtonV2 from "../Common/components/ButtonV2";
import useFileUpload from "../../Utils/useFileUpload";
import PatientConsentRecordBlockGroup from "./PatientConsentRecordBlock";
import FilePreviewDialog from "../Common/FilePreviewDialog";
import SwitchTabs from "../Common/components/SwitchTabs";

export default function PatientConsentRecords(props: {
  facilityId: string;
  patientId: string;
  consultationId: string;
}) {
  const { facilityId, patientId, consultationId } = props;
  const [downloadURL, setDownloadURL] = useState<string>();
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
  });
  const [file_state, setFileState] = useState<StateInterface>({
    open: false,
    isImage: false,
    name: "",
    extension: "",
    zoom: 4,
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
    rotation: 0,
  });
  const [fileUrl, setFileUrl] = useState("");

  const { data: patient } = useQuery(routes.getPatient, {
    pathParams: {
      id: patientId,
    },
  });
  const { data: consultation, refetch } = useQuery(routes.getConsultation, {
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

  const handleConsentPCSChange = (type: number) => {
    if (!consentRecords) return;
    const randomId = "consent-" + new Date().getTime().toString();
    setConsentRecords([
      ...consentRecords.map((cr) =>
        cr.type === 2 && !cr.deleted ? { ...cr, deleted: true } : cr,
      ),
      { type: 2, patient_code_status: type, id: randomId },
    ]);
  };

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

  const getExtension = (url: string) => {
    const div1 = url.split("?")[0].split(".");
    const ext: string = div1[div1.length - 1].toLowerCase();
    return ext;
  };

  const downloadFileUrl = (url: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setDownloadURL(URL.createObjectURL(blob));
      });
  };

  const previewFile = async (id: string, consent_id: string) => {
    setFileUrl("");
    setFileState({ ...file_state, open: true });
    const { data } = await request(routes.retrieveUpload, {
      query: {
        file_type: "CONSENT_RECORD",
        associating_id: consent_id,
      },
      pathParams: { id },
    });

    if (!data) return;

    const signedUrl = data.read_signed_url as string;
    const extension = getExtension(signedUrl);

    setFileState({
      ...file_state,
      open: true,
      name: data.name as string,
      extension,
      isImage: ExtImage.includes(extension),
    });
    downloadFileUrl(signedUrl);
    setFileUrl(signedUrl);
  };

  const handleFilePreviewClose = () => {
    setDownloadURL("");
    setFileState({
      ...file_state,
      open: false,
      zoom: 4,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    });
  };

  const handleUpload = async () => {
    if (newConsent.type === 0) return;
    const consentTypeExists = consentRecords?.find(
      (record) => record.type === newConsent.type && record.deleted !== true,
    );
    if (consentTypeExists) {
      await fileUpload.handleFileUpload(consentTypeExists.id);
    } else {
      const randomId = "consent-" + new Date().getTime().toString();
      const newRecords = [
        ...consentRecords!,
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
      setConsentRecords(newRecords);
      await fileUpload.handleFileUpload(randomId);
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

  const tabConsents = consentRecords?.filter((record) =>
    showArchived ? record.deleted === true : !record.deleted,
  );

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
      <FilePreviewDialog
        show={file_state.open}
        fileUrl={fileUrl}
        file_state={file_state}
        setFileState={setFileState}
        downloadURL={downloadURL}
        onClose={handleFilePreviewClose}
        fixedWidth={false}
        className="h-[80vh] w-full md:h-screen"
      />
      <fileUpload.Dialogues />
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
            setNewConsent({
              ...newConsent,
              patient_code_status: showPCSChangeModal,
            });
            handleConsentPCSChange(showPCSChangeModal);
          }
          setShowPCSChangeModal(null);
        }}
        action="Change Patient Code Status"
        variant="danger"
        description={`Consent records exist with the "${CONSENT_PATIENT_CODE_STATUS_CHOICES.find((c) => consentRecords?.find((c) => c.type === 2 && !c.deleted)?.patient_code_status === c.id)?.text}" patient code status. Changing this will archive the existing records. Are you sure you want to proceed?`}
        title="Archive Previous Records"
        className="w-auto"
      />
      <div className="mt-8 flex flex-col gap-4 md:flex-row-reverse">
        <div className="shrink-0 md:w-[350px]">
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
                if (
                  consentRecords?.find(
                    (record) =>
                      record.type === newConsent.type &&
                      record.patient_code_status !== e.value &&
                      record.deleted !== true,
                  )
                ) {
                  setShowPCSChangeModal(e.value);
                } else {
                  setNewConsent({
                    ...newConsent,
                    patient_code_status: e.value,
                  });
                }
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
                  onClick={handleUpload}
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
          <SwitchTabs
            tab1="Files"
            tab2="Archived"
            className="mb-4"
            onClickTab1={() => setShowArchived(false)}
            onClickTab2={() => setShowArchived(true)}
            isTab2Active={showArchived}
          />
          {tabConsents?.length === 0 && (
            <div className="flex h-32 items-center justify-center text-gray-500">
              No records found
            </div>
          )}
          <div className="flex flex-col gap-4">
            {tabConsents?.map((record, index) => (
              <PatientConsentRecordBlockGroup
                key={index}
                consentRecord={record}
                previewFile={previewFile}
                onDelete={(record) => setShowDeleteConsent(record.id)}
                refreshTrigger={consultation}
              />
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
