import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { HrefLink } from "@/lib/router/HrefLink";
import { navigate } from "@/lib/router/navigate";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

import { ChargeItemDefinitionForm } from "./ChargeItemDefinitionForm";

interface UpdateChargeItemDefinitionProps {
  facilityId: string;
  slug: string;
}

export function UpdateChargeItemDefinition({
  facilityId,
  slug,
}: UpdateChargeItemDefinitionProps) {
  const { t } = useTranslation();

  const {
    data: chargeItemDefinition,
    isError,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["chargeItemDefinitions", slug],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: { facilityId, slug },
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
            <Button variant="link" asChild>
              <HrefLink
                href={`/facility/${facilityId}/settings/charge_item_definitions`}
                back
              >
                {t("return_to_list")}
              </HrefLink>
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  if (!chargeItemDefinition) {
    console.warn("No charge item definition found with ID:", slug);
    navigate({
      to: "/facility/$facilityId/settings/charge_item_definitions",
      params: { facilityId },
      replace: true,
    });
    return null;
  }

  const handleSuccess = () => {
    navigate({
      to: "/facility/$facilityId/settings/charge_item_definitions/categories/$slug",
      params: { facilityId, slug: chargeItemDefinition.category.slug },
      replace: true,
    });
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
          categorySlug={chargeItemDefinition.category.slug}
          initialData={chargeItemDefinition}
          isUpdate={true}
          onSuccess={() => handleSuccess()}
        />
      </div>
    </Page>
  );
}
