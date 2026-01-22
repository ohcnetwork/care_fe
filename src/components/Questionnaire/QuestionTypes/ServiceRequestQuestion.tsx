import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
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
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

import UserSelector from "@/components/Common/UserSelector";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useAuthUser from "@/hooks/useAuthUser";

import { add } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { getBasePrice } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
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
import { Decimal } from "decimal.js";

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
  onCancel?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  activityDefinition?: ActivityDefinitionReadSpec;
  facilityId?: string;
}

function ServiceRequestForm({
  serviceRequest,
  onUpdate,
  onRemove,
  disabled,
  errors,
  questionId,
  index,
  activityDefinition,
  facilityId = "",
}: ServiceRequestFormProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm relative">
        <div className="absolute left-0 top-4 w-1 h-4 bg-purple-500 rounded-r-full" />
        <CollapsibleTrigger className="flex flex-col gap-3 w-full items-start text-left p-2 pl-6 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {serviceRequest.service_request.title}
              </p>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                {t(serviceRequest.service_request.category)}
              </Badge>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              {serviceRequest.service_request.requester && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap"
                >
                  {formatName(serviceRequest.service_request.requester)}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                {activityDefinition && (
                  <span className="text-sm font-medium text-gray-700">
                    <MonetaryDisplay
                      amount={activityDefinition.charge_item_definitions.reduce(
                        (acc: Decimal, curr: ChargeItemDefinitionBase) =>
                          add(acc, getBasePrice(curr.price_components)),
                        new Decimal(0),
                      )}
                    />
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                  }}
                  disabled={disabled}
                >
                  <Pencil className="h-4 w-4 text-gray-600" />
                </Button>
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
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-gray-100">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t("priority")} <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={serviceRequest.service_request.priority}
                  onValueChange={(value: Priority) =>
                    onUpdate?.({ priority: value })
                  }
                  disabled={disabled}
                  className="flex flex-wrap gap-4"
                >
                  {Object.values(Priority).map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={priority}
                        id={`priority-${priority}-${index || "preview"}`}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={`priority-${priority}-${index || "preview"}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {t(priority)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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

      setServiceRequests([...serviceRequests, newServiceRequest]);
      updateQuestionnaireResponseCB(
        [
          {
            type: "service_request",
            value: [...serviceRequests, newServiceRequest],
          },
        ],
        questionnaireResponse.question_id,
      );
      setActivityDefinitionsMap((prev) => ({
        ...prev,
        [selectedActivityDefinition]: selectedActivityDefinitionData,
      }));
      setSelectedActivityDefinition(null);
    }
  }, [
    selectedActivityDefinition,
    selectedActivityDefinitionData,
    encounterId,
    currentUser,
  ]);

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
          translationBaseKey="activity_definition"
        />
      </div>
    </div>
  );
}
