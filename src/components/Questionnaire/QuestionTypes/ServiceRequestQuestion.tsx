import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Info, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TooltipComponent } from "@/components/ui/tooltip";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

import UserSelector from "@/components/Common/UserSelector";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useAuthUser from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import {
  ServiceRequestApplyActivityDefinitionSpec as BaseServiceRequestApplyActivityDefinitionSpec,
  Intent,
  Priority,
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { CurrentUserRead, UserReadMinimal } from "@/types/user/user";

// Extend the base type to use UserReadMinimal for requester
interface ServiceRequestApplyActivityDefinitionSpec
  extends Omit<
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
}: ServiceRequestFormProps) {
  const { t } = useTranslation();

  const renderInfoSection = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2 w-full">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-700">
          {t("status")}:
        </span>
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {t(serviceRequest.service_request.status)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-700">
          {t("intent")}:
        </span>
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          {t(serviceRequest.service_request.intent)}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-700">
          {t("category")}:
        </span>
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          {t(serviceRequest.service_request.category)}
        </Badge>
      </div>
      {serviceRequest.service_request.do_not_perform && (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-700">
            {t("do_not_perform")}:
          </span>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            {t("yes")}
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap col-span-1 sm:col-span-2 xl:col-span-4">
        <span className="font-medium text-sm text-gray-700">
          {t("locations")}:
        </span>
        {activityDefinition?.locations &&
          activityDefinition?.locations.length > 0 &&
          activityDefinition?.locations.map((location) => {
            return (
              <Badge
                key={location.id}
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200"
              >
                {location?.name || location.id}
              </Badge>
            );
          })}
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="rounded-lg border border-primary-500 p-4 space-y-4 bg-white shadow-sm">
        <div className="flex flex-col gap-2 items-start w-full">
          <div className="flex gap-2 items-center">
            <p className="text-sm font-semibold text-gray-900">
              {serviceRequest.service_request.title}
            </p>
            <TooltipComponent
              content={`${serviceRequest.service_request.code.code} | ${serviceRequest.service_request.code.display} \n${serviceRequest.service_request.code.system}`}
            >
              <Info className="size-4 text-gray-600 cursor-help" />
            </TooltipComponent>
          </div>
          {renderInfoSection()}
          <div className="flex w-full justify-end items-center mt-2 gap-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                data-cy="remove-service-request"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {t("priority")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.priority}
              onValueChange={(value: Priority) =>
                onUpdate?.({ priority: value })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_priority")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Priority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Textarea
              value={serviceRequest.service_request.patient_instruction || ""}
              onChange={(e) =>
                onUpdate?.({ patient_instruction: e.target.value })
              }
              disabled={disabled}
              placeholder={t("enter_patient_instructions")}
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
            <Textarea
              value={serviceRequest.service_request.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              placeholder={t("add_notes")}
            />
          </div>
        </div>
        {isPreview && (
          <div className="flex justify-end">
            <Button onClick={onAdd} data-cy="add-service-request">
              {t("add")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={false}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <CollapsibleTrigger className="flex flex-col gap-2 w-full items-start text-left p-4 hover:bg-gray-50 cursor-pointer">
          <div className="flex gap-2 items-center">
            <p className="text-sm font-semibold text-gray-900">
              {serviceRequest.service_request.title}
            </p>
            <TooltipComponent
              content={`${serviceRequest.service_request.code.code} | ${serviceRequest.service_request.code.display} \n${serviceRequest.service_request.code.system}`}
            >
              <Info className="size-4 text-gray-600 cursor-help" />
            </TooltipComponent>
          </div>
          {renderInfoSection()}
          <div className="flex w-full justify-end items-center mt-2 gap-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled}
                data-cy="remove-service-request"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-gray-100">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t("priority")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.priority}
                  onValueChange={(value: Priority) =>
                    onUpdate?.({ priority: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Textarea
                  value={
                    serviceRequest.service_request.patient_instruction || ""
                  }
                  onChange={(e) =>
                    onUpdate?.({ patient_instruction: e.target.value })
                  }
                  disabled={disabled}
                  placeholder={t("enter_patient_instructions")}
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
                <Textarea
                  value={serviceRequest.service_request.note || ""}
                  onChange={(e) => onUpdate?.({ note: e.target.value })}
                  disabled={disabled}
                  placeholder={t("add_notes")}
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
  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { limit: 100 },
    }),
  });

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
    console.log("selectedActivityDefinition", selectedActivityDefinition);
  }, [selectedActivityDefinition]);

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

        // Handle locations update specifically to ensure correct typing
        const updatedLocations = updates.locations
          ? ((Array.isArray(updates.locations)
              ? updates.locations.map((loc) => {
                  if (typeof loc === "string") {
                    const location = locations?.results.find(
                      (l: LocationList) => l.id === loc,
                    );

                    return {
                      id: loc,
                      has_children: false,
                      status: "active",
                      operational_status: "O",
                      name: location?.name || loc,
                      description: "",
                      form: location?.form || "si",
                      mode: "instance",
                      availability_status: "available",
                      sort_index: location?.sort_index || 0,
                    } as LocationList;
                  }
                  return loc;
                })
              : updates.locations) as LocationList[])
          : sr.service_request.locations || [];

        // Create updated service request with proper type handling
        const updatedServiceRequest = {
          ...sr,
          service_request: {
            ...sr.service_request,
            ...updates,
            locations: updatedLocations.map((loc) =>
              typeof loc === "string" ? loc : loc.id,
            ),
          },
        };

        return updatedServiceRequest;
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

    // Handle locations update specifically
    const updatedLocations = updates.locations
      ? Array.isArray(updates.locations)
        ? updates.locations.map((loc) =>
            typeof loc === "string" ? loc : loc.id,
          )
        : updates.locations
      : previewServiceRequest.service_request.locations;

    setPreviewServiceRequest({
      ...previewServiceRequest,
      service_request: {
        ...previewServiceRequest.service_request,
        ...updates,
        locations: updatedLocations,
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
    setSelectedActivityDefinition(def?.slug || null);
  };

  return (
    <div className="space-y-4">
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
        />
      ))}

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
        />
      )}

      <div className="space-y-2 w-full">
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
          translations={{
            searchPlaceholder: "search_activity_definitions",
            selectPlaceholder: "select_activity_definition",
            noResultsFound: "no_activity_definitions_found_for",
            noItemsFound: "no_activity_definitions_found",
          }}
        />
      </div>
    </div>
  );
}
