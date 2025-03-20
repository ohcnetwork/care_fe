import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  SquarePenIcon,
  Tags,
  ViewIcon,
} from "lucide-react";
import { Building, Check, Loader2, X } from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { DebugPreview } from "@/components/Common/DebugPreview";
import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import organizationApi from "@/types/organization/organizationApi";
import {
  EnableWhen,
  Question,
  QuestionType,
  SUPPORTED_QUESTION_TYPES,
  StructuredQuestionType,
} from "@/types/questionnaire/question";
import {
  QuestionStatus,
  QuestionnaireDetail,
  SubjectType,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";
import { ValuesetBase } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

import CloneQuestionnaireSheet from "./CloneQuestionnaireSheet";
import { CodingEditor } from "./CodingEditor";
import ManageQuestionnaireOrganizationsSheet from "./ManageQuestionnaireOrganizationsSheet";
import ManageQuestionnaireTagsSheet from "./ManageQuestionnaireTagsSheet";
import { QuestionnaireForm } from "./QuestionnaireForm";

interface QuestionnaireEditorProps {
  id?: string;
}

const STRUCTURED_QUESTION_TYPES = [
  { value: "allergy_intolerance", label: "Allergy Intolerance" },
  { value: "medication_request", label: "Medication Request" },
  { value: "medication_statement", label: "Medication Statement" },
  { value: "symptom", label: "Symptom" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "encounter", label: "Encounter" },
  { value: "appointment", label: "Appointment" },
] as const;

interface Organization {
  id: string;
  name: string;
  description?: string;
}

interface OrganizationResponse {
  results: Organization[];
}

interface TagResponse {
  results: QuestionnaireTagModel[];
}

interface QuestionnairePropertiesProps {
  questionnaire: QuestionnaireDetail;
  updateQuestionnaireField: <K extends keyof QuestionnaireDetail>(
    field: K,
    value: QuestionnaireDetail[K],
  ) => void;
  id?: string;
  organizations?: OrganizationResponse;
  organizationSelection: {
    selectedIds: string[];
    onToggle: (orgId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    available?: OrganizationResponse;
    isLoading?: boolean;
  };
  tags?: QuestionnaireTagModel[];
  tagSelection: {
    selectedIds: string[];
    onToggle: (tagId: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    available?: TagResponse;
    isLoading?: boolean;
  };
}

function StatusSelector({
  value,
  onChange,
}: {
  value: QuestionStatus;
  onChange: (value: QuestionStatus) => void;
}) {
  return (
    <div className="space-y-2 w-fit">
      <Label htmlFor="status">{t("status")}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex items-center gap-0 border border-gray-300 divide-x rounded-md bg-white [&>div:has([data-state=checked])]:text-primary-500 [&>div:has([data-state=checked])]:bg-primary-200"
      >
        {["active", "draft", "retired"].map((status) => (
          <div
            key={status}
            className={cn(
              "flex items-center px-2 py-1 space-x-2",
              status === "active" && "rounded-l-md",
              status === "retired" && "rounded-r-md",
            )}
          >
            <RadioGroupItem value={status} id={`status-${status}`} />
            <Label
              htmlFor={`status-${status}`}
              className="text-sm font-normal text-gray-950"
            >
              {t(status)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function SubjectTypeSelector({
  value,
  onChange,
}: {
  value: SubjectType;
  onChange: (value: SubjectType) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subject_type">{t("subject_type")}</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="flex w-fit items-center gap-0 border border-gray-300 divide-x rounded-md bg-white [&>div:has([data-state=checked])]:bg-primary-200"
      >
        {[
          { value: "patient", label: "patient" },
          { value: "encounter", label: "encounter" },
        ].map((type) => (
          <div
            key={type.value}
            className={cn(
              "flex items-center px-2 py-1 space-x-2",
              type.value === "patient" && "rounded-l-md",
              type.value === "encounter" && "rounded-r-md",
            )}
          >
            <RadioGroupItem
              value={type.value}
              id={`subject-type-${type.value}`}
            />
            <Label
              htmlFor={`subject-type-${type.value}`}
              className="text-sm font-normal text-gray-950"
            >
              {t(type.label)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function OrganizationSelector({
  id,
  organizations,
  selection,
}: {
  id?: string;
  organizations?: OrganizationResponse;
  selection: QuestionnairePropertiesProps["organizationSelection"];
}) {
  if (id) {
    return (
      <>
        <div className="flex flex-wrap gap-2 mb-2">
          {organizations?.results.map((org) => (
            <Badge
              key={org.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Building className="h-3 w-3" />
              {org.name}
            </Badge>
          ))}
          {(!organizations?.results || organizations.results.length === 0) && (
            <p className="text-sm text-gray-500">
              {t("no_organizations_selected")}
            </p>
          )}
        </div>
        <ManageQuestionnaireOrganizationsSheet
          questionnaireId={id}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Building className="mr-2 h-4 w-4" />
              {t("manage_organizations")}
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selection.selectedIds.length > 0 ? (
          selection.available?.results
            .filter((org) => selection.selectedIds.includes(org.id))
            .map((org) => (
              <Badge
                key={org.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {org.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => selection.onToggle(org.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
        ) : (
          <p className="text-sm text-gray-500">
            {t("no_organizations_selected")}
          </p>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            <span className="truncate">{t("select_organizations")}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("search_organizations")}
              onValueChange={selection.setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{t("no_organizations_found")}</CommandEmpty>
              <CommandGroup>
                {selection.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  selection.available?.results.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.id}
                      onSelect={() => selection.onToggle(org.id)}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{org.name}</span>
                        {org.description && (
                          <span className="text-xs text-gray-500">
                            - {org.description}
                          </span>
                        )}
                      </div>
                      {selection.selectedIds.includes(org.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TagSelector({
  id,
  selection,
  questionnaire,
}: {
  id?: string;
  selection: QuestionnairePropertiesProps["tagSelection"];
  questionnaire: QuestionnaireDetail;
}) {
  if (id) {
    return (
      <>
        <div className="flex flex-wrap gap-2 mb-2">
          {questionnaire.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Building className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
          {questionnaire.tags.length === 0 && (
            <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
          )}
        </div>
        <ManageQuestionnaireTagsSheet
          questionnaire={questionnaire}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Tags className="mr-2 h-4 w-4" />
              {t("manage_tags")}
            </Button>
          }
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selection.selectedIds.length > 0 ? (
          selection.available?.results
            .filter((tag) => selection.selectedIds.includes(tag.id))
            .map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => selection.onToggle(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))
        ) : (
          <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            <span className="truncate">{t("select_tags")}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("search_tags")}
              onValueChange={selection.setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>{t("no_tags_found")}</CommandEmpty>
              <CommandGroup>
                {selection.isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  selection.available?.results.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={() => selection.onToggle(tag.id)}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{tag.name}</span>
                      </div>
                      {selection.selectedIds.includes(tag.id) && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function QuestionnaireProperties({
  questionnaire,
  updateQuestionnaireField,
  id,
  organizations,
  organizationSelection,
  tagSelection,
}: QuestionnairePropertiesProps) {
  return (
    <Card className="border-none bg-transparent shadow-none space-y-4 mt-2 ml-2">
      <CardHeader className="p-0">
        <CardTitle>{t("properties")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <StatusSelector
          value={questionnaire.status}
          onChange={(val) => updateQuestionnaireField("status", val)}
        />

        <SubjectTypeSelector
          value={questionnaire.subject_type}
          onChange={(val) => updateQuestionnaireField("subject_type", val)}
        />

        <div className="space-y-2">
          <Label>
            {t("organizations")} <span className="text-red-500">*</span>
          </Label>
          <OrganizationSelector
            id={id}
            organizations={organizations}
            selection={organizationSelection}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("tags")}</Label>
          <TagSelector
            id={id}
            selection={tagSelection}
            questionnaire={questionnaire}
          />
        </div>
        <CloneQuestionnaireSheet
          questionnaire={questionnaire}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <CareIcon icon="l-copy" className="mr-2 h-4 w-4" />
              {t("clone_questionnaire")}
            </Button>
          }
        />

        <div className="space-y-2">
          <Label htmlFor="version">{t("version")}</Label>
          <Input
            id="version"
            value={questionnaire.version || "0.0.1"}
            disabled={true}
            onChange={(e) =>
              updateQuestionnaireField("version", e.target.value)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

const LAYOUT_OPTIONS = [
  {
    id: "full-width",
    value: "grid grid-cols-1",
    label: "Full Width",
    preview: (
      <div className="space-y-1 w-full">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
      </div>
    ),
  },
  {
    id: "equal-split",
    value: "grid grid-cols-2",
    label: "Equal Split",
    preview: (
      <div className="w-full grid grid-cols-2 gap-1">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
      </div>
    ),
  },
  {
    id: "wide-start",
    value: "grid grid-cols-[2fr,1fr]",
    label: "Wide Start",
    preview: (
      <div className="w-full grid grid-cols-[2fr,1fr] gap-1">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
      </div>
    ),
  },
  {
    id: "wide-end",
    value: "grid grid-cols-[1fr,2fr]",
    label: "Wide End",
    preview: (
      <div className="w-full grid grid-cols-[1fr,2fr] gap-1">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
      </div>
    ),
  },
] as const;

interface LayoutOptionProps {
  option: (typeof LAYOUT_OPTIONS)[number];
  isSelected: boolean;
  questionId: string;
}

function LayoutOptionCard({
  option,
  isSelected,
  questionId,
}: LayoutOptionProps) {
  const optionId = `${questionId}-${option.id}`;
  return (
    <div className="space-y-2">
      <RadioGroupItem
        value={option.value}
        id={optionId}
        className="peer sr-only"
      />
      <Label
        htmlFor={optionId}
        className={cn(
          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50",
          "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
          isSelected && "border-primary",
        )}
      >
        {option.preview}
        <span className="block w-full text-center text-sm font-medium mt-2">
          {option.label}
        </span>
      </Label>
    </div>
  );
}

export default function QuestionnaireEditor({ id }: QuestionnaireEditorProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const {
    data: initialQuestionnaire,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["questionnaireDetail", id],
    queryFn: query(questionnaireApi.detail, {
      pathParams: { id: id! },
    }),
    enabled: !!id,
  });

  const { data: organizations } = useQuery({
    queryKey: ["questionnaire", id, "organizations"],
    queryFn: query(questionnaireApi.getOrganizations, {
      pathParams: { id: id! },
    }),
    enabled: !!id,
  });

  const {
    data: availableOrganizations,
    isLoading: isLoadingAvailableOrganizations,
  } = useQuery({
    queryKey: ["organizations", orgSearchQuery],
    queryFn: query(organizationApi.list, {
      queryParams: {
        org_type: "role",
        name: orgSearchQuery || undefined,
      },
    }),
  });

  const { data: availableTags, isLoading: isLoadingAvailableTags } = useQuery({
    queryKey: ["tags", tagSearchQuery],
    queryFn: query(questionnaireApi.tags.list, {
      queryParams: {
        name: tagSearchQuery || undefined,
      },
    }),
  });

  const { mutate: createQuestionnaire, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireApi.create),
    onSuccess: (data: QuestionnaireDetail) => {
      toast.success("Questionnaire created successfully");
      queryClient.invalidateQueries({ queryKey: ["questionnaireDetail", id] });
      navigate(`/admin/questionnaire/${data.slug}/edit`);
    },
    onError: (_error) => {
      toast.error("Failed to create questionnaire");
    },
  });

  const { mutate: updateQuestionnaire, isPending: isUpdating } = useMutation({
    mutationFn: mutate(questionnaireApi.update, {
      pathParams: { id: id! },
    }),
    onSuccess: () => {
      toast.success("Questionnaire updated successfully");
      queryClient.invalidateQueries({ queryKey: ["questionnaireDetail", id] });
    },
    onError: (_error) => {
      toast.error("Failed to update questionnaire");
    },
  });

  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireDetail | null>(() => {
      if (!id) {
        return {
          id: "",
          title: "",
          description: "",
          status: "draft",
          version: "1.0",
          subject_type: "patient",
          questions: [],
          slug: "",
          tags: [],
        } as QuestionnaireDetail;
      }
      return null;
    });

  useEffect(() => {
    if (initialQuestionnaire) {
      setQuestionnaire(initialQuestionnaire);
    }
  }, [initialQuestionnaire]);

  if (id && isLoading) return <Loading />;
  if (error) {
    return (
      <Alert variant="destructive">
        <CareIcon icon="l-exclamation-circle" className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load questionnaire. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  if (!questionnaire) {
    return (
      <Alert>
        <CareIcon icon="l-info-circle" className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          {t("no_requested_questionnaires_found")}
        </AlertDescription>
      </Alert>
    );
  }

  const updateQuestionnaireField = (
    field: keyof QuestionnaireDetail,
    value: any,
  ) => {
    setQuestionnaire((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = () => {
    if (id) {
      updateQuestionnaire(questionnaire);
    } else {
      createQuestionnaire({
        ...questionnaire,
        organizations: selectedOrgIds,
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/questionnaire");
  };

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleToggleOrganization = (orgId: string) => {
    setSelectedOrgIds((current) =>
      current.includes(orgId)
        ? current.filter((id) => id !== orgId)
        : [...current, orgId],
    );
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {id
              ? t("edit") + " " + questionnaire.title
              : t("create_questionnaire")}
          </h1>
          <p className="text-sm text-gray-500">{questionnaire.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isCreating || isUpdating}>
            <CareIcon icon="l-save" className="mr-2 h-4 w-4" />
            {id ? t("save") : t("create")}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="edit">
            <ViewIcon className="w-4 h-4 mr-2" />
            {t("edit_form")}
          </TabsTrigger>
          <TabsTrigger value="preview">
            <SquarePenIcon className="w-4 h-4 mr-2" />
            {t("form_preview")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="space-y-4 md:w-60">
              <Card className="border-none bg-transparent shadow-none space-y-3 mt-2 md:block hidden">
                <CardHeader className="p-0">
                  <CardTitle>{t("navigation")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {questionnaire.questions.map((question, index) => {
                      const hasSubQuestions =
                        question.type === "group" &&
                        question.questions &&
                        question.questions.length > 0;
                      return (
                        <div key={question.id} className="space-y-1">
                          <button
                            onClick={() => {
                              const element = document.getElementById(
                                `question-${question.id}`,
                              );
                              if (element) {
                                element.scrollIntoView({ behavior: "smooth" });
                                toggleQuestionExpanded(question.id);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2 ${
                              expandedQuestions.has(question.id)
                                ? "bg-accent"
                                : ""
                            }`}
                          >
                            <span className="font-medium text-gray-500">
                              {index + 1}.
                            </span>
                            <span className="flex-1 truncate">
                              {question.text || "Untitled Question"}
                            </span>
                          </button>
                          {hasSubQuestions && question.questions && (
                            <div className="ml-6 border-l-2 border-muted pl-2 space-y-1">
                              {question.questions.map(
                                (subQuestion, subIndex) => (
                                  <button
                                    key={subQuestion.id}
                                    onClick={() => {
                                      const element = document.getElementById(
                                        `question-${subQuestion.id}`,
                                      );
                                      if (element) {
                                        element.scrollIntoView({
                                          behavior: "smooth",
                                        });
                                        toggleQuestionExpanded(question.id);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2"
                                  >
                                    <span className="font-medium text-gray-500">
                                      {index + 1}.{subIndex + 1}
                                    </span>
                                    <span className="flex-1 truncate">
                                      {subQuestion.text || "Untitled Question"}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
              <div className="space-y-4 max-w-sm lg:hidden">
                <QuestionnaireProperties
                  questionnaire={questionnaire}
                  updateQuestionnaireField={updateQuestionnaireField}
                  id={id}
                  organizations={organizations}
                  organizationSelection={{
                    selectedIds: selectedOrgIds,
                    onToggle: handleToggleOrganization,
                    searchQuery: orgSearchQuery,
                    setSearchQuery: setOrgSearchQuery,
                    available: availableOrganizations,
                    isLoading: isLoadingAvailableOrganizations,
                  }}
                  tags={questionnaire.tags}
                  tagSelection={{
                    selectedIds: selectedTagIds,
                    onToggle: handleToggleTag,
                    searchQuery: tagSearchQuery,
                    setSearchQuery: setTagSearchQuery,
                    available: availableTags,
                    isLoading: isLoadingAvailableTags,
                  }}
                />
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t("basic_info")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t("title")}</Label>
                    <Input
                      id="title"
                      value={questionnaire.title}
                      onChange={(e) =>
                        updateQuestionnaireField("title", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">{t("slug")}</Label>
                    <Input
                      id="slug"
                      value={questionnaire.slug}
                      onChange={(e) =>
                        updateQuestionnaireField("slug", e.target.value)
                      }
                      placeholder="unique-identifier-for-questionnaire"
                      className="font-mono"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      A unique URL-friendly identifier for this questionnaire
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="desc">{t("description")}</Label>
                    <Textarea
                      id="desc"
                      value={questionnaire.description || ""}
                      onChange={(e) =>
                        updateQuestionnaireField("description", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="flex flex-row items-center justify-between px-0 py-2">
                  <div>
                    <CardTitle>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        {questionnaire.questions?.length || 0} {t("question")}
                        {questionnaire.questions?.length !== 1 ? "s" : ""}
                      </p>
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newQuestion: Question = {
                        id: crypto.randomUUID(),
                        link_id: `${questionnaire.questions.length + 1}`,
                        text: "New Question",
                        type: "string",
                        questions: [],
                      };
                      updateQuestionnaireField("questions", [
                        ...questionnaire.questions,
                        newQuestion,
                      ]);
                      setExpandedQuestions(
                        (prev) => new Set([...prev, newQuestion.id]),
                      );
                    }}
                  >
                    <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                    {t("add_question")}
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-6">
                    {questionnaire.questions.map((question, index) => (
                      <div
                        key={question.id}
                        id={`question-${question.id}`}
                        className="relative bg-white rounded-lg shadow-md"
                      >
                        <div className="absolute -left-4 top-4 font-medium text-gray-500"></div>
                        <QuestionEditor
                          index={index}
                          key={question.id}
                          question={question}
                          onChange={(updatedQuestion) => {
                            const newQuestions = [...questionnaire.questions];
                            newQuestions[index] = updatedQuestion;
                            updateQuestionnaireField("questions", newQuestions);
                          }}
                          onDelete={() => {
                            const newQuestions = questionnaire.questions.filter(
                              (_, i) => i !== index,
                            );
                            updateQuestionnaireField("questions", newQuestions);
                          }}
                          isExpanded={expandedQuestions.has(question.id)}
                          onToggleExpand={() =>
                            toggleQuestionExpanded(question.id)
                          }
                          depth={0}
                          onMoveUp={() => {
                            if (index > 0) {
                              const newQuestions = [...questionnaire.questions];
                              [newQuestions[index - 1], newQuestions[index]] = [
                                newQuestions[index],
                                newQuestions[index - 1],
                              ];
                              updateQuestionnaireField(
                                "questions",
                                newQuestions,
                              );
                            }
                          }}
                          onMoveDown={() => {
                            if (index < questionnaire.questions.length - 1) {
                              const newQuestions = [...questionnaire.questions];
                              [newQuestions[index], newQuestions[index + 1]] = [
                                newQuestions[index + 1],
                                newQuestions[index],
                              ];
                              updateQuestionnaireField(
                                "questions",
                                newQuestions,
                              );
                            }
                          }}
                          isFirst={index === 0}
                          isLast={index === questionnaire.questions.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4 w-60 hidden lg:block">
              <QuestionnaireProperties
                questionnaire={questionnaire}
                updateQuestionnaireField={updateQuestionnaireField}
                id={id}
                organizations={organizations}
                organizationSelection={{
                  selectedIds: selectedOrgIds,
                  onToggle: handleToggleOrganization,
                  searchQuery: orgSearchQuery,
                  setSearchQuery: setOrgSearchQuery,
                  available: availableOrganizations,
                  isLoading: isLoadingAvailableOrganizations,
                }}
                tags={questionnaire.tags}
                tagSelection={{
                  selectedIds: selectedTagIds,
                  onToggle: handleToggleTag,
                  searchQuery: tagSearchQuery,
                  setSearchQuery: setTagSearchQuery,
                  available: availableTags,
                  isLoading: isLoadingAvailableTags,
                }}
              />
            </div>
          </div>
          <DebugPreview
            data={questionnaire}
            title="Questionnaire"
            className="mt-4"
          />
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{t("preview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionnaireForm
                questionnaireSlug={id}
                patientId="preview"
                subjectType={questionnaire.subject_type}
                encounterId="preview"
                facilityId="preview"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuestionEditorProps {
  index: number;
  question: Question;
  onChange: (updated: Question) => void;
  onDelete: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  depth: number;
  parentId?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function QuestionEditor({
  question,
  onChange,
  onDelete,
  isExpanded,
  onToggleExpand,
  depth,
  parentId,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  index,
}: QuestionEditorProps) {
  const {
    text,
    type,
    structured_type,
    required,
    repeats,
    answer_option,
    questions,
    code,
  } = question;

  const [expandedSubQuestions, setExpandedSubQuestions] = useState<Set<string>>(
    new Set(),
  );

  const [valueSetSearchQuery, setValueSetSearchQuery] = useState("");
  const { data: valuesets, isFetching: isFetchingValuesets } = useQuery({
    queryKey: ["valuesets", valueSetSearchQuery],
    queryFn: query.debounced(valuesetApi.list, {
      queryParams: {
        name: valueSetSearchQuery,
        status: "active",
      },
    }),
    select: (data: PaginatedResponse<ValuesetBase>) => data.results,
  });

  const updateField = <K extends keyof Question>(
    field: K,
    value: Question[K],
    additionalFields?: Partial<Question>,
  ) => {
    onChange({ ...question, [field]: value, ...additionalFields });
  };

  const toggleSubQuestionExpanded = (questionId: string) => {
    setExpandedSubQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const getQuestionPath = () => {
    return parentId ? `${parentId}-${question.id}` : question.id;
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggleExpand}
      className={`rounded-lg p-1 bg-card text-card-foreground`}
    >
      <div className={cn("flex items-center p-2", isExpanded && "bg-gray-50")}>
        <CollapsibleTrigger className="flex-1 flex items-center">
          <div className="flex-1">
            <div className="font-semibold text-left">
              {index + 1}. {text || "Untitled Question"}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{type}</Badge>
              {required && <Badge variant="secondary">{t("required")}</Badge>}
              {repeats && <Badge variant="secondary">{t("repeatable")}</Badge>}
              {type === "group" && questions && questions.length > 0 && (
                <Badge variant="secondary">
                  {t("sub_questions_count", { count: questions.length })}
                </Badge>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronsDownUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <CareIcon icon="l-ellipsis-v" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isFirst && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                {t("move_up")}
              </DropdownMenuItem>
            )}
            {!isLast && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                {t("move_down")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive"
            >
              <CareIcon icon="l-trash-alt" className="mr-2 h-4 w-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="p-2 pt-0 space-y-4 mt-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Question Text</Label>
              <Input
                value={text}
                onChange={(e) => updateField("text", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>Link ID</Label>
              <Input
                value={question.link_id}
                onChange={(e) => updateField("link_id", e.target.value)}
                placeholder="Unique identifier for this question"
              />
            </div>
          </div>

          <div>
            <Label>{t("description")}</Label>
            <Textarea
              value={question.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Additional context or instructions for this question"
              className="h-20"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("type")}</Label>
                <Select
                  value={type}
                  onValueChange={(val: QuestionType) => {
                    if (val !== "group") {
                      updateField("type", val, { questions: [] });
                    } else {
                      updateField("type", val);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "structured" && (
                <div>
                  <Label>{t("structured_type")}</Label>
                  <Select
                    value={structured_type ?? "allergy_intolerance"}
                    onValueChange={(val: StructuredQuestionType) =>
                      updateField("structured_type", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select structured type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURED_QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {type !== "structured" && type !== "group" && (
              <CodingEditor
                code={code}
                onChange={(newCode) => updateField("code", newCode)}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg bg-gray-100 p-4">
              <h3 className="text-sm font-medium mb-2">Question Settings</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure the basic behavior: mark as required, allow multiple
                entries, or set as read only.
              </p>
              <div className="">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={required ?? false}
                      onCheckedChange={(val) => updateField("required", val)}
                      id={`required-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`required-${getQuestionPath()}`}>
                      {t("required")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={repeats ?? false}
                      onCheckedChange={(val) => updateField("repeats", val)}
                      id={`repeats-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`repeats-${getQuestionPath()}`}>
                      {t("repeatable")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.read_only ?? false}
                      onCheckedChange={(val) => updateField("read_only", val)}
                      id={`read_only-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`read_only-${getQuestionPath()}`}>
                      Read Only
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg bg-gray-100 p-4">
              <h3 className="text-sm font-medium mb-2">
                Data Collection Details
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Specify key collection info: time, performer, body site, and
                method.
              </p>
              <div className="">
                <div className="flex flex-wrap gap-4">
                  {type === "group" && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.is_component ?? false}
                        onCheckedChange={(val) =>
                          updateField("is_component", val)
                        }
                        id={`is_component-${getQuestionPath()}`}
                      />
                      <Label htmlFor={`is_component-${getQuestionPath()}`}>
                        {t("is_component")}
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.collect_time ?? false}
                      onCheckedChange={(val) =>
                        updateField("collect_time", val)
                      }
                      id={`collect_time-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`collect_time-${getQuestionPath()}`}>
                      {t("collect_time")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.collect_performer ?? false}
                      onCheckedChange={(val) =>
                        updateField("collect_performer", val)
                      }
                      id={`collect_performer-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`collect_performer-${getQuestionPath()}`}>
                      {t("collect_performer")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.collect_body_site ?? false}
                      onCheckedChange={(val) =>
                        updateField("collect_body_site", val)
                      }
                      id={`collect_body_site-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`collect_body_site-${getQuestionPath()}`}>
                      {t("collect_body_site")}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={question.collect_method ?? false}
                      onCheckedChange={(val) =>
                        updateField("collect_method", val)
                      }
                      id={`collect_method-${getQuestionPath()}`}
                    />
                    <Label htmlFor={`collect_method-${getQuestionPath()}`}>
                      {t("collect_method")}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {type === "group" && (
            <div className="space-y-4">
              <div className="border rounded-lg bg-gray-100 p-4">
                <h3 className="text-sm font-medium mb-2">
                  Group Layout Options
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("choose_layout_style")}
                </p>
                <RadioGroup
                  value={
                    question.styling_metadata?.containerClasses ||
                    LAYOUT_OPTIONS[0].value
                  }
                  onValueChange={(val) => {
                    updateField("styling_metadata", {
                      ...question.styling_metadata,
                      containerClasses: val,
                    });
                  }}
                  className="grid grid-cols-4 gap-4"
                >
                  {LAYOUT_OPTIONS.map((option) => {
                    const currentLayout =
                      question.styling_metadata?.containerClasses;
                    return (
                      <LayoutOptionCard
                        key={option.id}
                        option={option}
                        isSelected={currentLayout === option.value}
                        questionId={getQuestionPath()}
                      />
                    );
                  })}
                </RadioGroup>
              </div>
            </div>
          )}

          {(type === "choice" || type === "quantity") && (
            <div className="space-y-4">
              <Card>
                {question.type === "choice" && (
                  <>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base font-medium">
                          Answer Options
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          Define possible answers for this question
                        </p>
                      </div>
                      <Select
                        value={
                          question.answer_value_set ? "valueset" : "custom"
                        }
                        onValueChange={(val: string) =>
                          updateField(
                            "answer_value_set",
                            val === "custom" ? undefined : "valueset",
                            { answer_option: [] },
                          )
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={t("select_a_value_set")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">
                            {t("custom_options")}
                          </SelectItem>
                          <SelectItem value="valueset">
                            {t("value_set")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                  </>
                )}

                {question.type === "quantity" && (
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base font-medium">
                        Quantity
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        Select the valueset of options for this quantity
                        question
                      </p>
                    </div>
                  </CardHeader>
                )}

                {question.type === "choice" && !question.answer_value_set ? (
                  <CardContent className="space-y-4">
                    {(answer_option || []).map((opt, idx) => (
                      <div
                        key={idx}
                        className="space-y-4 pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Value</Label>
                            <Input
                              value={opt.value}
                              onChange={(e) => {
                                const newOptions = answer_option
                                  ? [...answer_option]
                                  : [];
                                newOptions[idx] = {
                                  ...opt,
                                  value: e.target.value,
                                };
                                updateField("answer_option", newOptions);
                              }}
                              placeholder="Option value"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label>Display Text</Label>
                              <Input
                                value={opt.display || ""}
                                onChange={(e) => {
                                  const newOptions = answer_option
                                    ? [...answer_option]
                                    : [];
                                  newOptions[idx] = {
                                    ...opt,
                                    display: e.target.value,
                                  };
                                  updateField("answer_option", newOptions);
                                }}
                                placeholder="Display text (optional)"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => {
                                const newOptions = answer_option?.filter(
                                  (_, i) => i !== idx,
                                );
                                updateField("answer_option", newOptions);
                              }}
                            >
                              <CareIcon icon="l-times" className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOption = { value: "" };
                        const newOptions = answer_option
                          ? [...answer_option, newOption]
                          : [newOption];
                        updateField("answer_option", newOptions);
                      }}
                    >
                      <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                      {t("add_option")}
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="space-y-4">
                    <Autocomplete
                      options={(valuesets ?? []).map((valueset) => ({
                        label: valueset.name,
                        value: valueset.slug,
                      }))}
                      value={
                        question.answer_value_set === "valueset"
                          ? ""
                          : (question.answer_value_set ?? "")
                      }
                      onChange={(val: string) =>
                        updateField("answer_value_set", val)
                      }
                      onSearch={setValueSetSearchQuery}
                      placeholder={t("select_a_value_set")}
                      isLoading={isFetchingValuesets}
                      noOptionsMessage={t("no_valuesets_found")}
                    />
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {type === "group" && (
            <div className="bg-gray-100 rounded-lg p-1">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-950 font-semibold">
                  {question.questions?.length || 0} Sub-Question
                  {question.questions?.length !== 1 ? "s " : " "}
                  (for the "{text}" Group)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="underline text-gray-950 font-semibold"
                  onClick={() => {
                    const newQuestion: Question = {
                      id: crypto.randomUUID(),
                      link_id: `Q-${Date.now()}`,
                      text: "New Sub-Question",
                      type: "string",
                      questions: [],
                    };
                    updateField("questions", [
                      ...(questions || []),
                      newQuestion,
                    ]);
                    setExpandedSubQuestions(
                      (prev) => new Set([...prev, newQuestion.id]),
                    );
                  }}
                >
                  <CareIcon icon="l-plus" className="h-4 w-4" />
                  {t("add_sub_question")}
                </Button>
              </div>
              <div className="space-y-4">
                {(questions || []).map((subQuestion, idx) => (
                  <div
                    key={subQuestion.id}
                    id={`question-${subQuestion.id}`}
                    className="relative bg-white rounded-lg shadow-md"
                  >
                    <QuestionEditor
                      index={idx}
                      key={subQuestion.id}
                      question={subQuestion}
                      onChange={(updated) => {
                        const newQuestions = [...(questions || [])];
                        newQuestions[idx] = updated;
                        updateField("questions", newQuestions);
                      }}
                      onDelete={() => {
                        const newQuestions = questions?.filter(
                          (_, i) => i !== idx,
                        );
                        updateField("questions", newQuestions);
                      }}
                      isExpanded={expandedSubQuestions.has(subQuestion.id)}
                      onToggleExpand={() =>
                        toggleSubQuestionExpanded(subQuestion.id)
                      }
                      depth={depth + 1}
                      parentId={getQuestionPath()}
                      onMoveUp={() => {
                        if (idx > 0) {
                          const newQuestions = [...(questions || [])];
                          [newQuestions[idx - 1], newQuestions[idx]] = [
                            newQuestions[idx],
                            newQuestions[idx - 1],
                          ];
                          updateField("questions", newQuestions);
                        }
                      }}
                      onMoveDown={() => {
                        if (idx < (questions?.length || 0) - 1) {
                          const newQuestions = [...(questions || [])];
                          [newQuestions[idx], newQuestions[idx + 1]] = [
                            newQuestions[idx + 1],
                            newQuestions[idx],
                          ];
                          updateField("questions", newQuestions);
                        }
                      }}
                      isFirst={idx === 0}
                      isLast={idx === (questions?.length || 0) - 1}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Label>Enable When Conditions</Label>
            <div className="space-y-2">
              {(question.enable_when || []).length > 0 && (
                <div>
                  <Label className="text-xs">Enable Behavior</Label>
                  <Select
                    value={question.enable_behavior ?? "all"}
                    onValueChange={(val: "all" | "any") =>
                      updateField("enable_behavior", val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All conditions must be met
                      </SelectItem>
                      <SelectItem value="any">
                        Any condition must be met
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(question.enable_when || []).map((condition, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2fr,1fr,2fr] gap-2 items-start"
                >
                  <div>
                    <Label className="text-xs">Question</Label>
                    <Input
                      value={condition.question}
                      onChange={(e) => {
                        const newConditions = [...(question.enable_when || [])];
                        newConditions[idx] = {
                          ...condition,
                          question: e.target.value,
                        };
                        updateField("enable_when", newConditions);
                      }}
                      placeholder="Question Link ID"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(
                        val:
                          | "equals"
                          | "not_equals"
                          | "exists"
                          | "greater"
                          | "less"
                          | "greater_or_equals"
                          | "less_or_equals",
                      ) => {
                        const newConditions = [...(question.enable_when || [])];

                        switch (val) {
                          case "greater":
                          case "less":
                          case "greater_or_equals":
                          case "less_or_equals":
                            newConditions[idx] = {
                              question: condition.question,
                              operator: val,
                              answer: 0,
                            };
                            break;
                          case "exists":
                            newConditions[idx] = {
                              question: condition.question,
                              operator: val,
                              answer: true,
                            };
                            break;
                          case "equals":
                          case "not_equals":
                            newConditions[idx] = {
                              question: condition.question,
                              operator: val,
                              answer: "",
                            };
                            break;
                        }

                        updateField("enable_when", newConditions);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater">Greater Than</SelectItem>
                        <SelectItem value="less">Less Than</SelectItem>
                        <SelectItem value="greater_or_equals">
                          Greater Than or Equal
                        </SelectItem>
                        <SelectItem value="less_or_equals">
                          Less Than or Equal
                        </SelectItem>
                        <SelectItem value="exists">Exists</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Answer</Label>
                      {condition.operator === "exists" ? (
                        <Select
                          value={condition.answer ? "true" : "false"}
                          onValueChange={(val: "true" | "false") => {
                            const newConditions = [
                              ...(question.enable_when || []),
                            ];
                            newConditions[idx] = {
                              question: condition.question,
                              operator: "exists" as const,
                              answer: val === "true",
                            };
                            updateField("enable_when", newConditions);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">{t("true")}</SelectItem>
                            <SelectItem value="false">{t("false")}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.answer?.toString() ?? ""}
                          type={
                            [
                              "greater",
                              "less",
                              "greater_or_equals",
                              "less_or_equals",
                            ].includes(condition.operator)
                              ? "number"
                              : "text"
                          }
                          onChange={(e) => {
                            const newConditions = [
                              ...(question.enable_when || []),
                            ];
                            const value = e.target.value;
                            let newCondition;

                            if (
                              [
                                "greater",
                                "less",
                                "greater_or_equals",
                                "less_or_equals",
                              ].includes(condition.operator)
                            ) {
                              newCondition = {
                                question: condition.question,
                                operator: condition.operator as
                                  | "greater"
                                  | "less"
                                  | "greater_or_equals"
                                  | "less_or_equals",
                                answer: Number(value),
                              };
                            } else {
                              newCondition = {
                                question: condition.question,
                                operator: condition.operator as
                                  | "equals"
                                  | "not_equals",
                                answer: value,
                              };
                            }

                            newConditions[idx] = newCondition;
                            updateField("enable_when", newConditions);
                          }}
                          placeholder="Answer value"
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-5"
                      onClick={() => {
                        const newConditions = question.enable_when?.filter(
                          (_, i) => i !== idx,
                        );
                        updateField("enable_when", newConditions);
                      }}
                    >
                      <CareIcon icon="l-times" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newCondition: EnableWhen = {
                    question: "",
                    operator: "equals",
                    answer: "",
                  };
                  updateField("enable_when", [
                    ...(question.enable_when || []),
                    newCondition,
                  ]);
                }}
              >
                <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                {t("add_condition")}
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
