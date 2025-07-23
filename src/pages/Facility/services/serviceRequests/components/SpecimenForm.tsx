"use client";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { Info, QrCode, Scan /* User */ } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { PrintableQRCode } from "@/components/PrintableQRCode";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import SpecimenIDScanDialog from "@/components/Scan/SpecimenIDScanDialog";

// Change to default import
import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { Code } from "@/types/base/code/code";
import {
  CollectionSpec,
  SpecimenFromDefinitionCreate,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import type { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

interface SpecimenFormProps {
  specimenDefinition: SpecimenDefinitionRead;
  onCancel: () => void;
  facilityId: string;
  draftSpecimen: SpecimenRead | undefined;
  serviceRequestId: string;
}

export function SpecimenForm({
  specimenDefinition,
  onCancel,
  facilityId,
  draftSpecimen,
  serviceRequestId,
}: SpecimenFormProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const currentUserId = authUser.external_id;
  const queryClient = useQueryClient();

  const [identifierMode, setIdentifierMode] = useState<"scan" | "generate">(
    "generate",
  );
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  const [errors, setErrors] = useState<{
    quantityValue?: string;
    quantityUnit?: string;
  }>({});

  const [specimenData, setSpecimenData] = useState<
    Omit<SpecimenFromDefinitionCreate, "specimen"> & {
      specimen: Omit<
        SpecimenFromDefinitionCreate["specimen"],
        "processing" | "condition"
      >;
    }
  >({
    specimen_definition: specimenDefinition.id,
    specimen: {
      status: SpecimenStatus.available,
      specimen_type: specimenDefinition.type_collected,
      accession_identifier: "",
      received_time: null,
      collection: {
        method: specimenDefinition.collection || null,
        body_site: null,
        collector: currentUserId || null, // Use user ID, default to null if not available yet
        collected_date_time: new Date().toISOString(),
        quantity: null,
        procedure: null,
        fasting_status_codeable_concept: null,
        fasting_status_duration: null,
      },
      note: null,
    },
  });

  const { mutate: updateSpecimen } = useMutation({
    mutationFn: mutate(specimenApi.updateSpecimen, {
      pathParams: {
        facilityId,
        specimenId: draftSpecimen?.id || "",
      },
    }),
    onSuccess: () => {
      toast.success(t("specimen_collected"));
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", facilityId, serviceRequestId],
      });
      onCancel();
    },
    onError: () => {
      toast.error(t("specimen_update_error"));
    },
  });

  const handleScanBarcode = () => {
    setIsScanDialogOpen(true);
  };

  const handleScanSuccess = (specimen_id: string) => {
    handleSpecimenChange("accession_identifier", specimen_id);
    setIsScanDialogOpen(false);
  };

  const handleCollectionChange = (field: keyof CollectionSpec, value: any) => {
    setSpecimenData((prev) => ({
      ...prev,
      specimen: {
        ...prev.specimen,
        collection: prev.specimen.collection
          ? {
              ...prev.specimen.collection,
              [field]: value,
            }
          : null,
      },
    }));

    if (field === "quantity") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (value?.value) delete newErrors.quantityValue;
        if (value?.unit) delete newErrors.quantityUnit;
        return newErrors;
      });
    }
  };

  const handleSpecimenChange = (
    field: keyof SpecimenFromDefinitionCreate["specimen"],
    value: any,
  ) => {
    setSpecimenData((prev) => ({
      ...prev,
      specimen: {
        ...prev.specimen,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure collector ID is available before submitting
    if (!currentUserId) {
      toast.error(t("specimen_collector_unavailable"));
      return;
    }

    if (!draftSpecimen) {
      toast.error(t("specimen_draft_missing"));
      return;
    }

    const quantity = specimenData.specimen.collection?.quantity;
    const newErrors: typeof errors = {};

    if (!quantity?.value || quantity.value <= 0) {
      newErrors.quantityValue = t("field_required");
    }

    if (quantity?.value && quantity.value <= 0) {
      newErrors.quantityValue = t("invalid_quantity");
    }

    if (!quantity?.unit) {
      newErrors.quantityUnit = t("field_required");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    let finalData = { ...specimenData };
    if (identifierMode === "generate") {
      finalData = {
        ...finalData,
        specimen: {
          ...finalData.specimen,
          accession_identifier: draftSpecimen.accession_identifier,
        },
      };
    }

    // Create the update payload using the existing specimen ID
    const submissionPayload: SpecimenRead = {
      ...draftSpecimen, // Keep existing fields
      ...finalData.specimen, // Update with new data
      id: draftSpecimen.id,
      status: SpecimenStatus.available,
      collection: {
        method: finalData.specimen.collection?.method ?? null,
        collected_date_time:
          finalData.specimen.collection?.collected_date_time ?? null,
        quantity: finalData.specimen.collection?.quantity ?? null,
        procedure: finalData.specimen.collection?.procedure ?? null,
        body_site: finalData.specimen.collection?.body_site ?? null,
        fasting_status_codeable_concept:
          finalData.specimen.collection?.fasting_status_codeable_concept ??
          null,
        fasting_status_duration:
          finalData.specimen.collection?.fasting_status_duration ?? null,
        collector: currentUserId,
      },
      // Preserve these from draft specimen
      processing: draftSpecimen.processing,
      condition: draftSpecimen.condition,
      created_at: draftSpecimen.created_at,
      updated_at: draftSpecimen.updated_at,
      created_by: draftSpecimen.created_by,
      updated_by: draftSpecimen.updated_by,
      type_tested: draftSpecimen.type_tested,
      specimen_definition: draftSpecimen.specimen_definition,
    };

    updateSpecimen(submissionPayload);
  };

  return (
    <div>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div>
          <div className="font-medium text-lg mb-2">
            {t("specimen_identification")}
          </div>
          <Tabs
            value={identifierMode}
            onValueChange={(v) => setIdentifierMode(v as "scan" | "generate")}
            defaultValue="generate"
          >
            <TabsList className="w-full">
              <TabsTrigger
                value="generate"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                {t("generate_qr")}
              </TabsTrigger>
              <TabsTrigger
                value="scan"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Scan className="h-4 w-4" />
                {t("scan_existing")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              {draftSpecimen ? (
                <>
                  <div className="rounded-lg bg-green-50 p-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="green" className="bg-white rounded-full">
                        {t("success")}
                      </Badge>
                      <span className="text-green-800 font-medium text-sm">
                        {t("qr_success")}
                      </span>
                    </div>
                  </div>
                  <Card className="p-4">
                    <PrintableQRCode
                      value={draftSpecimen.id}
                      title={draftSpecimen.specimen_type?.display}
                      subtitle={draftSpecimen.specimen_definition?.title}
                    />
                  </Card>
                </>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-4 text-center bg-gray-50">
                  <QrCode className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    {draftSpecimen
                      ? t("generating_qr")
                      : t("generate_qr_failed")}
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="scan">
              <div className="flex gap-2">
                <Input
                  value={specimenData.specimen.accession_identifier}
                  onChange={(e) =>
                    handleSpecimenChange("accession_identifier", e.target.value)
                  }
                  placeholder={t("specimen_scan_placeholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScanBarcode}
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-4">
          <div className="font-medium text-lg mb-2">
            {t("specimen_collection_info")}
          </div>
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-700">
                  {t("collection_date_time")}
                </Label>
                <Input
                  className="h-9"
                  type="datetime-local"
                  value={
                    specimenData.specimen.collection?.collected_date_time?.split(
                      ".",
                    )[0] || ""
                  }
                  onChange={(e) =>
                    handleCollectionChange(
                      "collected_date_time",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">{t("quantity")}</Label>
                <div className="flex gap-2">
                  <div className="flex-1 max-w-36">
                    <Input
                      pattern="[0-9]*"
                      type="number"
                      placeholder={t("value")}
                      className="h-9"
                      value={
                        specimenData.specimen.collection?.quantity?.value ?? ""
                      }
                      onChange={(e) =>
                        handleCollectionChange("quantity", {
                          ...(specimenData.specimen.collection?.quantity ?? {}),
                          value: e.target.value
                            ? parseFloat(e.target.value)
                            : null,
                          unit: specimenData.specimen.collection?.quantity
                            ?.unit,
                        })
                      }
                      step="any"
                    />
                    {errors.quantityValue && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.quantityValue}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <ValueSetSelect
                      system="system-ucum-units"
                      placeholder={t("unit")}
                      onSelect={(code: Code | null) =>
                        handleCollectionChange("quantity", {
                          ...(specimenData.specimen.collection?.quantity ?? {}),
                          value:
                            specimenData.specimen.collection?.quantity?.value ??
                            null,
                          unit: code,
                        })
                      }
                      value={specimenData.specimen.collection?.quantity?.unit}
                    />
                    {errors.quantityUnit && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.quantityUnit}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-700">{t("body_site")}</Label>
              <ValueSetSelect
                system="system-body-site"
                placeholder={t("select_body_site")}
                onSelect={(code: Code | null) =>
                  handleCollectionChange("body_site", code)
                }
                value={specimenData.specimen.collection?.body_site}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="col-span-1 md:col-span-4">
                <Label className="text-sm text-gray-700">
                  {t("fasting_status")}
                </Label>
                <ValueSetSelect
                  system="system-fasting-status-code"
                  placeholder={t("fasting_status_placeholder")}
                  onSelect={(code: Code | null) =>
                    handleCollectionChange(
                      "fasting_status_codeable_concept",
                      code,
                    )
                  }
                  value={
                    specimenData.specimen.collection
                      ?.fasting_status_codeable_concept
                  }
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <Label className="text-sm text-gray-700">
                  {t("fasting_duration")}
                </Label>
                <Input
                  type="number"
                  placeholder={t("fasting_duration_placeholder")}
                  value={
                    specimenData.specimen.collection?.fasting_status_duration
                      ?.value ?? ""
                  }
                  onChange={(e) =>
                    handleCollectionChange("fasting_status_duration", {
                      ...(specimenData.specimen.collection
                        ?.fasting_status_duration ?? {}),
                      value: e.target.value ? parseFloat(e.target.value) : null,
                      unit: specimenData.specimen.collection
                        ?.fasting_status_duration?.unit ?? {
                        code: "h",
                        display: "hour",
                        system: "http://unitsofmeasure.org",
                      },
                    })
                  }
                />
              </div>
            </div>

            {specimenDefinition.type_tested?.container && (
              <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-600">
                  <Info className="h-4 w-4" />
                  {t("container_requirements")}
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t("type")}: </span>
                    {specimenDefinition.type_tested.container.description}
                  </div>
                  {specimenDefinition.type_tested.container.capacity && (
                    <div>
                      <span className="text-gray-600">
                        {t("container_capacity")}:{" "}
                      </span>
                      {specimenDefinition.type_tested.container.capacity.value}{" "}
                      {
                        specimenDefinition.type_tested.container.capacity.unit
                          .display
                      }
                    </div>
                  )}
                  {specimenDefinition.type_tested.container.minimum_volume && (
                    <div>
                      <span className="text-gray-600">
                        {t("container_min_volume")}:{" "}
                      </span>
                      {specimenDefinition.type_tested.container.minimum_volume
                        .string ||
                        (specimenDefinition.type_tested.container.minimum_volume
                          .quantity &&
                          `${specimenDefinition.type_tested.container.minimum_volume.quantity.value} ${specimenDefinition.type_tested.container.minimum_volume.quantity.unit.display}`)}
                    </div>
                  )}
                  {specimenDefinition.type_tested.container.preparation && (
                    <div className="col-span-2">
                      <span className="text-gray-600">
                        {t("preparation")}:{" "}
                      </span>
                      {specimenDefinition.type_tested.container.preparation}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">{t("notes")}</Label>
              <Textarea
                placeholder={t("notes_placeholder")}
                value={specimenData.specimen.note ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleSpecimenChange("note", e.target.value || null)
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("collect")}</Button>
            </div>
          </div>
        </div>
      </form>

      <SpecimenIDScanDialog
        open={isScanDialogOpen}
        onOpenChange={setIsScanDialogOpen}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
