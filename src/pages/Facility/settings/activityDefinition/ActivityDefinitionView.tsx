import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Page from "@/components/Common/Page";
import { CardListWithHeaderSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import { ACTIVITY_DEFINITION_STATUS_COLORS } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

interface Props {
  facilityId: string;
  activityDefinitionId: string;
}

function CodeDisplay({ code }: { code: Code | null }) {
  if (!code) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{code.display}</p>
      <p className="text-xs text-gray-500">{code.system}</p>
      <p className="text-xs text-gray-500">{code.code}</p>
    </div>
  );
}

export default function ActivityDefinitionView({
  facilityId,
  activityDefinitionId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: definition,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["activityDefinition", activityDefinitionId],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: { activityDefinitionId, facilityId },
    }),
  });

  const { mutate: updateActivityDefinition, isPending: isDeleting } =
    useMutation({
      mutationFn: mutate(activityDefinitionApi.updateActivityDefinition, {
        pathParams: { activityDefinitionId, facilityId },
      }),
      onSuccess: () => {
        toast.success(t("definition_deleted_successfully"));
        queryClient.invalidateQueries({ queryKey: ["activityDefinition"] });
        queryClient.invalidateQueries({
          queryKey: ["activityDefinition", activityDefinitionId],
        });
        navigate(`/facility/${facilityId}/settings/activity_definitions`);
      },
    });

  const handleDelete = () => {
    if (!definition) return;
    updateActivityDefinition({
      ...definition,
      specimen_requirements:
        definition.specimen_requirements.map((specimen) => specimen.id) || [],
      observation_result_requirements:
        definition.observation_result_requirements.map(
          (observation) => observation.id,
        ) || [],
      charge_item_definitions:
        definition.charge_item_definitions.map(
          (chargeItemDefinition) => chargeItemDefinition.slug,
        ) || [],
      locations: definition.locations.map((location) => location.id) || [],
      status: "retired",
      diagnostic_report_codes: definition.diagnostic_report_codes || [],
    });
  };

  if (isLoading) {
    return <CardListWithHeaderSkeleton count={3} />;
  }

  if (isError || !definition) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_definitions")}</AlertTitle>
            <AlertDescription>{t("definition_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(`/facility/${facilityId}/settings/activity_definitions`)
            }
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("back_to_list")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={definition.title} hideTitleOnPage={true}>
      <div className="container mx-auto max-w-3xl space-y-6">
        <Button
          variant="outline"
          size="xs"
          className="mb-2"
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/activity_definitions`)
          }
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{definition.title}</h1>
              <Badge
                variant={ACTIVITY_DEFINITION_STATUS_COLORS[definition.status]}
              >
                {t(definition.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {definition.code.system} | {definition.code.code}
            </p>
          </div>
          <div className="flex gap-2">
            {definition.status !== "retired" && (
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
              variant="outline"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/activity_definitions/${definition.id}/edit`,
                )
              }
            >
              <CareIcon icon="l-pen" className="mr-2 size-4" />
              {t("edit")}
            </Button>
          </div>
        </div>

        <ConfirmActionDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t("delete_activity_definition")}
          description={
            <Alert variant="destructive">
              <AlertTitle>{t("warning")}</AlertTitle>
              <AlertDescription>
                {t("are_you_sure_want_to_delete", {
                  name: definition?.title,
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

        <Card>
          <CardHeader>
            <CardTitle>{t("overview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{t("category")}</p>
              <p className="font-medium">{t(definition.category)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("description")}</p>
              <p className="text-gray-700">{definition.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("usage")}</p>
              <p className="text-gray-700">{definition.usage}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("technical_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div>
                <p className="mb-2 text-sm text-gray-500">{t("code")}</p>
                <div className="rounded-lg border bg-gray-50/50 p-3">
                  <CodeDisplay code={definition.code} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">{t("kind")}</p>
                <p className="font-medium">{t(definition.kind)}</p>
              </div>
              {definition.body_site && (
                <div>
                  <p className="mb-2 text-sm text-gray-500">{t("body_site")}</p>
                  <div className="rounded-lg border bg-gray-50/50 p-3">
                    <CodeDisplay code={definition.body_site} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {definition.specimen_requirements?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("specimen_requirements")}</CardTitle>
              <CardDescription>
                {t("specimen_requirements_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.specimen_requirements.map((specimen) => (
                  <div
                    key={specimen.id}
                    className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{specimen.title}</p>
                      <p className="text-sm text-gray-600">
                        {specimen.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {definition.observation_result_requirements?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("observation_result_requirements")}</CardTitle>
              <CardDescription>
                {t("observation_result_requirements_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.observation_result_requirements.map(
                  (observation) => (
                    <div
                      key={observation.id}
                      className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="space-y-2">
                        <p className="font-medium">{observation.title}</p>
                        <p className="text-sm text-gray-600">
                          {observation.description}
                        </p>
                        <Separator />
                        <div className="pt-2">
                          <p className="text-sm text-gray-500">{t("code")}</p>
                          <CodeDisplay code={observation.code} />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {definition.charge_item_definitions?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("charge_item_definitions")}</CardTitle>
              <CardDescription>
                {t("charge_item_definitions_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.charge_item_definitions.map((chargeItem) => (
                  <div
                    key={chargeItem.slug}
                    className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{chargeItem.title}</p>
                      <p className="text-sm text-gray-600">
                        {chargeItem.description}
                      </p>
                      <Separator />
                      <div className="pt-2">
                        <p className="text-sm text-gray-500">{t("purpose")}</p>
                        <p className="text-gray-700">{chargeItem.purpose}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {definition.locations?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("location_requirements")}</CardTitle>
              <CardDescription>
                {t("location_requirements_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.locations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      <p className="font-medium">{location.name}</p>
                      {location.description && (
                        <p className="text-sm text-gray-600">
                          {location.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {definition.diagnostic_report_codes?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("diagnostic_report")}</CardTitle>
              <CardDescription>
                {t("diagnostic_report_codes_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.diagnostic_report_codes.map((code, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-gray-50/50 p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-2">
                      <div className="pt-2">
                        <CodeDisplay code={code} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {definition.derived_from_uri && (
          <Card>
            <CardHeader>
              <CardTitle>{t("derived_from")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 break-all">
                {definition.derived_from_uri}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Page>
  );
}
