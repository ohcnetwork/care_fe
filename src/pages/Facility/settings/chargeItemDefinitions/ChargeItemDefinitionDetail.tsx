import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { ConditionOperation } from "@/types/base/condition/condition";
import {
  MonetaryComponent,
  MonetaryComponentOrder,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  CHARGE_ITEM_DEFINITION_STATUS_COLORS,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

interface ChargeItemDefinitionDetailProps {
  facilityId: string;
  slug: string;
}

export function ChargeItemDefinitionDetail({
  facilityId,
  slug,
}: ChargeItemDefinitionDetailProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: chargeItemDefinition, isLoading } = useQuery({
    queryKey: ["chargeItemDefinitions", slug],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: { facilityId, slug },
    }),
  });

  const { mutate: updateChargeItemDefinition, isPending: isDeleting } =
    useMutation({
      mutationFn: mutate(chargeItemDefinitionApi.updateChargeItemDefinition, {
        pathParams: { facilityId, slug: slug },
      }),
      onSuccess: () => {
        toast.success(t("definition_deleted_successfully"));
        queryClient.invalidateQueries({ queryKey: ["chargeItemDefinitions"] });
        navigate(`/facility/${facilityId}/settings/charge_item_definitions`);
      },
    });

  const handleDelete = () => {
    if (!chargeItemDefinition) return;
    updateChargeItemDefinition({
      ...chargeItemDefinition,
      status: ChargeItemDefinitionStatus.retired,
      category: chargeItemDefinition.category.slug,
    });
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
            <p className="font-medium">
              {/* TODO: Internationalize currency symbol */}₹{component.amount}
            </p>
          ) : component.factor ? (
            <p className="font-medium">{component.factor}%</p>
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
                <Badge
                  variant={
                    CHARGE_ITEM_DEFINITION_STATUS_COLORS[
                      chargeItemDefinition.status
                    ]
                  }
                >
                  {t(chargeItemDefinition.status)}
                </Badge>
                {chargeItemDefinition.version && (
                  <Badge variant="outline">
                    {t("version")} {chargeItemDefinition.version}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {chargeItemDefinition.status !== "retired" && (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <CareIcon icon="l-trash" className="mr-2 size-4" />
                  {t("delete")}
                </Button>
              )}
              <Button
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/charge_item_definitions/${slug}/edit`,
                  )
                }
              >
                <CareIcon icon="l-pen" className="mr-2" />
                {t("edit")}
              </Button>
            </div>
          </div>

          <ConfirmActionDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            title={t("delete_charge_item_definition")}
            description={
              <Alert variant="destructive">
                <AlertTitle>{t("warning")}</AlertTitle>
                <AlertDescription>
                  {t("are_you_sure_want_to_delete", {
                    name: chargeItemDefinition?.title,
                  })}
                </AlertDescription>
              </Alert>
            }
            confirmText={isDeleting ? t("deleting") : t("confirm")}
            cancelText={t("cancel")}
            onConfirm={handleDelete}
            variant="destructive"
            disabled={isDeleting}
          />

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
                        {/* {component.conditions && ( */}
                        {component.conditions && (
                          <div>
                            <p className="text-sm text-gray-500">
                              {t("conditions")}
                            </p>
                            {component.conditions.map((condition, index) => {
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border"
                                >
                                  <span>
                                    {condition.metric}{" "}
                                    <span className="font-mono pr-2 ">
                                      {condition.operation}
                                    </span>
                                    {condition.operation ===
                                    ConditionOperation.equality
                                      ? condition.value
                                      : `${condition.value.min} - ${condition.value.max}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
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
