import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { CardListWithHeaderSkeleton } from "@/components/Common/SkeletonLoading";
import { Code } from "@/types/base/code/code";
import {
  DurationSpec,
  SPECIMEN_DEFINITION_STATUS_COLORS,
  SpecimenDefinitionStatus,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

interface SpecimenDefinitionDetailProps {
  facilityId: string;
  specimenSlug: string;
}

export function SpecimenDefinitionDetail({
  facilityId,
  specimenSlug,
}: SpecimenDefinitionDetailProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: specimenDefinition, isLoading } = useQuery({
    queryKey: ["specimenDefinitions", facilityId, specimenSlug],
    queryFn: query(specimenDefinitionApi.retrieveSpecimenDefinition, {
      pathParams: { facilityId, specimenSlug },
    }),
  });

  const { mutate: updateSpecimenDefinition, isPending: isDeleting } =
    useMutation({
      mutationFn: mutate(specimenDefinitionApi.updateSpecimenDefinition, {
        pathParams: { facilityId, specimenSlug },
      }),
      onSuccess: () => {
        toast.success(t("specimen_definition_retired_successfully"));
        queryClient.invalidateQueries({ queryKey: ["specimenDefinitions"] });
        navigate(`/facility/${facilityId}/settings/specimen_definitions`);
      },
      onError: () => {
        toast.error(t("error_retiring_specimen_definition"));
      },
    });

  const handleDelete = () => {
    if (!specimenDefinition) return;
    updateSpecimenDefinition({
      ...specimenDefinition,
      status: SpecimenDefinitionStatus.retired,
      slug_value: specimenDefinition.slug_config.slug_value,
    });
  };

  if (isLoading) {
    return <CardListWithHeaderSkeleton count={1} />;
  }

  if (!specimenDefinition) {
    return <div>{t("specimen_definition_not_found")}</div>;
  }

  const formatQuantity = (
    quantity: { value: number | null; unit: Code | null } | null,
  ) => {
    if (!quantity?.value || !quantity?.unit?.display) return "-";
    return `${quantity.value} ${quantity.unit.display}`;
  };

  const formatDuration = (duration: DurationSpec | null | undefined) => {
    if (!duration) return "-";
    return formatQuantity(duration);
  };

  return (
    <div className="space-y-2 p-2 md:p-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          onClick={() =>
            navigate(`/facility/${facilityId}/settings/specimen_definitions`)
          }
          variant="outline"
          className="text-destructive"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <div className="flex items-start justify-between p-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-500">
              {specimenDefinition.title}
            </h1>
          </div>
          <div className="flex gap-2">
            {specimenDefinition.status !== SpecimenDefinitionStatus.retired && (
              <Button
                variant="outline"
                className="text-destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("delete")}
              </Button>
            )}
            <Link href={`/specimen_definitions/${specimenSlug}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                {t("edit")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6 space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge
              variant={
                SPECIMEN_DEFINITION_STATUS_COLORS[specimenDefinition.status]
              }
            >
              {t(specimenDefinition.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specimenDefinition.derived_from_uri && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("derived_from_uri")}
                </p>
                <p className="break-all">
                  {specimenDefinition.derived_from_uri}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-400">
              {t("description")}
            </p>
            <p className="text-pretty whitespace-pre-wrap">
              {specimenDefinition.description || "-"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specimenDefinition.type_collected && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("type_collected")}
                </p>
                <p>{specimenDefinition.type_collected.display}</p>
              </div>
            )}

            {specimenDefinition.collection && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("collection_method")}
                </p>
                <p>{specimenDefinition.collection.display}</p>
              </div>
            )}
          </div>

          {specimenDefinition.patient_preparation &&
            specimenDefinition.patient_preparation.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("patient_preparation")}
                </p>
                <div>
                  {specimenDefinition.patient_preparation.map((prep, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="text-gray-400">•</span>
                      <div>
                        <p>{prep.display}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
        {/* Type Tested Information */}
        {specimenDefinition.type_tested && (
          <div className="space-y-6 border rounded-md shadow-sm py-2 px-4">
            <p className="text-md font-semibold text-gray-400">
              {t("type_tested_information")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("is_derived")}
                </p>
                <Badge variant="outline">
                  {specimenDefinition.type_tested.is_derived
                    ? t("yes")
                    : t("no")}
                </Badge>
              </div>
              {/* Additional Information */}
              {specimenDefinition.type_tested.requirement && (
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {t("requirement")}
                  </p>
                  <p>{specimenDefinition.type_tested.requirement}</p>
                </div>
              )}
              {specimenDefinition.type_tested.retention_time && (
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {t("retention_time")}
                  </p>
                  <p>
                    {formatDuration(
                      specimenDefinition.type_tested.retention_time,
                    )}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("single_use")}
                </p>
                <Badge variant="outline">
                  {specimenDefinition.type_tested.single_use
                    ? t("yes")
                    : t("no")}
                </Badge>
              </div>
            </div>

            {/* Container Information */}
            {specimenDefinition.type_tested.container && (
              <>
                <div className="space-y-6 border rounded-md bg-gray-50 py-2 px-4">
                  <p className="text-md font-semibold text-gray-400">
                    {t("container_information")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specimenDefinition.type_tested.container.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("description")}
                        </p>
                        <p>
                          {specimenDefinition.type_tested.container.description}
                        </p>
                      </div>
                    )}
                    {specimenDefinition.type_tested.container.preparation && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("preparation")}
                        </p>
                        <p>
                          {specimenDefinition.type_tested.container.preparation}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specimenDefinition.type_tested.container.capacity && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("capacity")}
                        </p>
                        <p>
                          {formatQuantity(
                            specimenDefinition.type_tested.container.capacity,
                          )}
                        </p>
                      </div>
                    )}
                    {specimenDefinition.type_tested.container
                      .minimum_volume && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("minimum_volume")}
                        </p>
                        <p>
                          {specimenDefinition.type_tested.container
                            .minimum_volume.quantity
                            ? formatQuantity(
                                specimenDefinition.type_tested.container
                                  .minimum_volume.quantity,
                              )
                            : specimenDefinition.type_tested.container
                                .minimum_volume.string}
                        </p>
                      </div>
                    )}
                  </div>

                  {specimenDefinition.type_tested.container.cap && (
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        {t("cap")}
                      </p>
                      <p className="font-medium">
                        {specimenDefinition.type_tested.container.cap.display}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Card>
      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("are_you_sure")}
        description={
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>{t("warning")}</AlertTitle>
            <AlertDescription>
              {t("are_you_sure_want_to_delete", {
                name: specimenDefinition.title,
              })}
            </AlertDescription>
          </Alert>
        }
        confirmText={t("confirm")}
        onConfirm={handleDelete}
        variant="destructive"
        disabled={isDeleting}
      />
    </div>
  );
}
