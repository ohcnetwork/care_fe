import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AArrowDown,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  SquarePenIcon,
  ViewIcon,
} from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DialogDescription,
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

import { AnimatedWrapper } from "@/components/Common/AnimatedWrapper";
import { DebugPreview } from "@/components/Common/DebugPreview";
import Loading from "@/components/Common/Loading";
import {
  STRUCTURED_QUESTIONS,
  StructuredQuestionType,
} from "@/components/Questionnaire/data/StructuredFormData";

import useDragAndDrop from "@/hooks/useDragAndDrop";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";
import { swapElements } from "@/Utils/request/utils";
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

import { CodingEditor } from "./CodingEditor";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireProperties } from "./QuestionnaireProperties";
import { SelectOrCreateValueset } from "./SelectOrCreateValueset";
import ValueSetSelect from "./ValueSetSelect";

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
          "flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-2 md:p-4 hover:bg-gray-50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
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

const HIDE_REPEATABLE_QUESTION_TYPES = ["boolean", "group", "display"];

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
  const [showFileImportDialog, setShowFileImportDialog] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null,
  );
  const [importedData, setImportedData] = useState<QuestionnaireDetail | null>(
    null,
  );
  const queryClient = useQueryClient();
  const [structuredTypeErrors, setStructuredTypeErrors] = useState<
    Record<string, string | undefined>
  >({});
  const { dragOver, onDragOver, onDragLeave } = useDragAndDrop();
  const [enableWhenDependencies, setEnableWhenDependencies] = useState<
    Map<string, Set<{ question: Question; path: string[] }>>
  >(new Map());
  const [expandPath, setExpandPath] = useState<string[]>([]);

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
    questions: z.array(
      z.object({
        text: z.string().trim().min(1, t("field_required")),
        link_id: z.string().trim().min(1, t("field_required")),
        description: z.string().optional(),
        code: z
          .object({
            system: z.string().optional(),
            code: z.string().optional(),
            display: z.string().optional(),
          })
          .optional(),

        unit: z
          .object({
            system: z.string().optional(),
            code: z.string().optional(),
            display: z.string().optional(),
          })
          .optional(),
      }),
    ),
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
          subject_type: "encounter",
          questions: [],
          slug: "",
          tags: [],
        } as QuestionnaireDetail;
      }
      return null;
    });

  const form = useForm<any>({
    resolver: zodResolver(QuestionnaireFormPartialSchema),
    defaultValues: {
      title: questionnaire?.title ?? "",
      slug: questionnaire?.slug ?? "",
      description: questionnaire?.description ?? "",
      questions: questionnaire?.questions,
      status: questionnaire?.status,
      subject_type: questionnaire?.subject_type,
      version: questionnaire?.version,
      tags: questionnaire?.tags,
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
        questions: initialQuestionnaire.questions,
        status: initialQuestionnaire.status,
        subject_type: initialQuestionnaire.subject_type,
        version: initialQuestionnaire.version,
        tags: initialQuestionnaire.tags,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestionnaire]);

  const rootQuestions: Question[] = useWatch({
    control: form.control,
    name: "questions",
  });

  const tags = useWatch({
    control: form.control,
    name: "tags",
  });

  useEffect(() => {
    if (!rootQuestions) return;
    const newEnableWhenDependencies = new Map<
      string,
      Set<{ question: Question; path: string[] }>
    >();
    const processQuestions = (
      questions: Question[],
      currentPath: string[] = [],
    ) => {
      questions.forEach((question) => {
        question.enable_when?.forEach(({ question: dependentQuestionId }) => {
          const deps =
            newEnableWhenDependencies.get(dependentQuestionId) || new Set();
          deps.add({
            question: question,
            path: [...currentPath, question.link_id],
          });
          newEnableWhenDependencies.set(dependentQuestionId, deps);
        });
        if (question.questions?.length) {
          processQuestions(question.questions, [
            ...currentPath,
            question.link_id,
          ]);
        }
      });
    };

    processQuestions(rootQuestions);
    setEnableWhenDependencies(newEnableWhenDependencies);
  }, [rootQuestions]);

  const handleEnableWhenDependentClick = (path: string[], targetId: string) => {
    const rootQuestionId = path[0];
    toggleQuestionExpanded(rootQuestionId, false);
    setExpandPath(path.slice(1));
    setTimeout(() => {
      const element = document.getElementById(`question-${targetId}`);
      if (element) element.scrollIntoView();
      setExpandPath([]);
    }, 100);
  };

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
    form.setValue(field, value, {
      shouldValidate: false,
    });
  };
  const handleValidatedChange = (
    field: keyof QuestionnaireDetail,
    value: QuestionnaireDetail[keyof QuestionnaireDetail],
  ) => {
    form.setValue(field as "title" | "description" | "slug", value, {
      shouldValidate: true,
    });
  };

  const updateQuestions = (newQuestions: Question[]) => {
    form.setValue("questions", newQuestions, {
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

    rootQuestions.forEach((q) => {
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
    let isValid = await form.trigger();
    const hasOrganizations = validateOrganizations();
    const hasValidStructuredType = validateStructuredType();

    rootQuestions.forEach((question, idx) => {
      if (question.code && !question.code?.display) {
        form.setError(`questions.${idx}.code.display`, {
          type: "manual",
          message: t("code_verification_required"),
        });
        isValid = false;
      }
    });

    if (!isValid || !hasOrganizations || !hasValidStructuredType) {
      return;
    }

    if (id) {
      updateQuestionnaire({
        ...form.getValues(),
        questions: rootQuestions,
      });
    } else {
      createQuestionnaire({
        ...form.getValues(),
        questions: rootQuestions,
        organizations: selectedOrgs.map((o) => o.id),
        tags: selectedTags.map((t) => t.id),
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/questionnaire");
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(form.getValues(), null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${form.getValues("slug") || "questionnaire"}.json`;

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
      subject_type: importedData.subject_type || "encounter",
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
      ...form.getValues(),
      ...mappedData,
    } as QuestionnaireDetail);
    form.reset({
      title: mappedData.title || "",
      slug: mappedData.slug || "",
      description: mappedData.description || "",
      questions: mappedData.questions || [],
    });

    form.trigger();

    setShowImportDialog(false);
    setImportUrl("");
    setImportedData(null);
    toast.success(t("questionnaire_imported_successfully"));
  };

  const toggleQuestionExpanded = (
    questionLinkId: string,
    allowCollapse: boolean = true,
  ) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionLinkId) && allowCollapse) {
        next.delete(questionLinkId);
      } else {
        next.add(questionLinkId);
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
              ? t("edit") + " " + form.watch("title")
              : t("create_questionnaire")}
          </h1>
          <p className="text-sm text-gray-500">{form.watch("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating || isUpdating}
            data-cy="cancel-questionnaire-form"
          >
            {t("cancel")}
          </Button>
          {id && (
            <Button
              variant="outline"
              onClick={handleDownload}
              data-cy="download-questionnaire-form"
            >
              <CareIcon icon="l-import" className="mr-1 size-4" />
              {t("download")}
            </Button>
          )}
          {!id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isCreating || isUpdating}>
                  <CareIcon icon="l-import" className="mr-1 size-4" />
                  {t("import")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                  <CareIcon icon="l-link" className="mr-2 size-4" />
                  {t("import_from_url")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowFileImportDialog(true)}>
                  <CareIcon icon="l-file" className="mr-2 size-4" />
                  {t("import_from_file")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            data-cy="save-questionnaire-form"
          >
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
                    {rootQuestions.map((question, index) => {
                      const hasSubQuestions =
                        question.type === "group" &&
                        question.questions &&
                        question.questions.length > 0;
                      return (
                        <div key={question.link_id} className="space-y-1">
                          <button
                            onClick={() => {
                              const element = document.getElementById(
                                `question-${question.link_id}`,
                              );
                              if (element) {
                                element.scrollIntoView();
                                toggleQuestionExpanded(question.link_id);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center gap-2 ${
                              expandedQuestions.has(question.link_id)
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
                                      if (
                                        !expandedQuestions.has(question.link_id)
                                      ) {
                                        toggleQuestionExpanded(
                                          question.link_id,
                                        );
                                        setTimeout(() => {
                                          const element =
                                            document.getElementById(
                                              `question-${subQuestion.link_id}`,
                                            );
                                          if (element) {
                                            element.scrollIntoView();
                                          }
                                        }, 100);
                                      } else {
                                        const element = document.getElementById(
                                          `question-${subQuestion.link_id}`,
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
                  form={form}
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
                  tags={tags}
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
              <Form {...form}>
                <form>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("basic_info")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
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
                                    handleValidatedChange(
                                      "title",
                                      e.target.value,
                                    )
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
                                    handleValidatedChange(
                                      "slug",
                                      e.target.value,
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-sm text-gray-500 mt-1">
                                {t("unique_url_for_questionnaire")}
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
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-transparent shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between px-0 py-2">
                      <div>
                        <CardTitle>
                          <p className="text-sm text-gray-700 font-medium mt-1">
                            {(rootQuestions?.length || 0) > 1
                              ? t("questions")
                              : t("question")}
                          </p>
                        </CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          const newQuestion: Question = {
                            id: crypto.randomUUID(),
                            link_id: `Q-${Date.now()}`,
                            text: "New Question",
                            type: "string",
                            questions: [],
                          };
                          handleValidatedChange("questions", [
                            ...rootQuestions,
                            newQuestion,
                          ]);
                          setExpandedQuestions(
                            (prev) => new Set([...prev, newQuestion.link_id]),
                          );
                          setTimeout(() => {
                            const element = document.getElementById(
                              `question-${newQuestion.link_id}`,
                            );
                            if (element) {
                              element.scrollIntoView();
                            }
                          }, 100);
                        }}
                      >
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("add_question")}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-6">
                        {rootQuestions.map((question, index) => (
                          <div
                            key={question.id}
                            id={`question-${question.link_id}`}
                            className="relative bg-white rounded-lg shadow-md"
                          >
                            <div className="absolute -left-4 top-4 font-medium text-gray-500"></div>
                            <QuestionEditor
                              index={index}
                              key={question.link_id}
                              question={question}
                              form={form}
                              onChange={(updatedQuestion) => {
                                const newQuestions = rootQuestions.map(
                                  (q, i) => (i === index ? updatedQuestion : q),
                                );
                                updateQuestions(newQuestions);
                              }}
                              onDelete={() => {
                                const newQuestions = rootQuestions.filter(
                                  (_, i) => i !== index,
                                );
                                updateQuestions(newQuestions);
                              }}
                              isExpanded={expandedQuestions.has(
                                question.link_id,
                              )}
                              onToggleExpand={() =>
                                toggleQuestionExpanded(question.link_id)
                              }
                              depth={0}
                              onMoveUp={() => {
                                if (index > 0) {
                                  const newQuestions = swapElements<Question>(
                                    rootQuestions,
                                    index,
                                    index - 1,
                                  );
                                  updateQuestions(newQuestions);
                                }
                              }}
                              onMoveDown={() => {
                                if (index < rootQuestions.length - 1) {
                                  const newQuestions = swapElements<Question>(
                                    rootQuestions,
                                    index,
                                    index + 1,
                                  );
                                  updateQuestions(newQuestions);
                                }
                              }}
                              isFirst={index === 0}
                              isLast={index === rootQuestions.length - 1}
                              structuredTypeError={
                                structuredTypeErrors[question.id]
                              }
                              setStructuredTypeError={(error) => {
                                setStructuredTypeErrors((prev) => ({
                                  ...prev,
                                  [question.id]: error,
                                }));
                              }}
                              enableWhenDependencies={enableWhenDependencies}
                              handleEnableWhenDependentClick={
                                handleEnableWhenDependentClick
                              }
                              expandPath={expandPath}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </div>
            <div className="space-y-4 w-60 hidden lg:block">
              <QuestionnaireProperties
                form={form}
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
                tags={tags}
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
            data={form.getValues()}
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
                subjectType={form.watch("subject_type")}
                encounterId="preview"
                facilityId="preview"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={showImportDialog}
        onOpenChange={(open) => {
          setShowImportDialog(open);
          if (!open) {
            setImportUrl("");
            setImportedData(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("import_questionnaire")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!importedData && (
              <div className="space-y-2">
                <Label>{t("questionnaire_json_url")}</Label>
                <Input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder={t("questionnaire_json_url_placeholder")}
                />
              </div>
            )}
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
              onClick={() => {
                setShowImportDialog(false);
                setImportUrl("");
                setImportedData(null);
              }}
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
      <Dialog
        open={showFileImportDialog}
        onOpenChange={setShowFileImportDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("import_questionnaire")}</DialogTitle>
            <DialogDescription>
              {t("drag_and_drop_or_click_to_select")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 hover:border-gray-300",
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={async (e) => {
                e.preventDefault();
                onDragLeave();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedImportFile(file);
                }
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setSelectedImportFile(file);
                  }
                };
                input.click();
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <CareIcon
                  icon="l-cloud-upload"
                  className="size-12 text-gray-400"
                />
                <p className="text-sm text-gray-500 select-none">
                  {dragOver
                    ? t("drop_file_here")
                    : t("drag_and_drop_or_click_to_select")}
                </p>
                <p className="text-xs text-gray-400 select-none">
                  {t("json_files_only")}
                </p>
              </div>
            </div>
            {selectedImportFile && (
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CareIcon icon="l-file" className="size-4 text-gray-400" />
                  <span className="text-sm">{selectedImportFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedImportFile(null)}
                >
                  <CareIcon icon="l-times" className="size-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFileImportDialog(false);
                setSelectedImportFile(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (selectedImportFile) {
                  try {
                    const content = await selectedImportFile.text();
                    const data = JSON.parse(content);
                    setImportedData(data);
                    setShowFileImportDialog(false);
                    setShowImportDialog(true);
                    setSelectedImportFile(null);
                  } catch (_error) {
                    toast.error(t("failed_to_import_questionnaire"));
                  }
                }
              }}
              disabled={!selectedImportFile}
            >
              {t("continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface QuestionEditorProps {
  form: ReturnType<typeof useForm<any>>;
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
  enableWhenDependencies: Map<
    string,
    Set<{ question: Question; path: string[] }>
  >;
  handleEnableWhenDependentClick: (path: string[], targetId: string) => void;
  expandPath?: string[];
}

function QuestionEditor({
  form,
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
  enableWhenDependencies,
  handleEnableWhenDependentClick,
  expandPath,
}: QuestionEditorProps): React.ReactElement {
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
    unit,
  } = question;

  const rootQuestions = useWatch({
    control: form.control,
    name: "questions",
  }) as Question[];
  // Memoize answer options to ensure unique IDs to avoid unnecessary re-renders in value field of AnwserOption

  const annotatedAnswerOptions = useMemo(() => {
    return (
      answer_option?.map((option: any) => ({
        ...option,
        _id: option._id || crypto.randomUUID(),
      })) || []
    );
  }, [answer_option]);

  const [expandedSubQuestions, setExpandedSubQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [enableWhenQuestionAnswers, setEnableWhenQuestionAnswers] = useState<
    Record<number, Question[]>
  >({});

  const [inputPosition, setInputPosition] = useState("");

  const updateField = <K extends keyof Question>(
    field: K,
    value: Question[K],
    additionalFields?: Partial<Question>,
  ) => {
    onChange({ ...question, [field]: value, ...additionalFields });
  };

  const toggleSubQuestionExpanded = (
    questionLinkId: string,
    allowCollapse: boolean = true,
  ) => {
    setExpandedSubQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionLinkId) && allowCollapse) {
        next.delete(questionLinkId);
      } else {
        next.add(questionLinkId);
      }
      return next;
    });
  };

  const getQuestionPath = () => {
    return parentId ? `${parentId}-${question.id}` : question.id;
  };

  const findQuestionPath = (
    questions: Question[],
    targetId: string,
  ): Question[] | null => {
    const pathStack: [Question, Question[]][] = questions
      .filter((q) => !!q && !!q.text)
      .map((q) => [q, []]);

    while (pathStack.length > 0) {
      const [current, path] = pathStack.pop()!;

      if (current.link_id === targetId) {
        return [...path, current];
      }

      if (
        current.type === "group" &&
        current.questions &&
        current.questions.length > 0
      ) {
        current.questions.forEach((q) => {
          pathStack.push([q, [...path, current]]);
        });
      }
    }
    return null;
  };

  useEffect(() => {
    if (question.enable_when && question.enable_when.length > 0) {
      question.enable_when.forEach((condition, idx) => {
        const path = findQuestionPath(rootQuestions, condition.question);
        if (path) {
          setEnableWhenQuestionAnswers((prev) => ({
            ...prev,
            [idx]: path,
          }));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.enable_when]);

  useEffect(() => {
    if (
      expandPath?.length &&
      expandPath.length > 0 &&
      type === "group" &&
      questions
    ) {
      const nextQuestionId = expandPath[0];
      const hasQuestion = questions.some((q) => q.link_id === nextQuestionId);
      if (hasQuestion) {
        toggleSubQuestionExpanded(nextQuestionId, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandPath]);

  const getOperatorChoices = (index: number) => {
    const currentEnableWhenArr = enableWhenQuestionAnswers[index];
    const currentEnableWhen =
      currentEnableWhenArr?.[currentEnableWhenArr.length - 1];

    switch (currentEnableWhen?.type) {
      case "boolean":
      case "text":
      case "string":
      case "url":
      case "choice":
        return ["equals", "not_equals"];
      default:
        return [
          "equals",
          "not_equals",
          "exists",
          "greater",
          "less",
          "greater_or_equals",
          "less_or_equals",
        ];
    }
  };

  const getAnswerChoices = (index: number, condition: EnableWhen) => {
    const currentEnableWhenArr = enableWhenQuestionAnswers[index];
    const currentEnableWhen =
      currentEnableWhenArr?.[currentEnableWhenArr.length - 1];
    switch (currentEnableWhen?.type) {
      case "boolean": {
        // temp fix for boolean answers in existing questionnaires
        let answer = condition.answer.toString();
        if (answer === "true") {
          answer = "Yes";
        } else if (answer === "false") {
          answer = "No";
        }
        return (
          <Select
            value={answer}
            onValueChange={(val) => {
              const newConditions = [...(question.enable_when || [])];
              newConditions[index] = {
                question: condition.question,
                operator: condition.operator as "equals" | "not_equals",
                answer: val,
              };
              updateField("enable_when", newConditions);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      case "choice":
        return (
          <Select
            value={condition.answer.toString()}
            onValueChange={(val) => {
              const newConditions = [...(question.enable_when || [])];
              newConditions[index] = {
                question: condition.question,
                operator: condition.operator as "equals" | "not_equals",
                answer: val,
              };
              updateField("enable_when", newConditions);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a value" />
            </SelectTrigger>
            <SelectContent>
              {currentEnableWhen.answer_option?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
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
              const newConditions = [...(question.enable_when || [])];
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
                  operator: condition.operator as "equals" | "not_equals",
                  answer: value,
                };
              }

              newConditions[index] = newCondition;
              updateField("enable_when", newConditions);
            }}
            placeholder="Answer value"
          />
        );
    }
  };
  const UNIT_TYPES = ["quantity", "choice", "decimal", "integer"];

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
              <FormField
                control={form.control}
                name={`questions.${index}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("question_text")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={text}
                        onChange={(e) => {
                          updateField("text", e.target.value);
                          form.setValue(
                            `questions.${index}.text`,
                            e.target.value,
                            { shouldValidate: true },
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <FormField
              control={form.control}
              name={`questions.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={question.description || ""}
                      onChange={(e) => {
                        updateField("description", e.target.value);
                        form.setValue(
                          `questions.${index}.description`,
                          e.target.value,
                          { shouldValidate: true },
                        );
                      }}
                      placeholder={t("question_description_placeholder")}
                      className="h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {(enableWhenDependencies.get(question.link_id)?.size || 0) > 0 && (
            <>
              <div className="text-sm text-gray-500 flex flex-col gap-1">
                {t("questionnaire_question_dependent")}
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    enableWhenDependencies.get(question.link_id) || [],
                  ).map(({ question, path }) => (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      key={question.link_id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleEnableWhenDependentClick(path, question.link_id);
                      }}
                      className="text-primary hover:underline"
                    >
                      {question.text}
                    </Button>
                  ))}
                </div>
                {t("ensure_conditions_are_valid")}
              </div>
            </>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2">{t("type")}</Label>
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
                          <span className="text-xs max-w-xs text-gray-500 whitespace-normal">
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
                  <Label className="mb-2">{t("structured_type")}</Label>
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

            {UNIT_TYPES.includes(type) && (
              <FormField
                control={form.control}
                name={`questions.${index}.unit`}
                render={({ field }) => (
                  <FormItem className="pb-4">
                    <FormLabel>{t("unit")}</FormLabel>
                    <FormControl>
                      <ValueSetSelect
                        {...field}
                        system="system-ucum-units"
                        placeholder={t("add_unit")}
                        value={unit}
                        onSelect={(code) => {
                          updateField("unit", code);
                          form.setValue(`questions.${index}.unit`, code, {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {type !== "structured" && (
              <CodingEditor
                code={code}
                form={form}
                questionIndex={index}
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

                  {!HIDE_REPEATABLE_QUESTION_TYPES.includes(question.type) && (
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
                  )}

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
                <p className="text-sm text-gray-500 mb-4">
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
                    <CardHeader className="flex sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:pb-2 flex-col gap-2">
                      <div>
                        <CardTitle className="text-base font-medium ">
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
                  <CardContent className="sm:space-y-4 space-y-3">
                    {annotatedAnswerOptions.length !== 0 && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          type="button"
                          size="sm"
                          onClick={() => {
                            const sorted = annotatedAnswerOptions
                              ? [...annotatedAnswerOptions].sort((a, b) =>
                                  a.value.localeCompare(b.value),
                                )
                              : [];
                            updateField("answer_option", sorted);
                          }}
                        >
                          <AArrowDown className="size-4" />
                          {t("sort_alphabetically")}
                        </Button>
                      </div>
                    )}
                    {annotatedAnswerOptions &&
                      annotatedAnswerOptions.map((opt, idx) => (
                        <AnimatedWrapper key={opt._id} keyValue={opt._id}>
                          <div className="space-y-4 pb-4 border-b border-gray-300 last:border-0 last:pb-0">
                            <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                              <div>
                                <Label className="mb-2">
                                  {idx + 1} {" . "} {t("value")}
                                </Label>
                                <Input
                                  value={opt.value}
                                  onChange={(e) => {
                                    const newOptions = [
                                      ...annotatedAnswerOptions,
                                    ];

                                    newOptions[idx] = {
                                      ...opt,
                                      value: e.target.value,
                                    };
                                    updateField("answer_option", newOptions);
                                  }}
                                  placeholder={t("option_value")}
                                />
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="mb-2">
                                    {t("display_text")}
                                  </Label>
                                  <Input
                                    value={opt.display || ""}
                                    onChange={(e) => {
                                      const newOptions = [
                                        ...annotatedAnswerOptions,
                                      ];
                                      newOptions[idx] = {
                                        ...opt,
                                        display: e.target.value,
                                      };
                                      updateField("answer_option", newOptions);
                                    }}
                                    placeholder={t("display_text_placeholder")}
                                  />
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                    >
                                      <CareIcon
                                        icon="l-ellipsis-v"
                                        className="size-4"
                                      />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold flex items-center gap-1">
                                          <ChevronDown className="size-4" />
                                          {t("move_item")}
                                        </span>
                                        <span className="text-xs font-medium">
                                          {t("position")}{" "}
                                          {inputPosition
                                            ? inputPosition
                                            : idx + 1}
                                        </span>
                                      </div>
                                      <div className="border-b pb-2 mb-2">
                                        <div className="font-semibold text-xs text-gray-500 mb-1">
                                          {t("quick_actions")}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={idx === 0}
                                            onClick={() => {
                                              if (idx > 0) {
                                                const newOptions = swapElements(
                                                  annotatedAnswerOptions,
                                                  idx,
                                                  idx - 1,
                                                );
                                                updateField(
                                                  "answer_option",
                                                  newOptions,
                                                );
                                              }
                                            }}
                                          >
                                            ↑ {t("move_up")}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                              idx ===
                                              annotatedAnswerOptions.length - 1
                                            }
                                            onClick={() => {
                                              if (
                                                idx <
                                                annotatedAnswerOptions.length -
                                                  1
                                              ) {
                                                const newOptions = swapElements(
                                                  annotatedAnswerOptions,
                                                  idx,
                                                  idx + 1,
                                                );
                                                updateField(
                                                  "answer_option",
                                                  newOptions,
                                                );
                                              }
                                            }}
                                          >
                                            ↓ {t("move_down")}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={idx === 0}
                                            onClick={() => {
                                              if (idx > 0) {
                                                const newOptions = [
                                                  ...annotatedAnswerOptions,
                                                ];
                                                const [item] =
                                                  newOptions.splice(idx, 1);
                                                newOptions.unshift(item);
                                                updateField(
                                                  "answer_option",
                                                  newOptions,
                                                );
                                              }
                                            }}
                                          >
                                            # {t("to_top")}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                              idx ===
                                              annotatedAnswerOptions.length - 1
                                            }
                                            onClick={() => {
                                              if (
                                                idx <
                                                annotatedAnswerOptions.length -
                                                  1
                                              ) {
                                                const newOptions = [
                                                  ...annotatedAnswerOptions,
                                                ];
                                                const [item] =
                                                  newOptions.splice(idx, 1);
                                                newOptions.push(item);
                                                updateField(
                                                  "answer_option",
                                                  newOptions,
                                                );
                                              }
                                            }}
                                          >
                                            # {t("to_bottom")}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="mb-2">
                                        <div className="font-semibold text-xs text-gray-500 mb-1">
                                          {t("move_to_specific_position")}
                                        </div>
                                        <div className="flex gap-2">
                                          <Input
                                            type="number"
                                            min={1}
                                            max={annotatedAnswerOptions.length}
                                            className="h-7 w-full text-sm"
                                            value={inputPosition}
                                            onChange={(e) =>
                                              setInputPosition(e.target.value)
                                            }
                                            placeholder={t("enter_position")}
                                          />
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                              const newPosition =
                                                parseInt(inputPosition) - 1;
                                              if (
                                                !isNaN(newPosition) &&
                                                newPosition >= 0 &&
                                                newPosition <
                                                  annotatedAnswerOptions.length &&
                                                newPosition !== idx
                                              ) {
                                                const newArray = [
                                                  ...annotatedAnswerOptions,
                                                ];
                                                const [movedItem] =
                                                  newArray.splice(idx, 1);
                                                newArray.splice(
                                                  newPosition,
                                                  0,
                                                  movedItem,
                                                );
                                                updateField(
                                                  "answer_option",
                                                  newArray,
                                                );
                                              }
                                              setInputPosition("");
                                            }}
                                            className="gap-2"
                                          >
                                            {t("move")}
                                          </Button>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          {t("range")}: 1 {t("to")}{" "}
                                          {annotatedAnswerOptions.length}
                                        </div>
                                      </div>

                                      <div className="border-t pt-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newOptions =
                                              annotatedAnswerOptions.filter(
                                                (_, i) => i !== idx,
                                              );
                                            updateField(
                                              "answer_option",
                                              newOptions,
                                            );
                                          }}
                                        >
                                          <CareIcon
                                            icon="l-trash-alt"
                                            className="mr-1 size-4"
                                          />
                                          {t("delete")}
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        </AnimatedWrapper>
                      ))}

                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => {
                        const newOption = { value: "" };
                        const newOptions = annotatedAnswerOptions
                          ? [...annotatedAnswerOptions, newOption]
                          : [newOption];
                        updateField("answer_option", newOptions);
                      }}
                    >
                      <CareIcon icon="l-plus" className="size-4" />
                      {t("add_option")}
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="space-y-4">
                    <SelectOrCreateValueset
                      onValueSetChange={(val) =>
                        updateField("answer_value_set", val)
                      }
                      value={
                        question.answer_value_set === "valueset"
                          ? ""
                          : (question.answer_value_set ?? "")
                      }
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
                  onClick={(e) => {
                    e.preventDefault();
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
                      (prev) => new Set([...prev, newQuestion.link_id]),
                    );
                    setTimeout(() => {
                      const element = document.getElementById(
                        `question-${newQuestion.link_id}`,
                      );
                      if (element) {
                        element.scrollIntoView();
                      }
                    }, 100);
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
                    id={`question-${subQuestion.link_id}`}
                    className="relative bg-white rounded-lg shadow-md"
                  >
                    <QuestionEditor
                      handleEnableWhenDependentClick={
                        handleEnableWhenDependentClick
                      }
                      enableWhenDependencies={enableWhenDependencies}
                      form={form}
                      index={idx}
                      key={subQuestion.link_id}
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
                      isExpanded={expandedSubQuestions.has(subQuestion.link_id)}
                      onToggleExpand={() =>
                        toggleSubQuestionExpanded(subQuestion.link_id)
                      }
                      depth={depth + 1}
                      parentId={getQuestionPath()}
                      onMoveUp={() => {
                        if (idx > 0) {
                          const newQuestions = swapElements<Question>(
                            questions || [],
                            idx,
                            idx - 1,
                          );
                          updateField("questions", newQuestions);
                        }
                      }}
                      onMoveDown={() => {
                        if (idx < (questions?.length || 0) - 1) {
                          const newQuestions = swapElements<Question>(
                            questions || [],
                            idx,
                            idx + 1,
                          );
                          updateField("questions", newQuestions);
                        }
                      }}
                      isFirst={idx === 0}
                      isLast={idx === (questions?.length || 0) - 1}
                      expandPath={expandPath?.slice(1)}
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
                  <Label className="text-xs mb-1">{t("enable_behavior")}</Label>
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
                  className="flex flex-col border border-gray-300 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {t("condition")} {idx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-end"
                      onClick={(e) => {
                        e.preventDefault();
                        const newConditions = question.enable_when?.filter(
                          (_, i) => i !== idx,
                        );
                        updateField("enable_when", newConditions);
                      }}
                    >
                      <CareIcon icon="l-times" className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <Label className="text-xs mb-1">{t("question")}</Label>
                      <div className="grid grid-cols-2 gap-2 justify-around">
                        <Select
                          value={
                            enableWhenQuestionAnswers[idx] &&
                            enableWhenQuestionAnswers[idx].length > 0
                              ? (enableWhenQuestionAnswers[idx][0]?.link_id ??
                                "")
                              : undefined
                          }
                          onValueChange={(val: string) => {
                            const selectedQuestion = rootQuestions.find(
                              (q) => q.link_id === val,
                            );
                            if (selectedQuestion) {
                              setEnableWhenQuestionAnswers((prev) => ({
                                ...prev,
                                [idx]: [selectedQuestion],
                              }));

                              if (selectedQuestion.type !== "group") {
                                const newConditions = [
                                  ...(question.enable_when || []),
                                ];
                                newConditions[idx] = {
                                  ...condition,
                                  question: val,
                                };
                                updateField("enable_when", newConditions);
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent>
                            {(rootQuestions || [])
                              .filter((q) => !!q && !!q.text)
                              .map((rootQn, index) => {
                                if (rootQn.id === question.id) return null;
                                return (
                                  <SelectItem
                                    key={rootQn.id}
                                    value={rootQn.link_id}
                                  >
                                    {index + 1}. {rootQn.text}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        {enableWhenQuestionAnswers[idx]?.map((q, index) => {
                          if (q.type !== "group" || q.questions?.length === 0) {
                            return null;
                          }
                          return (
                            <Select
                              key={q.id}
                              value={
                                enableWhenQuestionAnswers[idx][index + 1]
                                  ?.link_id ?? undefined
                              }
                              onValueChange={(val: string) => {
                                const selectedSubQuestion = q.questions?.find(
                                  (q) => q.link_id === val,
                                );
                                if (selectedSubQuestion) {
                                  setEnableWhenQuestionAnswers((prev) => {
                                    const newAnswers = {
                                      ...prev,
                                      [idx]: [
                                        ...prev[idx].slice(0, index + 1),
                                        selectedSubQuestion,
                                      ],
                                    };
                                    return newAnswers;
                                  });

                                  if (selectedSubQuestion.type !== "group") {
                                    const newConditions = [
                                      ...(question.enable_when || []),
                                    ];
                                    newConditions[idx] = {
                                      ...condition,
                                      question: val,
                                    };
                                    updateField("enable_when", newConditions);
                                  }
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a sub-question" />
                              </SelectTrigger>
                              <SelectContent>
                                {q.questions?.map((subQuestion, index) => {
                                  if (subQuestion.id === question.id)
                                    return null;
                                  return (
                                    <SelectItem
                                      key={subQuestion.id}
                                      value={subQuestion.link_id}
                                    >
                                      {index + 1}. {subQuestion.text}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1">{t("operator")}</Label>
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
                          const newConditions = [
                            ...(question.enable_when || []),
                          ];

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
                          {getOperatorChoices(idx).map((operator) => (
                            <SelectItem key={operator} value={operator}>
                              {t(operator)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs mb-1">{t("answer")}</Label>
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
                              <SelectItem value="false">
                                {t("false")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getAnswerChoices(idx, condition)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
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
