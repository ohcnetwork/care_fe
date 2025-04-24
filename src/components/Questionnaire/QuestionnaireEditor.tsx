import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  SquarePenIcon,
  ViewIcon,
} from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  STRUCTURED_QUESTIONS,
  StructuredQuestionType,
} from "@/components/Questionnaire/data/StructuredFormData";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError, PaginatedResponse } from "@/Utils/request/types";
import organizationApi from "@/types/organization/organizationApi";
import {
  EnableWhen,
  Question,
  QuestionType,
  SUPPORTED_QUESTION_TYPES,
} from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";
import { ValuesetBase } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

import { CodingEditor } from "./CodingEditor";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireProperties } from "./QuestionnaireProperties";

interface QuestionnaireEditorProps {
  id?: string;
}
interface Organization {
  id: string;
  name: string;
  description?: string;
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
    value: "grid grid-cols-[2fr_1fr]",
    label: "Wide Start",
    preview: (
      <div className="w-full grid grid-cols-[2fr_1fr] gap-1">
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
        <div className="h-2 w-full bg-gray-200 rounded" />
      </div>
    ),
  },
  {
    id: "wide-end",
    value: "grid grid-cols-[1fr_2fr]",
    label: "Wide End",
    preview: (
      <div className="w-full grid grid-cols-[1fr_2fr] gap-1">
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
          "flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedOrgs, setSelectedOrgs] = useState<Organization[]>([]);
  const [selectedTags, setSelectedTags] = useState<QuestionnaireTagModel[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [orgError, setOrgError] = useState<string | undefined>();
  const [importUrl, setImportUrl] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState<QuestionnaireDetail | null>(
    null,
  );
  const queryClient = useQueryClient();
  const [structuredTypeErrors, setStructuredTypeErrors] = useState<
    Record<string, string | undefined>
  >({});

  const handleOnErrors = (error: HTTPError, fallbackMessage: string) => {
    const errorData = (
      error as {
        cause?: { errors: { msg: string; loc?: (string | number)[] }[] };
      }
    )?.cause;

    if (!errorData?.errors) {
      toast.error(fallbackMessage);
      return;
    }

    errorData.errors.forEach((er) => {
      let fieldPath = er.loc?.join(" > ");
      if (er.loc?.includes("questions")) {
        const questionIndices: number[] = [];

        for (let i = 0; i < er.loc.length; i++) {
          if (er.loc[i] === "questions" && typeof er.loc[i + 1] === "number") {
            questionIndices.push(Number(er.loc[i + 1]) + 1);
          }
        }

        if (questionIndices.length > 0) {
          fieldPath = `Question ${questionIndices.join(".")}`;
        }
      }

      const message = fieldPath ? `Error in ${fieldPath}: ${er.msg}` : er.msg;
      toast.error(message);
    });

    toast.error(fallbackMessage);
  };

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

  // This useMemo will automatically include the new tag in options
  const tagOptions = useMemo(() => {
    if (!availableTags?.results) return selectedTags;
    if (tagSearchQuery) return availableTags.results;

    const availableSlugs = new Set(
      availableTags.results.map((tag) => tag.slug),
    );

    // Add selected tags that aren't in availableTags
    const selectedNotInAvailable = selectedTags.filter(
      (selectedTag) => !availableSlugs.has(selectedTag.slug),
    );

    return [...availableTags.results, ...selectedNotInAvailable];
  }, [availableTags, selectedTags, tagSearchQuery]);

  const { mutate: createQuestionnaire, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireApi.create, {
      silent: true,
    }),
    onSuccess: (data: QuestionnaireDetail) => {
      toast.success(t("questionnaire_created_successfully"));
      queryClient.invalidateQueries({ queryKey: ["questionnaireDetail", id] });
      navigate(`/admin/questionnaire/${data.slug}/edit`);
    },
    onError: (error) =>
      handleOnErrors(error, t("failed_to_create_questionnaire")),
  });

  const { mutate: updateQuestionnaire, isPending: isUpdating } = useMutation({
    mutationFn: mutate(questionnaireApi.update, {
      pathParams: { id: id! },
      silent: true,
    }),
    onSuccess: (data: QuestionnaireDetail) => {
      toast.success(t("questionnaire_updated_successfully"));
      navigate(`/admin/questionnaire/${data.slug}/edit`);
      queryClient.invalidateQueries({ queryKey: ["questionnaireDetail", id] });
    },
    onError: (error) =>
      handleOnErrors(error, t("failed_to_update_questionnaire")),
  });

  const { mutate: importQuestionnaire, isPending: isImporting } = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch questionnaire");
      return response.json();
    },
    onSuccess: (data) => {
      setImportedData(data);
      toast.success(t("questionnaire_imported_successfully"));
    },
    onError: () => {
      toast.error(t("failed_to_import_questionnaire"));
    },
  });

  const urlSchema = z.string().url(t("please enter a valid url"));

  const QuestionnaireFormPartialSchema = z.object({
    title: z.string().trim().min(1, t("field_required")),
    slug: z
      .string()
      .trim()
      .min(5, t("character_count_validation", { min: 5, max: 25 }))
      .max(25, t("character_count_validation", { min: 5, max: 25 }))
      .regex(/^[-\w]+$/, {
        message: t("slug_format_message"),
      }),
    description: z.string().optional(),
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

  const form = useForm({
    resolver: zodResolver(QuestionnaireFormPartialSchema),
    defaultValues: {
      title: questionnaire?.title ?? "",
      slug: questionnaire?.slug ?? "",
      description: questionnaire?.description ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialQuestionnaire) {
      setQuestionnaire(initialQuestionnaire);
      form.reset({
        title: initialQuestionnaire.title || "",
        slug: initialQuestionnaire.slug || "",
        description: initialQuestionnaire.description || "",
      });
    }
  }, [initialQuestionnaire]);

  if (id && isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <CareIcon icon="l-exclamation-circle" className="size-4" />
        <AlertTitle>{t("error")}</AlertTitle>
        <AlertDescription>{t("questionniare_load_error")}</AlertDescription>
      </Alert>
    );
  }
  if (!questionnaire) {
    return (
      <Alert>
        <CareIcon icon="l-info-circle" className="size-4" />
        <AlertTitle>{t("not_found")}</AlertTitle>
        <AlertDescription>
          {t("no_requested_questionnaires_found")}
        </AlertDescription>
      </Alert>
    );
  }

  const updateQuestionnaireField = (
    field: keyof QuestionnaireDetail,
    value: unknown,
  ) => {
    setQuestionnaire((prev) => (prev ? { ...prev, [field]: value } : null));
  };
  const handleValidatedChange = (
    field: keyof typeof questionnaire,
    value: string | undefined,
  ) => {
    updateQuestionnaireField(field, value);
    form.setValue(field as "title" | "description" | "slug", value, {
      shouldValidate: true,
    });
  };

  const validateOrganizations = (): boolean => {
    if (id) {
      if (!organizations?.results || organizations.results.length === 0) {
        setOrgError(t("organization_selection_required"));
        return false;
      }
      return true;
    }
    if (selectedOrgs.length === 0) {
      setOrgError(t("organization_selection_required"));
      return false;
    }
    setOrgError(undefined);
    return true;
  };

  const validateStructuredType = (): boolean => {
    let hasError = false;
    const updatedErrors: Record<string, string | undefined> = {};

    questionnaire.questions.forEach((q) => {
      if (q.type === "structured" && !q.structured_type) {
        updatedErrors[q.id] = t("field_required");
        hasError = true;
      } else {
        updatedErrors[q.id] = undefined;
      }
    });

    setStructuredTypeErrors(updatedErrors);

    return !hasError;
  };

  const handleSave = async () => {
    const isValid = await form.trigger();
    const hasOrganizations = validateOrganizations();
    const hasValidStructuredType = validateStructuredType();

    if (!isValid || !hasOrganizations || !hasValidStructuredType) {
      return;
    }

    if (id) {
      updateQuestionnaire(questionnaire);
    } else {
      createQuestionnaire({
        ...questionnaire,
        organizations: selectedOrgs.map((o) => o.id),
        tags: selectedTags.map((t) => t.id),
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/questionnaire");
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(questionnaire, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${questionnaire.slug || "questionnaire"}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = async () => {
    if (!importUrl) {
      toast.error(t("url_required"));
      return;
    }

    try {
      urlSchema.parse(importUrl);
      importQuestionnaire(importUrl);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleImportConfirm = () => {
    if (!importedData) return;

    // Map only the necessary fields, ignoring id, created_by, tags etc.
    const mappedData: Partial<QuestionnaireDetail> = {
      title: importedData.title,
      description: importedData.description,
      status: "draft",
      version: "1.0",
      subject_type: importedData.subject_type || "patient",
      questions:
        importedData.questions?.map((q: Question) => ({
          ...q,
          id: crypto.randomUUID(), // Generate new IDs for questions
          questions: q.questions?.map((sq: Question) => ({
            ...sq,
            id: crypto.randomUUID(), // Generate new IDs for sub-questions
          })),
        })) || [],
      slug: importedData.slug,
    };

    setQuestionnaire({
      ...questionnaire,
      ...mappedData,
    } as QuestionnaireDetail);
    form.reset({
      title: mappedData.title || "",
      slug: mappedData.slug || "",
      description: mappedData.description || "",
    });

    setShowImportDialog(false);
    setImportUrl("");
    setImportedData(null);
    toast.success(t("questionnaire_imported_successfully"));
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
    const newOrg = availableOrganizations?.results.find((o) => o.id === orgId);
    setSelectedOrgs((current) => {
      const newSelection = current.some((o) => o.id === orgId)
        ? current.filter((o) => o.id !== orgId)
        : newOrg
          ? [...current, newOrg]
          : current;

      // Clear error if at least one organization is selected
      if (newSelection.length > 0) {
        setOrgError(undefined);
      }

      return newSelection;
    });
  };

  const handleToggleTag = (tagId: string) => {
    const newTag = tagOptions.find((t) => t.id === tagId);
    const newAdded = newTag ? [...selectedTags, newTag] : selectedTags;
    setSelectedTags((current) =>
      current.some((t) => t.id === tagId)
        ? current.filter((t) => t.id !== tagId)
        : newAdded,
    );
  };

  const handleTagCreated = (tag: QuestionnaireTagModel) => {
    setSelectedTags((current) => [...current, tag]);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {id
              ? t("edit") + " " + questionnaire.title
              : t("create_questionnaire")}
          </h1>
          <p className="text-sm text-gray-500">{questionnaire.description}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("cancel")}
          </Button>
          {id && (
            <Button variant="outline" onClick={handleDownload}>
              <CareIcon icon="l-import" className="mr-1 size-4" />
              {t("download")}
            </Button>
          )}
          {!id && (
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <CareIcon icon="l-import" className="mr-1 size-4" />
              {t("import_from_url")}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isCreating || isUpdating}>
            <CareIcon icon="l-save" className="mr-2 size-4" />
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
            <ViewIcon className="size-4" />
            {t("edit_form")}
          </TabsTrigger>
          <TabsTrigger value="preview">
            <SquarePenIcon className="size-4" />
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
                                element.scrollIntoView();
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
                              {question.text || t("untitled_question")}
                            </span>
                          </button>
                          {hasSubQuestions && question.questions && (
                            <div className="ml-6 border-l-2 border-gray-200 pl-2 space-y-1">
                              {question.questions.map(
                                (subQuestion, subIndex) => (
                                  <button
                                    key={subQuestion.id}
                                    onClick={() => {
                                      if (!expandedQuestions.has(question.id)) {
                                        toggleQuestionExpanded(question.id);
                                        setTimeout(() => {
                                          const element =
                                            document.getElementById(
                                              `question-${subQuestion.id}`,
                                            );
                                          if (element) {
                                            element.scrollIntoView();
                                          }
                                        }, 100);
                                      } else {
                                        const element = document.getElementById(
                                          `question-${subQuestion.id}`,
                                        );
                                        if (element) {
                                          element.scrollIntoView();
                                        }
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent flex items-center gap-2 hover:bg-gray-200 "
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
                    selectedOrgs: selectedOrgs,
                    onToggle: handleToggleOrganization,
                    searchQuery: orgSearchQuery,
                    setSearchQuery: setOrgSearchQuery,
                    available: availableOrganizations,
                    isLoading: isLoadingAvailableOrganizations,
                    error: orgError,
                    setError: setOrgError,
                  }}
                  tags={questionnaire.tags}
                  tagSelection={{
                    selectedTags: selectedTags,
                    onToggle: handleToggleTag,
                    searchQuery: tagSearchQuery,
                    setSearchQuery: setTagSearchQuery,
                    available: tagOptions,
                    isLoading: isLoadingAvailableTags,
                    onTagCreated: !id ? handleTagCreated : undefined,
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
                  <Form {...form}>
                    <form className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("title")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("enter_title")}
                                {...field}
                                onChange={(e) =>
                                  handleValidatedChange("title", e.target.value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("slug")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="unique-identifier-for-questionnaire"
                                {...field}
                                onChange={(e) =>
                                  handleValidatedChange("slug", e.target.value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500 mt-1">
                              A unique URL-friendly identifier for this
                              questionnaire
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("description")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t("enter_description")}
                                {...field}
                                onChange={(e) =>
                                  handleValidatedChange(
                                    "description",
                                    e.target.value,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="flex flex-row items-center justify-between px-0 py-2">
                  <div>
                    <CardTitle>
                      <p className="text-sm text-gray-700 font-medium mt-1">
                        {(questionnaire.questions?.length || 0) > 1
                          ? t("questions")
                          : t("question")}
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
                    <CareIcon icon="l-plus" className="mr-2 size-4" />
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
                          structuredTypeError={
                            structuredTypeErrors[question.id]
                          }
                          setStructuredTypeError={(error) => {
                            setStructuredTypeErrors((prev) => ({
                              ...prev,
                              [question.id]: error,
                            }));
                          }}
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
                  selectedOrgs: selectedOrgs,
                  onToggle: handleToggleOrganization,
                  searchQuery: orgSearchQuery,
                  setSearchQuery: setOrgSearchQuery,
                  available: availableOrganizations,
                  isLoading: isLoadingAvailableOrganizations,
                  error: orgError,
                  setError: setOrgError,
                }}
                tags={questionnaire.tags}
                tagSelection={{
                  selectedTags: selectedTags,
                  onToggle: handleToggleTag,
                  searchQuery: tagSearchQuery,
                  setSearchQuery: setTagSearchQuery,
                  available: tagOptions,
                  isLoading: isLoadingAvailableTags,
                  onTagCreated: handleTagCreated,
                }}
              />
            </div>
          </div>
          <DebugPreview
            data={questionnaire}
            title={t("questionnaire")}
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
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("import_questionnaire")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("questionnaire_json_url")}</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder={t("questionnaire_json_url_placeholder")}
              />
            </div>
            {importedData && (
              <div className="space-y-2">
                <Label>{t("preview")}</Label>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">{importedData.title}</p>
                  <p className="text-sm text-gray-500">
                    {importedData.description}
                  </p>
                  <p className="text-sm mt-2">
                    {t("questions_count")} :{" "}
                    {importedData.questions?.length || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              {t("cancel")}
            </Button>
            {!importedData ? (
              <Button
                onClick={handleImport}
                disabled={!importUrl || isImporting}
              >
                {isImporting ? t("importing") : t("import")}
              </Button>
            ) : (
              <Button onClick={handleImportConfirm}>{t("import_form")}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  structuredTypeError?: string;
  setStructuredTypeError?: (error: string | undefined) => void;
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
  structuredTypeError,
  setStructuredTypeError,
}: QuestionEditorProps) {
  const { t } = useTranslation();
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
              {index + 1}. {text || t("untitled_question")}
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
            <ChevronsDownUp className="size-4 text-gray-500" />
          ) : (
            <ChevronsUpDown className="size-4 text-gray-500" />
          )}
        </CollapsibleTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <CareIcon icon="l-ellipsis-v" className="size-4" />
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
                <ChevronUp className="mr-2 size-4" />
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
                <ChevronDown className="mr-2 size-4" />
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
              <CareIcon icon="l-trash-alt" className="mr-2 size-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="p-2 pt-0 space-y-4 mt-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>{t("question_text")}</Label>
              <Input
                value={text}
                onChange={(e) => updateField("text", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label>{t("link_id")}</Label>
              <Input
                value={question.link_id}
                onChange={(e) => updateField("link_id", e.target.value)}
                placeholder={t("link_id_placeholder")}
              />
            </div>
          </div>

          <div>
            <Label>{t("description")}</Label>
            <Textarea
              value={question.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder={t("question_description_placeholder")}
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
                    <SelectValue placeholder={t("question_type_placeholder")}>
                      {
                        SUPPORTED_QUESTION_TYPES.find((t) => t.value === type)
                          ?.name
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {SUPPORTED_QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start">
                          <span>{type.name}</span>
                          <span className="text-xs max-w-xs text-muted-foreground whitespace-normal">
                            {t(type.description)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "structured" && (
                <div>
                  <Label>{t("structured_type")}</Label>
                  <Select
                    value={structured_type || ""}
                    onValueChange={(val: StructuredQuestionType) => {
                      updateField("structured_type", val);
                      if (setStructuredTypeError) {
                        setStructuredTypeError(undefined);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("question_structured_type_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {STRUCTURED_QUESTIONS.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {structuredTypeError && (
                    <p className="text-sm text-red-500 mt-1">
                      {structuredTypeError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {type !== "structured" && (
              <CodingEditor
                code={code}
                onChange={(newCode) => updateField("code", newCode)}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="border rounded-lg border-gray-200 bg-gray-100 p-4">
              <h3 className="text-sm font-medium mb-2">
                {t("question_settings")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("question_settings_description")}
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
                      {t("read_only")}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg bg-gray-100 p-4">
              <h3 className="text-sm font-medium mb-2">
                {t("data_collection_details")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("data_collection_details_description")}
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
              <div className="border border-gray-200 rounded-lg bg-gray-100 p-4">
                <h3 className="text-sm font-medium mb-2">
                  {t("group_layout_options")}
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
                          {t("answer_options")}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {t("answer_options_description")}
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
                            {
                              answer_option: [],
                            },
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
                        {t("quantity")}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {t("quantity_question_description")}
                      </p>
                    </div>
                  </CardHeader>
                )}

                {question.type === "choice" && !question.answer_value_set ? (
                  <CardContent className="space-y-4">
                    {(answer_option || []).map((opt, idx) => (
                      <div
                        key={idx}
                        className="space-y-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
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
                              <CareIcon icon="l-times" className="size-4" />
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
                      <CareIcon icon="l-plus" className="mr-2 size-4" />
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
                  {t("sub_questions_for_group", { group: text })}
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
                  <CareIcon icon="l-plus" className="size-4" />
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
            <Label>{t("enable_when_conditions")}</Label>
            <div className="space-y-2">
              {(question.enable_when || []).length > 0 && (
                <div>
                  <Label className="text-xs">{t("enable_behavior")}</Label>
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
                        {t("enable_when__all")}
                      </SelectItem>
                      <SelectItem value="any">
                        {t("enable_when__any")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(question.enable_when || []).map((condition, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2fr_1fr_2fr] gap-2 items-start"
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
                      <CareIcon icon="l-times" className="size-4" />
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
                <CareIcon icon="l-plus" className="mr-2 size-4" />
                {t("add_condition")}
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
