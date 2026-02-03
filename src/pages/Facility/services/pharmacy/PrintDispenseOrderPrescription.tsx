import careConfig from "@careConfig";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import {
  DetailRow,
  PrescriptionContent,
} from "@/components/Prescription/PrescriptionPreview";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PatientRead } from "@/types/emr/patient/patient";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatPatientAge } from "@/Utils/utils";

interface PrescriptionsPreviewProps {
  prescriptions: PrescriptionRead[];
  patient: PatientRead;
  locationName?: string;
}

const PrescriptionsPreview = ({
  prescriptions,
  patient,
  locationName,
}: PrescriptionsPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  const hasMedications = prescriptions.some(
    (p) => p.medications && p.medications.length > 0,
  );

  return (
    <PrintPreview
      title={`${t("prescription")} - ${patient.name}`}
      autoPrint={{ enabled: hasMedications }}
      disabled={!hasMedications}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <div className="text-left">
              <h1 className="text-2xl font-medium">{facility?.name}</h1>
              {facility?.address && (
                <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                  {facility.address}
                  {facility.phone_number && (
                    <p className="text-gray-500 text-sm">
                      {t("phone")}: {facility.phone_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <QRCodeSVG value={patient.id} size={50} level="Q" marginSize={0} />
          <img
            src={careConfig.mainLogo?.dark}
            alt="Logo"
            className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
          />
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 pb-3">
          <div className="space-y-1">
            <DetailRow label={t("patient")} value={patient.name} isStrong />
            <DetailRow
              label={`${t("age")} / ${t("sex")}`}
              value={
                patient
                  ? `${formatPatientAge(patient, true)}, ${t(`GENDER__${patient.gender}`)}`
                  : undefined
              }
              isStrong
            />
            {patient.instance_identifiers
              ?.filter(
                ({ config }) =>
                  config.config.use === PatientIdentifierUse.official,
              )
              .map((identifier) => (
                <DetailRow
                  key={identifier.config.id}
                  label={identifier.config.config.display}
                  value={identifier.value}
                  isStrong
                />
              ))}
          </div>
          <div className="space-y-1">
            <DetailRow
              label={t("date")}
              value={format(new Date(), "dd MMM yyyy, EEEE")}
              isStrong
            />
            <DetailRow
              label={t("mobile_number")}
              value={patient && formatPhoneNumberIntl(patient.phone_number)}
              isStrong
            />
            {locationName && (
              <DetailRow label={t("location")} value={locationName} isStrong />
            )}
          </div>
        </div>

        {/* Prescription Groups */}
        {prescriptions.length > 1 && (
          <div className="mb-4 text-sm text-gray-500 border-b pb-2">
            {t("prescriptions_count", { count: prescriptions.length })}
          </div>
        )}

        {prescriptions.map((prescription, index) => (
          <div key={prescription.id}>
            {index > 0 && (
              <div className="border-t border-dashed border-gray-300 my-6" />
            )}
            <PrescriptionContent prescription={prescription} />
          </div>
        ))}

        {/* Footer */}
        <PrintFooter leftContent={t("computer_generated_prescription")} />
      </div>
    </PrintPreview>
  );
};

interface PrintDispenseOrderPrescriptionProps {
  facilityId: string;
  dispenseOrderId: string;
  locationId: string;
}

export const PrintDispenseOrderPrescription = ({
  facilityId,
  dispenseOrderId,
  locationId,
}: PrintDispenseOrderPrescriptionProps) => {
  const { t } = useTranslation();

  // Fetch dispense order
  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

  // Fetch medication dispenses to get prescription IDs
  const { data: medicationDispenses, isLoading: isLoadingDispenses } = useQuery<
    PaginatedResponse<MedicationDispenseRead>
  >({
    queryKey: ["medicationDispenses", dispenseOrderId, locationId],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        order: dispenseOrderId,
        location: locationId,
      },
    }),
    enabled: !!dispenseOrderId && !!locationId,
  });

  // Extract unique prescription IDs
  const prescriptionIds = useMemo(() => {
    const ids = new Set<string>();
    medicationDispenses?.results?.forEach((dispense) => {
      const prescriptionId = dispense.authorizing_request?.prescription?.id;
      if (prescriptionId) {
        ids.add(prescriptionId);
      }
    });
    return Array.from(ids);
  }, [medicationDispenses]);

  // Fetch full prescription data for each prescription
  const prescriptionQueries = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: [
        "prescription",
        dispenseOrder?.patient.id,
        prescriptionId,
        facilityId,
      ],
      queryFn: query(prescriptionApi.get, {
        pathParams: {
          patientId: dispenseOrder?.patient.id || "",
          id: prescriptionId,
        },
        queryParams: { facility: facilityId },
      }),
      enabled: !!dispenseOrder?.patient.id && !!prescriptionId,
    })),
  });

  const isLoadingPrescriptions = prescriptionQueries.some((q) => q.isLoading);

  // Combine prescription data
  const prescriptions = useMemo(() => {
    return prescriptionQueries
      .filter((q) => q.data)
      .map((q) => q.data as PrescriptionRead)
      .sort((a, b) => {
        // Sort by created date (newest first)
        const dateA = new Date(a.created_date).getTime();
        const dateB = new Date(b.created_date).getTime();
        return dateB - dateA;
      });
  }, [prescriptionQueries]);

  if (isLoadingOrder || isLoadingDispenses || isLoadingPrescriptions) {
    return <Loading />;
  }

  if (!dispenseOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("dispense_order_not_found")}
      </div>
    );
  }

  if (!prescriptions.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_prescriptions_found")}
      </div>
    );
  }

  return (
    <PrescriptionsPreview
      prescriptions={prescriptions}
      patient={dispenseOrder.patient}
      locationName={dispenseOrder.location.name}
    />
  );
};
