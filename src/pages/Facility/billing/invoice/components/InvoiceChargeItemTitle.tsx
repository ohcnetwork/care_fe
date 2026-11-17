import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";

import { getChargeItemTitle } from "@/pages/Facility/billing/invoice/invoicePrintData";
import {
  ChargeItemRead,
  ChargeItemServiceResource,
} from "@/types/billing/chargeItem/chargeItem";
import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { batchQuery } from "@/Utils/request/batch";

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

  const { title, subtitle } = getChargeItemTitle(item, dispenseMap, t);

  if (!subtitle) {
    return <span>{title}</span>;
  }

  return (
    <div className="flex flex-col">
      <span>{title}</span>
      <span className="text-xs text-gray-500">{subtitle}</span>
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

  const dispenseIds =
    chargeItems?.reduce((ids: string[], item) => {
      if (
        item.service_resource ===
          ChargeItemServiceResource.medication_dispense &&
        item.service_resource_id
      ) {
        ids.push(item.service_resource_id);
      }
      return ids;
    }, []) || [];

  // Get medication dispense charge items
  const {
    data: batchResponse,
    isLoading: isLoadingDispenses,
    isError: hasDispenseErrors,
  } = useQuery({
    queryKey: ["medication_dispense_batch", dispenseIds],
    queryFn: batchQuery<MedicationDispenseRead>(
      dispenseIds.map((id) => ({
        api: medicationDispenseApi.get,
        pathParams: { id },
        referenceId: id,
      })),
    ),
    enabled: dispenseIds.length > 0,
  });

  // Build dispense map from batch response
  const dispenseMap: Record<string, MedicationDispenseRead | undefined> = {};
  for (const result of batchResponse?.results ?? []) {
    if (result.status_code === 200 && result.data) {
      dispenseMap[result.reference_id] = result.data;
    }
  }

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
