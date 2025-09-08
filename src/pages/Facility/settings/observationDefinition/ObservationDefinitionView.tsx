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
import { OBSERVATION_DEFINITION_STATUS_COLORS } from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";

interface Props {
  facilityId: string;
  observationSlug: string;
}

function CodeDisplay({ code }: { code: Code | null }) {
  if (!code) return null;
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{code.display}</p>
      <p className="text-xs text-gray-500">{code.system}</p>
      <p className="text-xs text-gray-500">{code.display}</p>
    </div>
  );
}

export default function ObservationDefinitionView({
  facilityId,
  observationSlug,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: definition,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["observationDefinitions", observationSlug],
    queryFn: query(observationDefinitionApi.retrieveObservationDefinition, {
      pathParams: { observationSlug },
      queryParams: {
        facility: facilityId,
      },
    }),
  });

  const { mutate: updateObservationDefinition, isPending: isDeleting } =
    useMutation({
      mutationFn: mutate(observationDefinitionApi.updateObservationDefinition, {
        pathParams: { observationSlug },
        queryParams: {
          facility: facilityId,
        },
      }),
      onSuccess: () => {
        toast.success(t("definition_deleted_successfully"));
        queryClient.invalidateQueries({ queryKey: ["observationDefinitions"] });
        navigate(`/facility/${facilityId}/settings/observation_definitions`);
      },
    });

  const handleDelete = () => {
    if (!definition) return;
    updateObservationDefinition({
      ...definition,
      component: definition.component || [],
      status: "retired",
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
            <AlertTitle>{t("error_loading_observation_definition")}</AlertTitle>
            <AlertDescription>
              {t("observation_definition_not_found")}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/observation_definitions`,
              )
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
            navigate(`/facility/${facilityId}/settings/observation_definitions`)
          }
        >
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>

        <div className="flex md:items-center justify-between flex-col md:flex-row ">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{definition.title}</h1>
              <Badge
                variant={
                  OBSERVATION_DEFINITION_STATUS_COLORS[definition.status]
                }
              >
                {t(definition.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600 mb-4 md:mb-0">
              {definition.code.system} | {definition.code.code}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
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
                  `/facility/${facilityId}/settings/observation_definitions/${definition.slug}/edit`,
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
          title={t("delete_observation_definition")}
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
                <p className="mb-1 text-sm text-gray-500">
                  {t("permitted_data_type")}
                </p>
                <p className="font-medium">{definition.permitted_data_type}</p>
              </div>
              {definition.permitted_unit && (
                <div>
                  <p className="mb-2 text-sm text-gray-500">
                    {t("permitted_unit")}
                  </p>
                  <div className="rounded-lg border bg-gray-50/50 p-3">
                    <CodeDisplay code={definition.permitted_unit} />
                  </div>
                </div>
              )}
              {definition.method && (
                <div>
                  <p className="mb-2 text-sm text-gray-500">{t("method")}</p>
                  <div className="rounded-lg border bg-gray-50/50 p-3">
                    <CodeDisplay code={definition.method} />
                  </div>
                </div>
              )}
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

        {definition.component?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("components")}</CardTitle>
              <CardDescription>
                {t("observation_definition_components_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {definition.component.map((comp, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="space-y-4">
                      <CodeDisplay code={comp.code} />
                      <Separator />
                      <div className="grid gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {t("data_type")}
                          </p>
                          <p className="font-medium">
                            {comp.permitted_data_type}
                          </p>
                        </div>
                        {comp.permitted_unit && (
                          <div>
                            <p className="text-sm text-gray-500">{t("unit")}</p>
                            <CodeDisplay code={comp.permitted_unit} />
                          </div>
                        )}
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
