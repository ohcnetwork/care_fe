import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronsUpDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import RequirementsSelector from "@/components/Common/RequirementsSelector";
import LocationMultiSelect from "@/components/Location/LocationMultiSelect";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import query from "@/Utils/request/query";
import { Category } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  Intent,
  Priority,
  ServiceRequestApplyActivityDefinitionSpec,
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

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
  facilityId: string;
}

function ServiceRequestForm({
  facilityId,
  serviceRequest,
  onUpdate,
  onRemove,
  onAdd,
  disabled,
  errors,
  questionId,
  index,
  isPreview = false,
}: ServiceRequestFormProps) {
  const { t } = useTranslation();
  const [locationSearch, setLocationSearch] = useState("");
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", locationSearch],
    queryFn: query(locationApi.list, {
      pathParams: {
        facility_id: facilityId,
      },
      queryParams: {
        limit: 100,
        search: locationSearch,
      },
    }),
  });

  if (isPreview) {
    return (
      <div className="rounded-md border border-primary-500 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">
              {serviceRequest.service_request.title}
            </p>
            <span className="text-sm text-gray-500">
              {serviceRequest.service_request.code.display} {" | "}
              {serviceRequest.service_request.code.system} {" | "}
              {serviceRequest.service_request.code.code}
            </span>
          </div>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {t("status")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.status}
              onValueChange={(value: Status) => onUpdate?.({ status: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Status).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.STATUS.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("intent")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.intent}
              onValueChange={(value: Intent) => onUpdate?.({ intent: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_intent")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Intent).map((intent) => (
                  <SelectItem key={intent} value={intent}>
                    {t(intent)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.INTENT.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

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
            <Label>
              {t("category")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.category}
              onValueChange={(value: Category) =>
                onUpdate?.({ category: value })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_category")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Category).map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.CATEGORY.key}
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
            <Label>{t("do_not_perform")}</Label>
            <Select
              value={
                serviceRequest.service_request.do_not_perform ? "true" : "false"
              }
              onValueChange={(value) =>
                onUpdate?.({ do_not_perform: value === "true" })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_option")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("yes")}</SelectItem>
                <SelectItem value="false">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>{t("note")}</Label>
            <Textarea
              value={serviceRequest.service_request.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              placeholder={t("add_notes")}
            />
          </div>

          <div className="rounded-lg border col-span-2 space-y-2 border-gray-200 shadow-sm p-4">
            <Label>{t("locations")}</Label>
            <RequirementsSelector
              title={t("location_requirements")}
              description={t("location_requirements_description")}
              value={serviceRequest.service_request.locations || []}
              onChange={(values) =>
                onUpdate?.({ locations: values as unknown as LocationList[] })
              }
              options={
                locations?.results.map((location: LocationList) => ({
                  label: location.name,
                  value: location.id,
                  details: [
                    {
                      label: t("type"),
                      value: t(`location_form__${location.form}`),
                    },
                    { label: t("status"), value: t(location.status) },
                    {
                      label: t("description"),
                      value: location.description || undefined,
                    },
                  ],
                })) || []
              }
              isLoading={isLoadingLocations}
              placeholder={t("select_locations")}
              onSearch={setLocationSearch}
              customSelector={
                <LocationMultiSelect
                  facilityId={facilityId}
                  value={serviceRequest.service_request.locations || []}
                  onChange={(values) =>
                    onUpdate?.({
                      locations: values as unknown as LocationList[],
                    })
                  }
                />
              }
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
      <div className="rounded-md border border-gray-200">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-1 items-start">
            <p className="text-sm font-semibold">
              {serviceRequest.service_request.title}
            </p>
            <span className="text-sm text-gray-500">
              {serviceRequest.service_request.code.display} {" | "}
              {serviceRequest.service_request.code.system} {" | "}
              {serviceRequest.service_request.code.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="p-4 space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t("status")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.status}
                  onValueChange={(value: Status) =>
                    onUpdate?.({ status: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.STATUS.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("intent")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.intent}
                  onValueChange={(value: Intent) =>
                    onUpdate?.({ intent: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_intent")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Intent).map((intent) => (
                      <SelectItem key={intent} value={intent}>
                        {t(intent)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.INTENT.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

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
                <Label>
                  {t("category")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.category}
                  onValueChange={(value: Category) =>
                    onUpdate?.({ category: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Category).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.CATEGORY.key}
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
                <Label>{t("do_not_perform")}</Label>
                <Select
                  value={
                    serviceRequest.service_request.do_not_perform
                      ? "true"
                      : "false"
                  }
                  onValueChange={(value) =>
                    onUpdate?.({ do_not_perform: value === "true" })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_option")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("yes")}</SelectItem>
                    <SelectItem value="false">{t("no")}</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>{t("note")}</Label>
                <Textarea
                  value={serviceRequest.service_request.note || ""}
                  onChange={(e) => onUpdate?.({ note: e.target.value })}
                  disabled={disabled}
                  placeholder={t("add_notes")}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>{t("locations")}</Label>
                <RequirementsSelector
                  title={t("location_requirements")}
                  description={t("location_requirements_description")}
                  value={serviceRequest.service_request.locations || []}
                  onChange={(values) =>
                    onUpdate?.({
                      locations: values as unknown as LocationList[],
                    })
                  }
                  options={
                    locations?.results.map((location: LocationList) => ({
                      label: location.name,
                      value: location.id,
                      details: [
                        {
                          label: t("type"),
                          value: t(`location_form__${location.form}`),
                        },
                        { label: t("status"), value: t(location.status) },
                        {
                          label: t("description"),
                          value: location.description || undefined,
                        },
                      ],
                    })) || []
                  }
                  isLoading={isLoadingLocations}
                  placeholder={t("select_locations")}
                  onSearch={setLocationSearch}
                  customSelector={
                    <LocationMultiSelect
                      facilityId={facilityId}
                      value={serviceRequest.service_request.locations || []}
                      onChange={(values) =>
                        onUpdate?.({
                          locations: values as unknown as LocationList[],
                        })
                      }
                    />
                  }
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
  const [open, setOpen] = useState(false);
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

  const { data: activityDefinitions } = useQuery({
    queryKey: ["activity_definitions"],
    queryFn: query(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId: facilityId },
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
        activityDefinitionId: selectedActivityDefinition || "",
      },
    }),
    enabled: !!selectedActivityDefinition,
  });

  useEffect(() => {
    if (selectedActivityDefinition && selectedActivityDefinitionData) {
      const selectedAD = activityDefinitions?.results.find(
        (ad) => ad.id === selectedActivityDefinition,
      );
      if (!selectedAD) return;

      const newServiceRequest: ServiceRequestApplyActivityDefinitionSpec = {
        service_request: {
          title: selectedAD.title,
          status: Status.active,
          intent: Intent.order,
          priority: Priority.routine,
          category: selectedAD.category,
          do_not_perform: false,
          note: null,
          code: selectedAD.code,
          body_site: selectedAD.body_site,
          occurance: null,
          patient_instruction: null,
          locations:
            selectedActivityDefinitionData.locations?.map(
              (location) => location.id,
            ) || [],
        },
        activity_definition: selectedActivityDefinition,
        encounter: encounterId,
      };

      setPreviewServiceRequest(newServiceRequest);
      setOpen(false);
    }
  }, [
    selectedActivityDefinition,
    selectedActivityDefinitionData,
    activityDefinitions,
    encounterId,
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
      (sr: ServiceRequestApplyActivityDefinitionSpec, i: number) =>
        i === index
          ? {
              ...sr,
              service_request: {
                ...sr.service_request,
                ...updates,
                locations:
                  (updates.locations as unknown as string[]) ||
                  sr.service_request.locations ||
                  [],
              },
            }
          : sr,
    ) as ServiceRequestApplyActivityDefinitionSpec[];
    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handleActivityDefinitionSelect = (activityDefinitionId: string) => {
    setSelectedActivityDefinition(activityDefinitionId);
  };

  return (
    <div className="space-y-4">
      {serviceRequests.map((serviceRequest, index) => (
        <ServiceRequestForm
          facilityId={facilityId}
          key={serviceRequest.service_request.code.code}
          serviceRequest={serviceRequest}
          onUpdate={(updates) => handleUpdateServiceRequest(index, updates)}
          onRemove={() => handleRemoveServiceRequest(index)}
          onAdd={handleAddServiceRequest}
          disabled={disabled}
          errors={errors}
          questionId={questionnaireResponse.question_id}
          index={index}
        />
      ))}

      {isLoadingSelectedAD && (
        <div className="rounded-md border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
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
          facilityId={facilityId}
          serviceRequest={previewServiceRequest}
          onUpdate={(updates) => {
            setPreviewServiceRequest({
              ...previewServiceRequest,
              service_request: {
                ...previewServiceRequest.service_request,
                ...updates,
                locations: Array.isArray(updates.locations)
                  ? updates.locations.map((loc) =>
                      typeof loc === "string" ? loc : (loc as LocationList).id,
                    )
                  : previewServiceRequest.service_request.locations,
              },
            });
          }}
          onRemove={() => {
            setPreviewServiceRequest(null);
            setSelectedActivityDefinition(null);
          }}
          onAdd={handleAddServiceRequest}
          disabled={disabled}
          isPreview
        />
      )}

      <div className="space-y-2 w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedActivityDefinition
                ? activityDefinitions?.results.find(
                    (ad) => ad.id === selectedActivityDefinition,
                  )?.title
                : t("select_activity_definition")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder={t("search_activity_definitions")}
                className="h-9"
              />
              <CommandEmpty>{t("no_activity_definitions_found")}</CommandEmpty>
              <CommandGroup>
                {activityDefinitions?.results.map((ad) => (
                  <CommandItem
                    key={ad.id}
                    value={ad.id}
                    onSelect={() => {
                      setSelectedActivityDefinition(ad.id);
                      handleActivityDefinitionSelect(ad.id);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedActivityDefinition === ad.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {ad.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
