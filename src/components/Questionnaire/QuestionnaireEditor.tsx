import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Building, Check, Loader2, X } from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import organizationApi from "@/types/organization/organizationApi";
import {
  AnswerOption,
  EnableWhen,
  Question,
  QuestionType,
  StructuredQuestionType,
} from "@/types/questionnaire/question";
import {
  QuestionStatus,
  QuestionnaireDetail,
  SubjectType,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

import ManageQuestionnaireOrganizationsSheet from "./ManageQuestionnaireOrganizationsSheet";
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
  { value: "location_association", label: "Location Association" },
] as const;

export default function QuestionnaireEditor({ id }: QuestionnaireEditorProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

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

  const { data: availableOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["organizations", orgSearchQuery],
      queryFn: query(organizationApi.list, {
        queryParams: {
          org_type: "role",
          name: orgSearchQuery || undefined,
        },
      }),
    });

  const { mutate: createQuestionnaire, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireApi.create),
    onSuccess: (data: QuestionnaireDetail) => {
      toast.success("Questionnaire created successfully");
      navigate(`/questionnaire/${data.slug}`);
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
          The requested questionnaire could not be found.
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
    navigate(id ? `/questionnaire/${id}` : "/questionnaire");
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {id ? "Edit Questionnaire" : "Create Questionnaire"}
          </h1>
          <p className="text-sm text-gray-500">{questionnaire.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <CareIcon icon="l-arrow-left" className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isCreating || isUpdating}>
            <CareIcon icon="l-save" className="mr-2 h-4 w-4" />
            {id ? "Save" : "Create"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                </CardHeader>
                <CardContent>
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
                            className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent flex items-center gap-2 ${
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
                            <Badge variant="secondary" className="text-xs">
                              {question.type}
                            </Badge>
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
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {subQuestion.type}
                                    </Badge>
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

              <Card>
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={questionnaire.status}
                      onValueChange={(val: QuestionStatus) =>
                        updateQuestionnaireField("status", val)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={questionnaire.version || ""}
                      onChange={(e) =>
                        updateQuestionnaireField("version", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject_type">Subject Type</Label>
                    <Select
                      value={questionnaire.subject_type}
                      onValueChange={(val: SubjectType) =>
                        updateQuestionnaireField("subject_type", val)
                      }
                    >
                      <SelectTrigger id="subject_type">
                        <SelectValue placeholder="Select subject type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="encounter">Encounter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Organizations</Label>
                    {id ? (
                      <ManageQuestionnaireOrganizationsSheet
                        questionnaireId={id}
                        trigger={
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <Building className="mr-2 h-4 w-4" />
                            Manage Organizations
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedOrgIds.length > 0 ? (
                            availableOrganizations?.results
                              .filter((org) => selectedOrgIds.includes(org.id))
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
                                    onClick={() =>
                                      handleToggleOrganization(org.id)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No organizations selected
                            </p>
                          )}
                        </div>

                        <Command className="rounded-lg border shadow-md">
                          <CommandInput
                            placeholder="Search organizations..."
                            onValueChange={setOrgSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No organizations found.</CommandEmpty>
                            <CommandGroup>
                              {isLoadingOrganizations ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : (
                                availableOrganizations?.results.map((org) => (
                                  <CommandItem
                                    key={org.id}
                                    value={org.id}
                                    onSelect={() =>
                                      handleToggleOrganization(org.id)
                                    }
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
                                    {selectedOrgIds.includes(org.id) && (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={questionnaire.title}
                      onChange={(e) =>
                        updateQuestionnaireField("title", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
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
                    <Label htmlFor="desc">Description</Label>
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

              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle>Questions</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {questionnaire.questions?.length || 0} question
                      {questionnaire.questions?.length !== 1 ? "s" : ""}
                    </p>
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
                    Add Question
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {questionnaire.questions.map((question, index) => (
                      <div
                        key={question.id}
                        id={`question-${question.id}`}
                        className="relative"
                      >
                        <div className="absolute -left-4 top-4 font-medium text-gray-500">
                          {index + 1}.
                        </div>
                        <QuestionEditor
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
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
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
}: QuestionEditorProps) {
  const {
    text,
    type,
    structured_type,
    required,
    repeats,
    answer_option,
    questions,
  } = question;

  const [expandedSubQuestions, setExpandedSubQuestions] = useState<Set<string>>(
    new Set(),
  );

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
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
        depth > 0 ? "border-l-4 border-l-primary/20" : ""
      }`}
    >
      <div className="flex items-center p-4">
        <CollapsibleTrigger className="flex-1 flex items-center">
          <div className="flex-1">
            <div className="font-medium text-left">
              {text || "Untitled Question"}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{type}</Badge>
              {required && <Badge>Required</Badge>}
              {repeats && <Badge variant="outline">Repeatable</Badge>}
              {type === "group" && questions && questions.length > 0 && (
                <Badge variant="outline">
                  {questions.length} sub-questions
                </Badge>
              )}
            </div>
          </div>
          <CareIcon
            icon={isExpanded ? "l-angle-up" : "l-angle-down"}
            className="h-4 w-4 text-gray-500"
          />
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
                Move Up
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
                Move Down
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
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CollapsibleContent>
        <div className="p-4 pt-0 space-y-4">
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
            <Label>Description</Label>
            <Textarea
              value={question.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Additional context or instructions for this question"
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
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
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="decimal">Decimal</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dateTime">DateTime</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="choice">Choice</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="structured">Structured</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "structured" && (
              <div>
                <Label>Structured Type</Label>
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

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={required ?? false}
                onCheckedChange={(val) => updateField("required", val)}
                id={`required-${getQuestionPath()}`}
              />
              <Label htmlFor={`required-${getQuestionPath()}`}>Required</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={repeats ?? false}
                onCheckedChange={(val) => updateField("repeats", val)}
                id={`repeats-${getQuestionPath()}`}
              />
              <Label htmlFor={`repeats-${getQuestionPath()}`}>Repeatable</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={question.collect_time ?? false}
                onCheckedChange={(val) => updateField("collect_time", val)}
                id={`collect_time-${getQuestionPath()}`}
              />
              <Label htmlFor={`collect_time-${getQuestionPath()}`}>
                Collect Time
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={question.collect_performer ?? false}
                onCheckedChange={(val) => updateField("collect_performer", val)}
                id={`collect_performer-${getQuestionPath()}`}
              />
              <Label htmlFor={`collect_performer-${getQuestionPath()}`}>
                Collect Performer
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={question.collect_body_site ?? false}
                onCheckedChange={(val) => updateField("collect_body_site", val)}
                id={`collect_body_site-${getQuestionPath()}`}
              />
              <Label htmlFor={`collect_body_site-${getQuestionPath()}`}>
                Collect Body Site
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={question.collect_method ?? false}
                onCheckedChange={(val) => updateField("collect_method", val)}
                id={`collect_method-${getQuestionPath()}`}
              />
              <Label htmlFor={`collect_method-${getQuestionPath()}`}>
                Collect Method
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Styling Classes</Label>
              <Input
                value={question.styling_metadata?.classes || ""}
                onChange={(e) =>
                  updateField("styling_metadata", {
                    ...question.styling_metadata,
                    classes: e.target.value,
                  })
                }
                placeholder="CSS classes (space-separated)"
              />
            </div>
            <div>
              <Label>Container Classes</Label>
              <Input
                value={question.styling_metadata?.containerClasses || ""}
                onChange={(e) =>
                  updateField("styling_metadata", {
                    ...question.styling_metadata,
                    containerClasses: e.target.value,
                  })
                }
                placeholder="Container CSS classes"
              />
            </div>
          </div>

          {type === "choice" && (
            <div className="space-y-4">
              <div>
                <Label>Answer Options</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Select
                    value={question.answer_value_set ?? "custom"}
                    onValueChange={(val: string) =>
                      updateField(
                        "answer_value_set",
                        val === "custom" ? undefined : val,
                      )
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a value set (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Options</SelectItem>
                      <SelectItem value="system-yes-no">Yes/No</SelectItem>
                      <SelectItem value="system-severity">
                        Severity Levels
                      </SelectItem>
                      <SelectItem value="system-frequency">
                        Frequency
                      </SelectItem>
                      <SelectItem value="system-duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(!question.answer_value_set ||
                  question.answer_value_set === "custom") && (
                  <div className="space-y-2">
                    {(answer_option || []).map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2">
                        <Input
                          value={opt.value}
                          onChange={(e) => {
                            const newOptions = [...(answer_option || [])];
                            newOptions[idx] = { ...opt, value: e.target.value };
                            updateField("answer_option", newOptions);
                          }}
                          placeholder="Option value"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={opt.display || ""}
                            onChange={(e) => {
                              const newOptions = [...(answer_option || [])];
                              newOptions[idx] = {
                                ...opt,
                                display: e.target.value,
                              };
                              updateField("answer_option", newOptions);
                            }}
                            placeholder="Display text (optional)"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
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
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOption: AnswerOption = { value: "" };
                        updateField("answer_option", [
                          ...(answer_option || []),
                          newOption,
                        ]);
                      }}
                    >
                      <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                )}
              </div>

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
                            const newConditions = [
                              ...(question.enable_when || []),
                            ];
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
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">
                              Not Equals
                            </SelectItem>
                            <SelectItem value="greater">
                              Greater Than
                            </SelectItem>
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
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
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
                    Add Condition
                  </Button>
                </div>
              </div>
            </div>
          )}

          {type === "group" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Sub-Questions</Label>
                <Button
                  variant="outline"
                  size="sm"
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
                  <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                  Add Sub-Question
                </Button>
              </div>
              <div className="space-y-4">
                {(questions || []).map((subQuestion, idx) => (
                  <QuestionEditor
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
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
