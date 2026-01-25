import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";

import {
  ChargeItemRead,
  ChargeItemServiceResource,
} from "@/types/billing/chargeItem/chargeItem";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import query from "@/Utils/request/query";

interface InvoiceChargeItemTitleProps {
  item: ChargeItemRead;
  dispenseMap: Record<string, MedicationDispenseRead | undefined>;
  isLoading: boolean;
}

export function InvoiceChargeItemTitle({
  item,
  dispenseMap,
  isLoading,
}: InvoiceChargeItemTitleProps) {
  const { t } = useTranslation();

  // If not a medication dispense, show original title
  if (item.service_resource !== ChargeItemServiceResource.medication_dispense) {
    return <span>{item.title}</span>;
  }

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  // Try to get dispense data
  const dispense = item.service_resource_id
    ? dispenseMap[item.service_resource_id]
    : undefined;

  // If no dispense data found, fallback to original title
  if (!dispense) {
    return <span>{item.title}</span>;
  }

  const medicineName = dispense.item?.product?.product_knowledge?.name;
  const lotNumber = dispense.item?.product?.batch?.lot_number;
  const expiryDate = dispense.item?.product?.expiration_date;

  return (
    <div className="flex flex-col">
      <span>{medicineName || item.title}</span>
      {(lotNumber || expiryDate) && (
        <span className="text-xs text-gray-500">
          {lotNumber && `${t("lot")}: ${lotNumber}`}
          {lotNumber && expiryDate && " | "}
          {expiryDate &&
            `${t("expiry")}: ${format(new Date(expiryDate), "dd/MM/yyyy")}`}
        </span>
      )}
    </div>
  );
}

interface UseMedicationDispenseDataResult {
  dispenseMap: Record<string, MedicationDispenseRead | undefined>;
  isLoadingDispenses: boolean;
  hasDispenseErrors: boolean;
}

export function useMedicationDispenseData(
  chargeItems: ChargeItemRead[] | undefined,
): UseMedicationDispenseDataResult {
  const { t } = useTranslation();

  // Get medication dispense charge items
  const medicationDispenseItems =
    chargeItems?.filter(
      (item) =>
        item.service_resource ===
          ChargeItemServiceResource.medication_dispense &&
        item.service_resource_id,
    ) || [];

  const { dispenseMap, isLoadingDispenses, hasDispenseErrors } = useQueries({
    queries: medicationDispenseItems.map((item) => ({
      queryKey: ["medication_dispense", item.service_resource_id],
      queryFn: query(medicationDispenseApi.get, {
        pathParams: { id: item.service_resource_id! },
      }),
      enabled: !!item.service_resource_id,
    })),
    combine: (results) => {
      const map: Record<string, MedicationDispenseRead | undefined> = {};
      const hasErrors = results.some((r) => r.isError);

      medicationDispenseItems.forEach((item, index) => {
        if (item.service_resource_id) {
          map[item.service_resource_id] = results[index]?.data;
        }
      });

      return {
        dispenseMap: map,
        isLoadingDispenses: results.some((r) => r.isLoading),
        hasDispenseErrors: hasErrors,
      };
    },
  });

  // Show toast on error (only once using ref)
  const hasShownErrorToast = useRef(false);
  useEffect(() => {
    if (
      hasDispenseErrors &&
      !isLoadingDispenses &&
      !hasShownErrorToast.current
    ) {
      toast.error(t("failed_to_load_medication_details"));
      hasShownErrorToast.current = true;
    }
  }, [hasDispenseErrors, isLoadingDispenses, t]);

  return {
    dispenseMap,
    isLoadingDispenses,
    hasDispenseErrors,
  };
}
