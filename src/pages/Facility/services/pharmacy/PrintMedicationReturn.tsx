import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import PrintTable from "@/components/Common/PrintTable";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { PatientRead } from "@/types/emr/patient/patient";
import { DeliveryOrderRetrieve } from "@/types/inventory/deliveryOrder/deliveryOrder";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
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

interface MedicationReturnContentProps {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
}

const MedicationReturnContent = ({
  deliveryOrder,
  supplyDeliveries,
}: MedicationReturnContentProps) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Return Order Header */}
      <div className="mb-4">
        {deliveryOrder.note && (
          <p className="text-sm text-gray-600">
            <span>{t("note")}</span>
            {": "}
            {deliveryOrder.note}
          </p>
        )}
      </div>

      {/* Items Table */}
      {supplyDeliveries && supplyDeliveries.length > 0 && (
        <div className="mt-4">
          <p className="text-base font-semibold mb-2">{t("items_returned")}</p>
          <PrintTable
            headers={[
              { key: "item" },
              { key: "batch" },
              { key: "quantity" },
              { key: "expiry_date" },
              { key: "condition" },
              { key: "return_date" },
            ]}
            rows={supplyDeliveries.map((delivery) => {
              const product = delivery.supplied_item;
              const inventory = delivery.supplied_inventory_item;

              return {
                item: product?.product_knowledge?.name || "-",
                batch: inventory?.product?.batch?.lot_number || "-",
                quantity: round(delivery.supplied_item_quantity) || "-",
                expiry_date: inventory?.product?.expiration_date
                  ? format(
                      new Date(inventory.product.expiration_date),
                      "dd/MM/yyyy",
                    )
                  : "-",
                condition: delivery.supplied_item_condition
                  ? t(delivery.supplied_item_condition)
                  : t("normal"),
                return_date: delivery.created_date
                  ? format(new Date(delivery.created_date), "dd/MM/yyyy")
                  : "-",
              };
            })}
          />
        </div>
      )}
    </div>
  );
};

interface MedicationReturnPreviewProps {
  deliveryOrder: DeliveryOrderRetrieve;
  supplyDeliveries: SupplyDeliveryRead[];
  patient: PatientRead;
}

const MedicationReturnPreview = ({
  deliveryOrder,
  supplyDeliveries,
  patient,
}: MedicationReturnPreviewProps) => {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  return (
    <PrintPreview
      title={`${t("medication_return")} - ${patient.name}`}
      disabled={!supplyDeliveries?.length}
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
          {t("medication_return")}
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
              label={t("return_to")}
              value={deliveryOrder.destination.name}
              isStrong
            />
            <DetailRow
              label={t("status")}
              value={t(deliveryOrder.status)}
              isStrong
            />
          </div>
        </div>

        <MedicationReturnContent
          deliveryOrder={deliveryOrder}
          supplyDeliveries={supplyDeliveries}
        />

        {/* Footer */}
        <PrintFooter leftContent={t("computer_generated_document")} />
      </div>
    </PrintPreview>
  );
};

interface PrintMedicationReturnProps {
  facilityId: string;
  deliveryOrderId: string;
}

export const PrintMedicationReturn = ({
  facilityId,
  deliveryOrderId,
}: PrintMedicationReturnProps) => {
  const { t } = useTranslation();

  const { data: deliveryOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["medicationReturns", deliveryOrderId],
    queryFn: query(deliveryOrderApi.retrieveDeliveryOrder, {
      pathParams: { facilityId, deliveryOrderId },
    }),
    enabled: !!deliveryOrderId,
  });

  const { data: supplyDeliveries, isLoading: isLoadingDeliveries } = useQuery<
    PaginatedResponse<SupplyDeliveryRead>
  >({
    queryKey: ["supplyDeliveries", deliveryOrderId, "print"],
    queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        order: deliveryOrderId,
        status: SupplyDeliveryStatus.completed,
      },
    }),
    enabled: !!deliveryOrderId,
  });

  if (isLoadingOrder || isLoadingDeliveries) {
    return <Loading />;
  }

  if (!deliveryOrder) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("medication_return_not_found")}
      </div>
    );
  }

  if (!deliveryOrder.patient) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("patient_not_found")}
      </div>
    );
  }

  if (!supplyDeliveries?.results?.length) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed p-4 text-gray-500 border-gray-200">
        {t("no_items_to_print")}
      </div>
    );
  }

  return (
    <MedicationReturnPreview
      deliveryOrder={deliveryOrder}
      supplyDeliveries={supplyDeliveries.results}
      patient={deliveryOrder.patient as PatientRead}
    />
  );
};
