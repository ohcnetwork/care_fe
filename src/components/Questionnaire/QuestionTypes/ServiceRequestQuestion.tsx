import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MoreVerticalIcon, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import UserSelector from "@/components/Common/UserSelector";
import ManageResponseTemplatesSheet from "@/components/Questionnaire/ManageResponseTemplatesSheet";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

import useAuthUser from "@/hooks/useAuthUser";

import { add } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
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
import { Question } from "@/types/questionnaire/question";
import {
  ActivityDefinitionTemplateSpec,
  QuestionnaireResponseTemplateReadSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";
import { CurrentUserRead, UserReadMinimal } from "@/types/user/user";
import { Decimal } from "decimal.js";

import { AddToTemplateDialog } from "@/components/Questionnaire/AddToTemplateDialog";
import { filterStructuredQuestionnaireSlugs } from "@/components/Questionnaire/data/StructuredFormData";

export function buildServiceRequestForTemplate(
  serviceRequest: ServiceRequestApplyActivityDefinitionSpec,
): ActivityDefinitionTemplateSpec {
  return {
    slug: serviceRequest.activity_definition,
    service_request: {
      title: serviceRequest.service_request.title,
      status: serviceRequest.service_request.status,
      intent: serviceRequest.service_request.intent,
      priority: serviceRequest.service_request.priority,
      category: serviceRequest.service_request.category,
      code: serviceRequest.service_request.code,
      do_not_perform: serviceRequest.service_request.do_not_perform,
      body_site: serviceRequest.service_request.body_site,
      note: serviceRequest.service_request.note,
      patient_instruction: serviceRequest.service_request.patient_instruction,
      occurance: serviceRequest.service_request.occurance,
      locations: serviceRequest.service_request.locations,
    },
  };
}

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
  questionnaireSlug?: string;
  question: Question;
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
  onAddToTemplate?: (
    serviceRequest: ServiceRequestApplyActivityDefinitionSpec,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  activityDefinition?: ActivityDefinitionReadSpec;
  facilityId?: string;
  requester?: UserReadMinimal;
  onRequesterChange?: (user: UserReadMinimal | undefined) => void;
}

function ServiceRequestForm({
  serviceRequest,
  onUpdate,
  onRemove,
  onAddToTemplate,
  disabled,
  errors,
  questionId,
  index,
  activityDefinition,
  facilityId = "",
  requester,
  onRequesterChange,
}: ServiceRequestFormProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
                <DropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      disabled={disabled}
                    >
                      <MoreVerticalIcon className="h-4 w-4 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onAddToTemplate && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                            onAddToTemplate(serviceRequest);
                          }}
                          className="cursor-pointer"
                        >
                          {t("add_to_template")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {onRemove && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                          onRemove();
                        }}
                        className="text-red-500 cursor-pointer"
                      >
                        {t("remove")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  selected={
                    requester || serviceRequest.service_request.requester
                  }
                  onChange={(user) => {
                    onRequesterChange?.(user);
                    onUpdate?.({ requester: user });
                  }}
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
  questionnaireSlug,
  question,
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

  const [serviceRequestToAddToTemplate, setServiceRequestToAddToTemplate] =
    useState<ServiceRequestApplyActivityDefinitionSpec | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(null);

  const queryClient = useQueryClient();

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: [
      "questionnaire_response_templates",
      questionnaireSlug,
      templateSearchQuery,
    ],
    queryFn: query.debounced(questionnaireResponseTemplateApi.list, {
      queryParams: {
        questionnaire: filterStructuredQuestionnaireSlugs(questionnaireSlug),
        name: templateSearchQuery || undefined,
        facility: facilityId,
        limit: 20,
      },
    }),
    enabled: !!questionnaireSlug && !!serviceRequestToAddToTemplate,
  });

  const addToTemplateMutation = useMutation({
    mutationFn: (params: {
      template: QuestionnaireResponseTemplateReadSpec;
      serviceRequest: ServiceRequestApplyActivityDefinitionSpec;
    }) => {
      const existingServiceRequests =
        params.template.template_data?.activity_definition || [];
      const serviceRequestForTemplate = buildServiceRequestForTemplate(
        params.serviceRequest,
      );

      return mutate(questionnaireResponseTemplateApi.update, {
        pathParams: {
          id: params.template.id!,
        },
      })({
        name: params.template.name,
        description: params.template.description || "",
        template_data: {
          ...params.template.template_data,
          activity_definition: [
            ...existingServiceRequests,
            serviceRequestForTemplate,
          ],
        },
        users: [currentUser.username],
        facility_organizations: selectedOrganizations || [],
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        t("service_request_added_to_template", {
          template: variables.template.name,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ["questionnaire_response_templates", questionnaireSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      setServiceRequestToAddToTemplate(null);
      setTemplateSearchQuery("");
    },
    onError: () => {
      toast.error(t("failed_to_add_to_template"));
    },
  });

  // Mutation for creating a new template with the service request
  const createTemplateWithServiceRequestMutation = useMutation({
    mutationFn: (params: {
      name: string;
      serviceRequest: ServiceRequestApplyActivityDefinitionSpec;
    }) => {
      const serviceRequestForTemplate = buildServiceRequestForTemplate(
        params.serviceRequest,
      );

      return mutate(questionnaireResponseTemplateApi.create)({
        name: params.name,
        description: "",
        ...(questionnaireSlug &&
        questionnaireSlug !== "service_request" &&
        questionnaireSlug !== "medication_request"
          ? { questionnaire: questionnaireSlug }
          : {}),
        facility: facilityId,
        template_data: {
          medication_request: [],
          activity_definition: [serviceRequestForTemplate],
        },
        users: [currentUser.username],
        facility_organizations: selectedOrganizations || [],
      });
    },
    onSuccess: (_, variables) => {
      toast.success(
        t("template_created_with_service_request", {
          template: variables.name,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ["questionnaire_response_templates", questionnaireSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireSlug],
      });
      setServiceRequestToAddToTemplate(null);
      setTemplateSearchQuery("");
      setIsCreatingNewTemplate(false);
      setNewTemplateName("");
    },
  });

  const handleAddToTemplate = (
    serviceRequest: ServiceRequestApplyActivityDefinitionSpec,
  ) => {
    setServiceRequestToAddToTemplate(serviceRequest);
    setIsCreatingNewTemplate(false);
    setNewTemplateName("");
  };

  const handleCreateNewTemplateWithServiceRequest = () => {
    if (!serviceRequestToAddToTemplate || !newTemplateName.trim()) return;
    createTemplateWithServiceRequestMutation.mutate({
      name: newTemplateName.trim(),
      serviceRequest: serviceRequestToAddToTemplate,
    });
  };

  const handleSelectTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (!serviceRequestToAddToTemplate) return;
    addToTemplateMutation.mutate({
      template,
      serviceRequest: serviceRequestToAddToTemplate,
    });
  };

  const handleRequesterChange = (
    index: number,
    user: UserReadMinimal | undefined,
  ) => {
    handleUpdateServiceRequest(index, { requester: user || currentUser });
  };

  const handleApplyRequesterToAll = (user: UserReadMinimal | undefined) => {
    const newServiceRequests = serviceRequests.map((sr) => ({
      ...sr,
      service_request: {
        ...sr.service_request,
        requester: user || currentUser,
      },
    }));

    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handleClearAllRequesters = () => {
    const newServiceRequests = serviceRequests.map((sr) => ({
      ...sr,
      service_request: {
        ...sr.service_request,
        requester: currentUser,
      },
    }));

    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

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

  // Handler for adding a single service request from a template
  const handleAddSingleServiceRequest = async (
    templateSR: ActivityDefinitionTemplateSpec,
  ) => {
    try {
      const activityDefinitionData = await query(
        activityDefinitionApi.retrieveActivityDefinition,
        {
          pathParams: {
            facilityId: facilityId,
            activityDefinitionSlug: templateSR.slug,
          },
        },
      )({ signal: new AbortController().signal });

      // Store the activity definition in the map
      setActivityDefinitionsMap((prev) => ({
        ...prev,
        [templateSR.slug]: activityDefinitionData,
      }));

      const newServiceRequest: ServiceRequestApplyActivityDefinitionSpec = {
        service_request: {
          title:
            templateSR.service_request?.title || activityDefinitionData.title,
          status: templateSR.service_request?.status || Status.active,
          intent: templateSR.service_request?.intent || Intent.order,
          priority: templateSR.service_request?.priority || Priority.routine,
          category:
            templateSR.service_request?.category ||
            activityDefinitionData.classification,
          do_not_perform: templateSR.service_request?.do_not_perform ?? false,
          note: templateSR.service_request?.note || null,
          code: templateSR.service_request?.code || activityDefinitionData.code,
          body_site:
            templateSR.service_request?.body_site ||
            activityDefinitionData.body_site,
          occurance: templateSR.service_request?.occurance || null,
          patient_instruction:
            templateSR.service_request?.patient_instruction || null,
          requester: currentUser,
          locations:
            templateSR.service_request?.locations ||
            activityDefinitionData.locations?.map((location) => location.id) ||
            [],
        },
        activity_definition: templateSR.slug,
        encounter: encounterId,
      };

      const newServiceRequests = [...serviceRequests, newServiceRequest];
      setServiceRequests(newServiceRequests);
      updateQuestionnaireResponseCB(
        [{ type: "service_request", value: newServiceRequests }],
        questionnaireResponse.question_id,
      );
    } catch {
      toast.error(t("failed_to_add_service_request"));
    }
  };

  const handleApplyTemplate = async (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    const templateServiceRequests = template.template_data?.activity_definition;
    if (!templateServiceRequests?.length) {
      toast.info(t("template_has_no_service_requests"));
      throw new Error("Template has no service requests");
    }

    try {
      // Fetch activity definitions for each service request in the template
      const newServiceRequestsPromises = templateServiceRequests.map(
        async (templateSR) => {
          try {
            const activityDefinitionData = await query(
              activityDefinitionApi.retrieveActivityDefinition,
              {
                pathParams: {
                  facilityId: facilityId,
                  activityDefinitionSlug: templateSR.slug,
                },
              },
            )({ signal: new AbortController().signal });

            // Store the activity definition in the map
            setActivityDefinitionsMap((prev) => ({
              ...prev,
              [templateSR.slug]: activityDefinitionData,
            }));

            // Create the service request, merging template data with activity definition
            const newServiceRequest: ServiceRequestApplyActivityDefinitionSpec =
              {
                service_request: {
                  title:
                    templateSR.service_request?.title ||
                    activityDefinitionData.title,
                  status: templateSR.service_request?.status || Status.active,
                  intent: templateSR.service_request?.intent || Intent.order,
                  priority:
                    templateSR.service_request?.priority || Priority.routine,
                  category:
                    templateSR.service_request?.category ||
                    activityDefinitionData.classification,
                  do_not_perform:
                    templateSR.service_request?.do_not_perform ?? false,
                  note: templateSR.service_request?.note || null,
                  code:
                    templateSR.service_request?.code ||
                    activityDefinitionData.code,
                  body_site:
                    templateSR.service_request?.body_site ||
                    activityDefinitionData.body_site,
                  occurance: templateSR.service_request?.occurance || null,
                  patient_instruction:
                    templateSR.service_request?.patient_instruction || null,
                  requester: currentUser,
                  locations:
                    templateSR.service_request?.locations ||
                    activityDefinitionData.locations?.map(
                      (location) => location.id,
                    ) ||
                    [],
                },
                activity_definition: templateSR.slug,
                encounter: encounterId,
              };

            return newServiceRequest;
          } catch {
            // If fetching fails, skip this service request but continue with others
            return null;
          }
        },
      );

      const results = await Promise.all(newServiceRequestsPromises);
      const validServiceRequests = results.filter(
        (sr): sr is ServiceRequestApplyActivityDefinitionSpec => sr !== null,
      );

      if (validServiceRequests.length === 0) {
        toast.error(t("failed_to_apply_template"));
        throw new Error("Failed to apply template - no valid service requests");
      }

      const newServiceRequests = [...serviceRequests, ...validServiceRequests];
      setServiceRequests(newServiceRequests);
      updateQuestionnaireResponseCB(
        [{ type: "service_request", value: newServiceRequests }],
        questionnaireResponse.question_id,
      );

      // Show warning if some service requests failed
      if (validServiceRequests.length < templateServiceRequests.length) {
        toast.warning(
          t("template_partially_applied", {
            applied: validServiceRequests.length,
            total: templateServiceRequests.length,
          }),
        );
      } else {
        toast.success(
          t("template_applied_service_requests", {
            count: validServiceRequests.length,
            name: template.name,
          }),
        );
      }
    } catch (error) {
      toast.error(t("failed_to_apply_template"));
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <QuestionLabel question={question} />
      <AddToTemplateDialog
        open={!!serviceRequestToAddToTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setServiceRequestToAddToTemplate(null);
            setTemplateSearchQuery("");
            setIsCreatingNewTemplate(false);
            setNewTemplateName("");
            setSelectedOrganizations(null);
          }
        }}
        item={serviceRequestToAddToTemplate}
        itemDisplayName={(sr) => sr.service_request.title}
        itemType="service_request"
        isCreatingNewTemplate={isCreatingNewTemplate}
        setIsCreatingNewTemplate={setIsCreatingNewTemplate}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        templateSearchQuery={templateSearchQuery}
        setTemplateSearchQuery={setTemplateSearchQuery}
        templatesData={templatesData}
        isLoadingTemplates={isLoadingTemplates}
        onCreateNewTemplate={handleCreateNewTemplateWithServiceRequest}
        onSelectTemplate={handleSelectTemplate}
        isCreating={createTemplateWithServiceRequestMutation.isPending}
        isAdding={addToTemplateMutation.isPending}
        facilityId={facilityId}
        selectedOrganizations={selectedOrganizations}
        onSelectedOrganizationsChange={setSelectedOrganizations}
      />

      {serviceRequests.map((serviceRequest, index) => (
        <ServiceRequestForm
          key={`${serviceRequest.service_request.code.code}-${index}`}
          serviceRequest={serviceRequest}
          onUpdate={(updates) => handleUpdateServiceRequest(index, updates)}
          onRemove={() => handleRemoveServiceRequest(index)}
          onAddToTemplate={questionnaireSlug ? handleAddToTemplate : undefined}
          disabled={disabled}
          errors={errors}
          questionId={questionnaireResponse.question_id}
          index={index}
          facilityId={facilityId}
          activityDefinition={
            activityDefinitionsMap[serviceRequest.activity_definition]
          }
          requester={serviceRequest.service_request.requester}
          onRequesterChange={(user) => handleRequesterChange(index, user)}
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

      <div className="flex flex-wrap items-center gap-2 w-full">
        <div className="flex-1 min-w-[200px]">
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
              queryParams: { status: Status.active },
            }}
            translationBaseKey="activity_definition"
          />
        </div>
        {serviceRequests.length > 1 && (
          <div className="flex items-center gap-2 border border-gray-400 rounded-md">
            <span className="text-xs font-medium text-gray-800 whitespace-nowrap pl-3">
              {t("requester")}:
            </span>
            <UserSelector
              selected={undefined}
              onChange={handleApplyRequesterToAll}
              facilityId={facilityId}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={disabled}
                >
                  {t("apply_to_all")}
                  <ChevronDown className="size-3" />
                </Button>
              }
              contentAlign="center"
              contentClassName="w-80"
              onClear={handleClearAllRequesters}
            />
          </div>
        )}
        {questionnaireSlug && (
          <ManageResponseTemplatesSheet
            questionnaireSlug={questionnaireSlug}
            facilityId={facilityId}
            onTemplateSelect={handleApplyTemplate}
            onActivityDefinitionSelect={handleAddSingleServiceRequest}
            disabled={disabled}
            key_filter="activity_definition"
            currentActivityDefinitions={serviceRequests.map((sr) => ({
              slug: sr.activity_definition,
              service_request: {
                title: sr.service_request.title,
                status: sr.service_request.status,
                intent: sr.service_request.intent,
                priority: sr.service_request.priority,
                category: sr.service_request.category,
                code: sr.service_request.code,
                do_not_perform: sr.service_request.do_not_perform,
                body_site: sr.service_request.body_site,
                note: sr.service_request.note,
                patient_instruction: sr.service_request.patient_instruction,
                occurance: sr.service_request.occurance,
                locations: sr.service_request.locations,
              },
            }))}
          />
        )}
      </div>
    </div>
  );
}
