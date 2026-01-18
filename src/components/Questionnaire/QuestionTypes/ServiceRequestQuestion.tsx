import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import RadioInput from "@/components/ui/RadioInput";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

import UserSelector from "@/components/Common/UserSelector";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useAuthUser from "@/hooks/useAuthUser";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Separator } from "@/components/ui/separator";
import {
  ServiceRequestApplyActivityDefinitionSpec as BaseServiceRequestApplyActivityDefinitionSpec,
  Intent,
  Priority,
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { CurrentUserRead, UserReadMinimal } from "@/types/user/user";
import query from "@/Utils/request/query";

// Extend the base type to use UserReadMinimal for requester
interface ServiceRequestApplyActivityDefinitionSpec extends Omit<
  BaseServiceRequestApplyActivityDefinitionSpec,
  "service_request"
> {
  service_request: Omit<
    BaseServiceRequestApplyActivityDefinitionSpec["service_request"],
    "requester"
  > & {
    requester: UserReadMinimal;
  };
}

interface ServiceRequestQuestionProps {
  encounterId: string;
  facilityId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: any[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
}

const SERVICE_REQUEST_FIELDS = {
  TITLE: {
    key: "title",
    required: true,
  },
  STATUS: {
    key: "status",
    required: true,
  },
  INTENT: {
    key: "intent",
    required: true,
  },
  PRIORITY: {
    key: "priority",
    required: true,
  },
  CATEGORY: {
    key: "category",
    required: true,
  },
  CODE: {
    key: "code",
    required: true,
  },
} as const;

export function validateServiceRequestQuestion(
  values: ServiceRequestReadSpec[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    const fieldErrors = Object.entries(SERVICE_REQUEST_FIELDS)
      .filter(([_, field]) => field.required && !value[field.key])
      .map(([_, field]) => ({
        question_id: questionId,
        error: "field_required",
        type: "validation_error",
        field_key: field.key,
        index,
      }));

    return [...errors, ...fieldErrors];
  }, []);
}

interface ServiceRequestFormProps {
  serviceRequest: ServiceRequestApplyActivityDefinitionSpec;
  onUpdate?: (updates: Partial<ServiceRequestReadSpec>) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  isPreview?: boolean;
  activityDefinition?: ActivityDefinitionReadSpec;
  facilityId?: string;
  pickerSlot?: React.ReactNode;
}

function ServiceRequestForm({
  serviceRequest,
  onUpdate,
  onRemove,
  onAdd,
  disabled,
  errors,
  questionId,
  index,
  isPreview = false,
  activityDefinition,
  facilityId = "",
  pickerSlot,
}: ServiceRequestFormProps) {
  const { t } = useTranslation();

  const renderBadgeRow = () => (
    <div className="flex items-start gap-4 flex-wrap lg:flex-nowrap">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-normal leading-none text-gray-700">
            {t("status")}
          </span>
          <Badge variant="indigo">
            {t(serviceRequest.service_request.status)}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-normal leading-none text-gray-700">
            {t("intent")}
          </span>
          <Badge variant="orange">
            {t(serviceRequest.service_request.intent)}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-normal leading-none text-gray-700">
            {t("category")}
          </span>
          <Badge variant="pink">
            {t(serviceRequest.service_request.category)}
          </Badge>
        </div>
        {activityDefinition?.healthcare_service && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal leading-none text-gray-700">
              {t("healthcare_service")}
            </span>
            <Badge variant="purple">
              {activityDefinition.healthcare_service.name}
            </Badge>
          </div>
        )}
      </div>
      {activityDefinition?.locations &&
        activityDefinition.locations.length > 0 && (
          <>
            <div className="hidden lg:block w-px h-10 bg-gray-300 self-center" />
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <span className="text-xs font-normal leading-none text-gray-700">
                {t("location")}
              </span>
              <div className="flex gap-1 flex-wrap">
                {activityDefinition.locations.map((location) => (
                  <Badge key={location.id} variant="secondary">
                    {location.name}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      {serviceRequest.service_request.do_not_perform && (
        <>
          <div className="hidden lg:block w-px h-10 bg-gray-300 self-center" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-normal leading-none text-gray-700">
              &nbsp;
            </span>
            <Badge variant="destructive">{t("do_not_perform")}</Badge>
          </div>
        </>
      )}
    </div>
  );

  if (isPreview) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-200/20 shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-4 w-1 h-6 bg-indigo-600 rounded-r-full" />
        <div className="p-4 space-y-4">
          <span className="text-lg font-semibold leading-6 text-gray-900">
            {t("selected_service_request")}
          </span>
          {pickerSlot && <div className="space-y-2 pt-2">{pickerSlot}</div>}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">{renderBadgeRow()}</div>
          </div>
          <Separator orientation="horizontal" className="bg-gray-300" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {t("priority")} <span className="text-red-500">*</span>
              </Label>
              <RadioInput
                value={serviceRequest.service_request.priority}
                onValueChange={(value) =>
                  onUpdate?.({ priority: value as Priority })
                }
                disabled={disabled}
                required
                options={Object.values(Priority).map((priority) => ({
                  label: t(priority),
                  value: priority,
                }))}
              />
              {questionId && index !== undefined && (
                <FieldError
                  fieldKey={SERVICE_REQUEST_FIELDS.PRIORITY.key}
                  questionId={questionId}
                  errors={errors}
                  index={index}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("body_site")}</Label>
              <ValueSetSelect
                system="system-body-site"
                value={serviceRequest.service_request.body_site}
                onSelect={(code) => onUpdate?.({ body_site: code })}
                placeholder={t("select_body_site")}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("requester")}</Label>
              <UserSelector
                selected={serviceRequest.service_request.requester}
                onChange={(user) => onUpdate?.({ requester: user })}
                placeholder={t("select_requester")}
                facilityId={facilityId}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("patient_instruction")}</Label>
              <AutoExpandingTextarea
                value={serviceRequest.service_request.patient_instruction || ""}
                onChange={(e) =>
                  onUpdate?.({ patient_instruction: e.target.value })
                }
                disabled={disabled}
                placeholder={t("enter_patient_instructions")}
                className="border-gray-200 focus:ring-primary-500 w-full text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("note")}</Label>
              <AutoExpandingTextarea
                value={serviceRequest.service_request.note || ""}
                onChange={(e) => onUpdate?.({ note: e.target.value })}
                disabled={disabled}
                placeholder={t("add_notes")}
                className="border-gray-200 focus:ring-primary-500 w-full text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onRemove && (
              <Button
                variant="link"
                onClick={onRemove}
                className="underline text-gray-950"
              >
                {t("cancel")}
              </Button>
            )}
            <Button variant="outline_primary" onClick={onAdd}>
              {t("add_service_request")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={false}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-4 w-1 h-6 bg-indigo-600 rounded-r-full" />
        <CollapsibleTrigger className="flex items-start justify-between w-full text-left p-4 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold text-gray-900">
              {serviceRequest.service_request.title}
            </p>
            {renderBadgeRow()}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CareIcon
              icon="l-edit"
              className="size-5 text-gray-950 font-normal"
            />
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled}
              >
                <Trash2 className="size-5 text-gray-950 font-normal" />
              </Button>
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-gray-100">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {t("priority")} <span className="text-red-500">*</span>
                </Label>
                <RadioInput
                  value={serviceRequest.service_request.priority}
                  onValueChange={(value) =>
                    onUpdate?.({ priority: value as Priority })
                  }
                  disabled={disabled}
                  required
                  options={Object.values(Priority).map((priority) => ({
                    label: t(priority),
                    value: priority,
                  }))}
                />
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.PRIORITY.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("body_site")}</Label>
                <ValueSetSelect
                  system="system-body-site"
                  value={serviceRequest.service_request.body_site}
                  onSelect={(code) => onUpdate?.({ body_site: code })}
                  placeholder={t("select_body_site")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("patient_instruction")}</Label>
                <AutoExpandingTextarea
                  value={
                    serviceRequest.service_request.patient_instruction || ""
                  }
                  onChange={(e) =>
                    onUpdate?.({ patient_instruction: e.target.value })
                  }
                  disabled={disabled}
                  placeholder={t("enter_patient_instructions")}
                  className="border-gray-200 focus:ring-primary-500 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("requester")}</Label>
                <UserSelector
                  selected={serviceRequest.service_request.requester}
                  onChange={(user) => onUpdate?.({ requester: user })}
                  placeholder={t("select_requester")}
                  facilityId={facilityId}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("note")}</Label>
                <AutoExpandingTextarea
                  value={serviceRequest.service_request.note || ""}
                  onChange={(e) => onUpdate?.({ note: e.target.value })}
                  disabled={disabled}
                  placeholder={t("add_notes")}
                  className="border-gray-200 focus:ring-primary-500 w-full"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ServiceRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
  errors,
}: ServiceRequestQuestionProps) {
  const { t } = useTranslation();
  const currentUser = useAuthUser() as CurrentUserRead;
  const [selectedActivityDefinition, setSelectedActivityDefinition] = useState<
    string | null
  >(null);
  const [previewServiceRequest, setPreviewServiceRequest] =
    useState<ServiceRequestApplyActivityDefinitionSpec | null>(null);
  const [serviceRequests, setServiceRequests] = useState<
    ServiceRequestApplyActivityDefinitionSpec[]
  >(
    (questionnaireResponse.values?.[0]
      ?.value as unknown as ServiceRequestApplyActivityDefinitionSpec[]) || [],
  );
  const [activityDefinitionsMap, setActivityDefinitionsMap] = useState<
    Record<string, ActivityDefinitionReadSpec>
  >({});

  const {
    data: selectedActivityDefinitionData,
    isLoading: isLoadingSelectedAD,
  } = useQuery({
    queryKey: ["activity_definition", selectedActivityDefinition],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: {
        facilityId: facilityId,
        activityDefinitionSlug: selectedActivityDefinition || "",
      },
    }),
    enabled: !!selectedActivityDefinition,
  });

  useEffect(() => {
    if (selectedActivityDefinition && selectedActivityDefinitionData) {
      const newServiceRequest: ServiceRequestApplyActivityDefinitionSpec = {
        service_request: {
          title: selectedActivityDefinitionData.title,
          status: Status.active,
          intent: Intent.order,
          priority: Priority.routine,
          category: selectedActivityDefinitionData.classification,
          do_not_perform: false,
          note: null,
          code: selectedActivityDefinitionData.code,
          body_site: selectedActivityDefinitionData.body_site,
          occurance: null,
          patient_instruction: null,
          requester: currentUser,
          locations:
            selectedActivityDefinitionData.locations?.map(
              (location) => location.id,
            ) || [],
        },
        activity_definition: selectedActivityDefinition,
        encounter: encounterId,
      };

      setPreviewServiceRequest(newServiceRequest);

      setActivityDefinitionsMap((prev) => ({
        ...prev,
        [selectedActivityDefinition]: selectedActivityDefinitionData,
      }));
    }
  }, [
    selectedActivityDefinition,
    selectedActivityDefinitionData,
    encounterId,
    currentUser,
  ]);

  const handleAddServiceRequest = () => {
    if (!previewServiceRequest) return;

    setServiceRequests([...serviceRequests, previewServiceRequest]);
    updateQuestionnaireResponseCB(
      [
        {
          type: "service_request",
          value: [...serviceRequests, previewServiceRequest],
        },
      ],
      questionnaireResponse.question_id,
    );
    setPreviewServiceRequest(null);
    setSelectedActivityDefinition(null);
  };

  const handleRemoveServiceRequest = (index: number) => {
    const newServiceRequests = serviceRequests.filter(
      (_, i: number) => i !== index,
    );
    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handleUpdateServiceRequest = (
    index: number,
    updates: Partial<ServiceRequestReadSpec>,
  ) => {
    const newServiceRequests = serviceRequests.map(
      (sr: ServiceRequestApplyActivityDefinitionSpec, i: number) => {
        if (i !== index) return sr;

        const { locations: _locations, ...otherUpdates } = updates;

        return {
          ...sr,
          service_request: {
            ...sr.service_request,
            ...otherUpdates,
          },
        };
      },
    );

    setServiceRequests(newServiceRequests);

    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handlePreviewServiceRequestUpdate = (
    updates: Partial<ServiceRequestReadSpec>,
  ) => {
    if (!previewServiceRequest) return;

    const { locations: _locations, ...otherUpdates } = updates;

    setPreviewServiceRequest({
      ...previewServiceRequest,
      service_request: {
        ...previewServiceRequest.service_request,
        ...otherUpdates,
      },
    });
  };

  // Effect to sync service requests with questionnaire response
  useEffect(() => {
    const initialServiceRequests =
      (questionnaireResponse.values?.[0]
        ?.value as unknown as ServiceRequestApplyActivityDefinitionSpec[]) ||
      [];

    if (
      JSON.stringify(initialServiceRequests) !== JSON.stringify(serviceRequests)
    ) {
      setServiceRequests(initialServiceRequests);
    }
  }, [questionnaireResponse.values, serviceRequests]);

  const handleActivityDefinitionSelect = (
    value:
      | ActivityDefinitionReadSpec
      | ActivityDefinitionReadSpec[]
      | undefined,
  ) => {
    const def = Array.isArray(value) ? value[0] : value;
    if (!def) {
      setSelectedActivityDefinition(null);
      setPreviewServiceRequest(null);
    } else {
      setSelectedActivityDefinition(def.slug);
    }
  };

  return (
    <div className="space-y-4">
      {serviceRequests.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
          {serviceRequests.map((serviceRequest, index) => (
            <ServiceRequestForm
              key={`${serviceRequest.service_request.code.code}-${index}`}
              serviceRequest={serviceRequest}
              onUpdate={(updates) => handleUpdateServiceRequest(index, updates)}
              onRemove={() => handleRemoveServiceRequest(index)}
              onAdd={handleAddServiceRequest}
              disabled={disabled}
              errors={errors}
              questionId={questionnaireResponse.question_id}
              index={index}
              facilityId={facilityId}
              activityDefinition={
                activityDefinitionsMap[serviceRequest.activity_definition]
              }
            />
          ))}
        </div>
      )}

      {isLoadingSelectedAD && (
        <div className="rounded-md border border-gray-200 p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewServiceRequest && !isLoadingSelectedAD && (
        <ServiceRequestForm
          serviceRequest={previewServiceRequest}
          activityDefinition={selectedActivityDefinitionData}
          onUpdate={handlePreviewServiceRequestUpdate}
          onRemove={() => {
            setPreviewServiceRequest(null);
            setSelectedActivityDefinition(null);
          }}
          onAdd={handleAddServiceRequest}
          disabled={disabled}
          isPreview
          facilityId={facilityId}
          pickerSlot={
            <ResourceDefinitionCategoryPicker<ActivityDefinitionReadSpec>
              facilityId={facilityId}
              value={selectedActivityDefinitionData || undefined}
              onValueChange={handleActivityDefinitionSelect}
              placeholder={t("select_activity_definition")}
              disabled={disabled}
              className="w-full"
              resourceType={ResourceCategoryResourceType.activity_definition}
              listDefinitions={{
                queryFn: activityDefinitionApi.listActivityDefinition,
                pathParams: { facilityId },
              }}
              translationBaseKey="activity_definition"
            />
          }
        />
      )}

      {!previewServiceRequest && !isLoadingSelectedAD && (
        <div className="rounded-lg border border-gray-200 bg-gray-200/20 shadow-sm overflow-hidden relative">
          <div className="absolute left-0 top-4 w-1 h-6 bg-indigo-600 rounded-r-full" />
          <div className="p-4">
            <span className="text-lg font-semibold leading-6 text-gray-900">
              {t(
                serviceRequests.length > 0
                  ? "select_another_service_request"
                  : "select_service_request",
              )}
            </span>
            <ResourceDefinitionCategoryPicker<ActivityDefinitionReadSpec>
              facilityId={facilityId}
              value={selectedActivityDefinitionData || undefined}
              onValueChange={handleActivityDefinitionSelect}
              placeholder={t("select_from_list")}
              disabled={disabled}
              className="w-full"
              resourceType={ResourceCategoryResourceType.activity_definition}
              listDefinitions={{
                queryFn: activityDefinitionApi.listActivityDefinition,
                pathParams: { facilityId },
              }}
              translationBaseKey="activity_definition"
            />
          </div>
        </div>
      )}
    </div>
  );
}
