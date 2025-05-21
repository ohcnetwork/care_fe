import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  MonetaryComponent,
  MonetaryComponentOrder,
} from "@/types/base/monetaryComponent/monetaryComponent";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

interface ChargeItemDefinitionDetailProps {
  facilityId: string;
  chargeItemDefinitionId: string;
}

export function ChargeItemDefinitionDetail({
  facilityId,
  chargeItemDefinitionId,
}: ChargeItemDefinitionDetailProps) {
  const { t } = useTranslation();

  const { data: chargeItemDefinition, isLoading } = useQuery({
    queryKey: ["charge_item_definition", chargeItemDefinitionId],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: { facilityId, chargeItemDefinitionId },
    }),
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "retired":
        return "outline";
      default:
        return "secondary";
    }
  };

  const renderPriceComponent = (component: MonetaryComponent) => {
    const typeLabels: Record<string, string> = {
      base: t("base_price"),
      discount: t("discount"),
      tax: t("tax"),
      informational: t("informational"),
    };

    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="font-medium">
            {typeLabels[component.monetary_component_type]}
          </p>
          {component.code && (
            <p className="text-sm text-gray-500">{component.code.display}</p>
          )}
        </div>
        <div className="text-right">
          {component.amount ? (
            <p className="font-medium">₹{component.amount.toFixed(2)}</p>
          ) : component.factor ? (
            <p className="font-medium">{component.factor.toFixed(1)}%</p>
          ) : (
            <p className="text-sm text-gray-500">{t("not_specified")}</p>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Page title={t("charge_item_definition")}>
        <div className="container mx-auto">
          <TableSkeleton count={1} />
        </div>
      </Page>
    );
  }

  if (!chargeItemDefinition) {
    return (
      <Page title={t("charge_item_definition_not_found")}>
        <div className="container mx-auto">
          <div className="flex h-[200px] items-center justify-center text-gray-500">
            <div className="text-center">
              <CareIcon icon="l-folder-open" className="mx-auto mb-2 size-8" />
              <p>{t("charge_item_definition_not_found")}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/charge_item_definitions`,
                  )
                }
              >
                {t("back_to_list")}
              </Button>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={chargeItemDefinition.title}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={getStatusVariant(chargeItemDefinition.status)}>
                  {t(chargeItemDefinition.status)}
                </Badge>
                {chargeItemDefinition.version && (
                  <Badge variant="outline">
                    {t("version")} {chargeItemDefinition.version}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/charge_item_definitions/${chargeItemDefinitionId}/edit`,
                )
              }
            >
              <CareIcon icon="l-pen" className="mr-2" />
              {t("edit")}
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t("details")}</CardTitle>
            </CardHeader>
            <CardContent>
              {chargeItemDefinition.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {t("description")}
                  </h3>
                  <p className="whitespace-pre-wrap">
                    {chargeItemDefinition.description}
                  </p>
                </div>
              )}
              {chargeItemDefinition.purpose && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {t("purpose")}
                  </h3>
                  <p className="whitespace-pre-wrap">
                    {chargeItemDefinition.purpose}
                  </p>
                </div>
              )}
              {chargeItemDefinition.derived_from_uri && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {t("derived_from")}
                  </h3>
                  <p className="font-mono text-sm">
                    {chargeItemDefinition.derived_from_uri}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("price_components")}</CardTitle>
            </CardHeader>
            <CardContent>
              {chargeItemDefinition.price_components.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  <p>{t("no_price_components")}</p>
                </div>
              ) : (
                <div>
                  {chargeItemDefinition.price_components
                    .sort(
                      (a, b) =>
                        MonetaryComponentOrder[a.monetary_component_type] -
                        MonetaryComponentOrder[b.monetary_component_type],
                    )
                    .map((component, index) => (
                      <div key={index}>
                        {renderPriceComponent(component)}
                        {index <
                          chargeItemDefinition.price_components.length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
