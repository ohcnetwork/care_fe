import { useMutation, useQuery } from "@tanstack/react-query";
import { Tags } from "lucide-react";
import { useNavigate } from "raviger";
import { useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import type { Question } from "@/types/questionnaire/question";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

import CloneQuestionnaireSheet from "./CloneQuestionnaireSheet";
import ManageQuestionnaireOrganizationsSheet from "./ManageQuestionnaireOrganizationsSheet";
import ManageQuestionnaireTagsSheet from "./ManageQuestionnaireTagsSheet";
import { QuestionnaireForm } from "./QuestionnaireForm";

interface QuestionnaireShowProps {
  id: string;
}

type TabValue = "preview" | "details";

function QuestionItem({
  question,
  depth = 0,
}: {
  question: Question;
  depth?: number;
}) {
  const isGroup = question.type === "group";

  return (
    <div className={`py-2 pl-4 ${depth > 0 ? "border-l border-gray-200" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h4 className="font-medium">{question.text}</h4>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="outline">{question.type}</Badge>
            {question.required && <Badge variant="secondary">Required</Badge>}
            {question.code && (
              <Badge variant="outline" className="text-blue-600">
                {question.code.display}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {isGroup && question.questions && question.questions.length > 0 && (
        <div className="mt-2">
          {question.questions.map((q: Question) => (
            <QuestionItem key={q.id} question={q} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionnaireShow({ id }: QuestionnaireShowProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>("details");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: questionnaire,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["questionnaireDetail", id],
    queryFn: query(questionnaireApi.detail, {
      pathParams: { id },
    }),
  });

  const { mutate: deleteQuestionnaire, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.delete, {
      pathParams: { id },
    }),
    onSuccess: () => {
      navigate("/admin/questionnaire");
    },
  });

  const handleDelete = () => {
    deleteQuestionnaire({});
  };

  if (isLoading) {
    return <Loading />;
  }

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{questionnaire.title}</h1>
          <p className="text-gray-600">{questionnaire.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/questionnaire")}
          >
            <CareIcon icon="l-arrow-left" className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <Button onClick={() => navigate(`/admin/questionnaire/${id}/edit`)}>
            <CareIcon icon="l-pen" className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <CareIcon icon="l-cog" className="mr-2 h-4 w-4" />
                Manage
                <CareIcon icon="l-angle-down" className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <ManageQuestionnaireOrganizationsSheet
                questionnaireId={id}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CareIcon icon="l-building" className="mr-2 h-4 w-4" />
                    Manage Organizations
                  </DropdownMenuItem>
                }
              />
              <ManageQuestionnaireTagsSheet
                questionnaire={questionnaire}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Tags className="mr-2 h-4 w-4" />
                    Manage Tags
                  </DropdownMenuItem>
                }
              />
              <CloneQuestionnaireSheet
                questionnaire={questionnaire}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CareIcon icon="l-copy" className="mr-2 h-4 w-4" />
                    Clone Questionnaire
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <CareIcon icon="l-trash-alt" className="mr-2 h-4 w-4" />
                Delete Questionnaire
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Questionnaire</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this questionnaire? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className={cn(buttonVariants({ variant: "destructive" }))}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as TabValue)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="preview">Preview Form</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd>
                      <Badge
                        className={
                          questionnaire.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : ""
                        }
                      >
                        {questionnaire.status}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Version
                    </dt>
                    <dd>{questionnaire.version}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Subject Type
                    </dt>
                    <dd>{questionnaire.subject_type}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questionnaire.questions.map((question: Question) => (
                    <QuestionItem key={question.id} question={question} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{questionnaire.title}</CardTitle>
              <p className="text-sm text-gray-500">
                {questionnaire.description}
              </p>
            </CardHeader>
            <CardContent>
              <QuestionnaireForm
                questionnaireSlug={id}
                patientId={"preview"}
                subjectType={"encounter"}
                encounterId={"preview"}
                facilityId={"preview"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
