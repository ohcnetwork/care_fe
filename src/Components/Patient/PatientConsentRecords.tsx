import { useState } from "react";
import { CONSENT_PATIENT_CODE_STATUS_CHOICES, CONSENT_TYPE_CHOICES } from "../../Common/constants";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import Page from "../Common/components/Page"
import { FieldChangeEventHandler } from "../Form/FormFields/Utils";
import { ConsentRecord } from "../Facility/models";
import request from "../../Utils/request/request";
import ConfirmDialog from "../Common/ConfirmDialog";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { FileUpload } from "./FileUpload";
import { formatDateTime } from "../../Utils/utils";

export default function PatientConsentRecords(props: {
    facilityId: string,
    patientId: string,
    consultationId: string,
}) {

    const { facilityId, patientId, consultationId } = props

    const { data: patient, loading: patientLoading, refetch: patientRefresh } = useQuery(routes.getPatient, {
        pathParams: {
            id: patientId,
        },
    });
    const { data: consultation, loading: consultationLoading, refetch } = useQuery(
        routes.getConsultation,
        {
            pathParams: { id: consultationId! },
            onResponse: (data) => {
                if (data.data && data.data.consent_records) {
                    setConsentRecords(data.data.consent_records);
                }
            }
        },
    );

    const [collapsedConsentRecords, setCollapsedConsentRecords] = useState<
        number[]
    >([]);
    const [showDeleteConsent, setShowDeleteConsent] = useState<string | null>(
        null,
    );

    const [consentRecords, setConsentRecords] = useState<ConsentRecord[] | null>(null);


    const handleConsentTypeChange: FieldChangeEventHandler<number> = async (
        event,
    ) => {
        if (!consultationId || !consentRecords) return;
        if (
            consentRecords
                .filter((cr) => cr.deleted !== true)
                .map((cr) => cr.type)
                .includes(event.value)
        ) {
            return;
        } else {
            const randomId = "consent-" + new Date().getTime().toString();
            const newRecords = [
                ...consentRecords,
                { id: randomId, type: event.value },
            ];
            await request(routes.partialUpdateConsultation, {
                pathParams: { id: consultationId },
                body: { consent_records: newRecords },
            });
            setConsentRecords(newRecords);
        }
    };

    const handleConsentPCSChange: FieldChangeEventHandler<number> = (event) => {
        if (!consentRecords) return;
        setConsentRecords(consentRecords.map((cr) =>
            cr.type === 2 ? { ...cr, patient_code_status: event.value } : cr,
        ));
    };

    const handleDeleteConsent = async () => {
        const consent_id = showDeleteConsent;
        if (!consent_id || !consultationId || !consentRecords) return;
        const newRecords = consentRecords.map((cr) =>
            cr.id === consent_id ? { ...cr, deleted: true } : cr,
        );
        await request(routes.partialUpdateConsultation, {
            pathParams: { id: consultationId },
            body: { consent_records: newRecords },
        });
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
                                patient?.last_consultation?.encounter_date!,
                            )}`
                            : patient?.last_consultation?.suggestion_text,
                },
            }}
            backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/`}
        >
            <ConfirmDialog
                show={showDeleteConsent !== null}
                onClose={() => setShowDeleteConsent(null)}
                onConfirm={handleDeleteConsent}
                action="Delete"
                variant="danger"
                description={
                    "Are you sure you want to delete this consent record?"
                }
                title="Delete Consent"
                className="w-auto"
            />
            <div className="flex flex-col md:flex-row-reverse gap-4 mt-8">
                <div className="md:w-[350px] shrink-0">
                    <h4 className="font-black">
                        Add New Record
                    </h4>
                    <SelectFormField
                        {...selectField("consent_type")}
                        onChange={handleConsentTypeChange}
                        label="Consent Type"
                        options={CONSENT_TYPE_CHOICES.filter(
                            (c) =>
                                !consentRecords
                                    ?.filter((r) => r.deleted !== true)
                                    .map((record) => record.type)
                                    .includes(c.id),
                        )}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {consentRecords
                    ?.filter((record) => record.deleted !== true)
                    .map((record, index) => (
                        <div
                            className="overflow-hidden rounded-xl border border-gray-300 bg-gray-100"
                            key={index}
                        >
                            <div className="flex items-center justify-between bg-gray-200 p-4">
                                <button
                                    type="button"
                                    className="font-bold"
                                    onClick={() =>
                                        setCollapsedConsentRecords((prev) =>
                                            prev.includes(record.type)
                                                ? prev.filter((r) => r !== record.type)
                                                : [...prev, record.type],
                                        )
                                    }
                                >
                                    <CareIcon
                                        icon={
                                            collapsedConsentRecords.includes(
                                                record.type,
                                            )
                                                ? "l-arrow-down"
                                                : "l-arrow-up"
                                        }
                                        className="mr-2"
                                    />
                                    {
                                        CONSENT_TYPE_CHOICES.find(
                                            (c) => c.id === record.type,
                                        )?.text
                                    }
                                </button>
                                <button
                                    className="text-red-400"
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteConsent(record.id);
                                    }}
                                >
                                    <CareIcon
                                        icon="l-trash-alt"
                                        className="h-4 w-4"
                                    />
                                </button>
                            </div>
                            <div
                                className={`${collapsedConsentRecords.includes(record.type)
                                    ? "hidden"
                                    : ""
                                    }`}
                            >
                                <div className="px-4 pt-4">
                                    {record.type === 2 && (
                                        <SelectFormField
                                            {...selectField("consent_type")}
                                            onChange={handleConsentPCSChange}
                                            label="Patient Code Status"
                                            value={record.patient_code_status}
                                            options={
                                                CONSENT_PATIENT_CODE_STATUS_CHOICES
                                            }
                                        />
                                    )}
                                </div>
                                <FileUpload
                                    changePageMetadata={false}
                                    type="CONSENT_RECORD"
                                    hideBack
                                    unspecified
                                    className="w-full"
                                    consentId={record.id}
                                />
                            </div>
                        </div>
                    ))}
            </div>

        </Page>
    )
}