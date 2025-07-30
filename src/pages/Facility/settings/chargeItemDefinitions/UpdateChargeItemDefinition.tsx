import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

import { ChargeItemDefinitionForm } from "./ChargeItemDefinitionForm";

interface UpdateChargeItemDefinitionProps {
  facilityId: string;
  chargeItemDefinitionId: string;
}

export function UpdateChargeItemDefinition({
  facilityId,
  chargeItemDefinitionId,
}: UpdateChargeItemDefinitionProps) {
  const { t } = useTranslation();

  const {
    data: chargeItemDefinition,
    isError,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["chargeItemDefinitions", chargeItemDefinitionId],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: { facilityId, chargeItemDefinitionId },
    }),
    retry: 1,
  });

  if (isFetching) {
    return (
      <Page title={t("update_charge_item_definition")}>
        <div className="container mx-auto">
          <TableSkeleton count={1} />
        </div>
      </Page>
    );
  }

  if (isError) {
    console.error("Error fetching charge item definition:", error);
    return (
      <Page title={t("update_charge_item_definition")}>
        <div className="container mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>
              {t("error_fetching_charge_item_definition")}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/charge_item_definitions`,
                )
              }
              className="text-sm text-blue-600 hover:underline"
            >
              {t("return_to_list")}
            </button>
          </div>
        </div>
      </Page>
    );
  }

  if (!chargeItemDefinition) {
    console.warn(
      "No charge item definition found with ID:",
      chargeItemDefinitionId,
    );
    navigate(`/facility/${facilityId}/settings/charge_item_definitions`);
    return null;
  }

  const handleSuccess = () => {
    navigate(
      `/facility/${facilityId}/settings/charge_item_definitions/${chargeItemDefinitionId}`,
    );
  };

  return (
    <Page
      title={t("update_charge_item_definition")}
      className="mx-auto max-w-screen-lg"
    >
      <div className="container">
        <div className="mb-4">
          <p className="text-gray-600">
            {t("update_charge_item_definition_description")}
          </p>
        </div>

        <ChargeItemDefinitionForm
          facilityId={facilityId}
          initialData={chargeItemDefinition}
          isUpdate={true}
          onSuccess={handleSuccess}
        />
      </div>
    </Page>
  );
}
