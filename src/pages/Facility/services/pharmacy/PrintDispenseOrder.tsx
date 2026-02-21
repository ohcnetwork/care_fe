import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import PrintTable from "@/components/Common/PrintTable";
import { formatDosage, formatFrequency } from "@/components/Medicine/utils";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { DispenseOrderRead } from "@/types/emr/dispenseOrder/dispenseOrder";
import dispenseOrderApi from "@/types/emr/dispenseOrder/dispenseOrderApi";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { PatientRead } from "@/types/emr/patient/patient";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

import { round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatPatientAge } from "@/Utils/utils";

interface DetailRowProps {
  label: string;
  value?: string | null;
  isStrong?: boolean;
}

const DetailRow = ({ label, value, isStrong = false }: DetailRowProps) => {
  return (
    <div className="flex">
      <span className="text-gray-600 w-32">{label}</span>
      <span className="text-gray-600">: </span>
      <span className={`ml-1 ${isStrong ? "font-semibold" : ""}`}>
        {value || "-"}
      </span>
    </div>
  );
};

interface DispenseOrderContentProps {
  dispenseOrder: DispenseOrderRead;
  dispenses: MedicationDispenseRead[];
}

const DispenseOrderContent = ({
  dispenseOrder,
  dispenses,
}: DispenseOrderContentProps) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Dispense Order Header */}
      <div className="mb-4">
        <div className="text-2xl font-semibold mb-2 flex items-end gap-4">
          <p>{dispenseOrder.name}</p>
        </div>
        {dispenseOrder.note && (
          <p className="text-sm text-gray-600">{dispenseOrder.note}</p>
        )}
      </div>

      {/* Dispenses Table */}
      {dispenses && dispenses.length > 0 && (
        <div className="mt-4">
          <p className="text-base font-semibold mb-2">
            {t("medication_dispenses")}
          </p>
          <PrintTable
            headers={[
              { key: "medicine" },
              { key: "dosage" },
              { key: "frequency" },
              { key: "quantity" },
              { key: "lot_batch_number" },
              { key: "expiry_date" },
              { key: "prepared_date" },
            ]}
            rows={dispenses.map((dispense) => {
              const instruction = dispense.dosage_instruction?.[0];

              return {
                medicine: dispense.item.product.product_knowledge.name,
                dosage: formatDosage(instruction) || "-",
                frequency: formatFrequency(instruction) || "-",
                quantity: round(dispense.quantity) || "-",
                lot_batch_number:
                  dispense.item.product.batch?.lot_number || "-",
                expiry_date: dispense.item.product?.expiration_date
                  ? format(
                      new Date(dispense.item.product.expiration_date),
                      "dd/MM/yyyy",
                    )
                  : "-",
                prepared_date: new Date(
                  dispense.when_prepared,
                ).toLocaleDateString(),
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

interface DispenseOrderPreviewProps {
  dispenseOrder: DispenseOrderRead;
  dispenses: MedicationDispenseRead[];
  patient: PatientRead;
}

const DispenseOrderPreview = ({
  dispenseOrder,
  dispenses,
  patient,
}: DispenseOrderPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  return (
    <PrintPreview
      title={`${t("dispense_order")} - ${patient.name}`}
      disabled={!dispenses?.length}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
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
          <img
            src={careConfig.mainLogo?.dark}
            alt="Logo"
            className="h-10 w-auto object-contain mb-2 sm:mb-0 text-end"
          />
        </div>

        <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold my-2">
          {t("dispense_order")}
        </h2>

        {/* Patient Details */}
        <div className="grid md:grid-cols-2 print:grid-cols-2 gap-6 border-t border-gray-200 pt-2">
          <div className="space-y-2">
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
            {patient?.instance_identifiers
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
          <div className="space-y-2">
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
            <DetailRow
              label={t("location")}
              value={dispenseOrder.location.name}
              isStrong
            />
          </div>
        </div>

        <DispenseOrderContent
          dispenseOrder={dispenseOrder}
          dispenses={dispenses}
        />

        {/* Footer */}
        <PrintFooter leftContent={t("computer_generated_document")} />
      </div>
    </PrintPreview>
  );
};

interface PrintDispenseOrderProps {
  facilityId: string;
  dispenseOrderId: string;
  locationId: string;
}

export const PrintDispenseOrder = ({
  facilityId,
  dispenseOrderId,
  locationId,
}: PrintDispenseOrderProps) => {
  const { t } = useTranslation();

  const { data: dispenseOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["dispenseOrder", facilityId, dispenseOrderId],
    queryFn: query(dispenseOrderApi.get, {
      pathParams: { facilityId, id: dispenseOrderId },
    }),
    enabled: !!dispenseOrderId,
  });

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

  if (isLoadingOrder || isLoadingDispenses) {
    return <Loading />;
  }

  if (!dispenseOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("dispense_order_not_found")}
      </div>
    );
  }

  if (!medicationDispenses?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_medication_dispenses_found")}
      </div>
    );
  }

  return (
    <DispenseOrderPreview
      dispenseOrder={dispenseOrder}
      dispenses={medicationDispenses.results}
      patient={dispenseOrder.patient}
    />
  );
};
