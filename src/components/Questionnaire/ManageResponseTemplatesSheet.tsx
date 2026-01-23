import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ChevronLeftIcon,
  FileTextIcon,
  Loader2,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Loading from "@/components/Common/Loading";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  QuestionnaireResponseTemplateCreateSpec,
  QuestionnaireResponseTemplateReadSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

interface ManageResponseTemplatesSheetProps {
  questionnaireId: string;
  questionnaireSlug: string;
  facilityId?: string;
  trigger?: React.ReactNode;
  onTemplateSelect?: (template: QuestionnaireResponseTemplateReadSpec) => void;
  disabled?: boolean;
}

type ViewState = "list" | "create";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageResponseTemplatesSheet({
  questionnaireId,
  questionnaireSlug,
  facilityId,
  trigger,
  onTemplateSelect,
  disabled,
}: ManageResponseTemplatesSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthUser();
  const [open, setOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [templateToDelete, setTemplateToDelete] =
    useState<QuestionnaireResponseTemplateReadSpec | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch templates list
  const { data: templatesResponse, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["questionnaireResponseTemplates", questionnaireId],
    queryFn: query(questionnaireResponseTemplateApi.list, {
      queryParams: {
        questionnaire: questionnaireId,
        limit: 50,
      },
    }),
    enabled: open,
  });

  // Create mutation
  const { mutate: createTemplate, isPending: isCreating } = useMutation({
    mutationFn: mutate(questionnaireResponseTemplateApi.create),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireId],
      });
      toast.success(t("template_created_successfully"));
      form.reset();
      setViewState("list");
    },
    onError: () => {
      toast.error(t("failed_to_create_template"));
    },
  });

  // Delete mutation
  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) =>
      mutate(questionnaireResponseTemplateApi.delete, {
        pathParams: { id },
      })({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates", questionnaireId],
      });
      toast.success(t("template_deleted_successfully"));
      setTemplateToDelete(null);
    },
    onError: () => {
      toast.error(t("failed_to_delete_template"));
    },
  });

  const onSubmit = (data: FormData) => {
    const createData: QuestionnaireResponseTemplateCreateSpec = {
      name: data.name,
      description: "",
      questionnaire: questionnaireSlug,
      facility: facilityId,
      template_data: {},
      users: [currentUser.username],
      facility_organizations: [],
    };
    createTemplate(createData);
  };

  const handleApplyTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      setOpen(false);
    }
  };

  const handleDeleteTemplate = (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    setTemplateToDelete(template);
  };

  const confirmDelete = () => {
    if (templateToDelete?.id) {
      deleteTemplate(templateToDelete.id);
    }
  };

  const templates = templatesResponse?.results ?? [];

  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {onTemplateSelect
            ? t("select_template_to_apply")
            : t("manage_response_templates_description")}
        </p>
        <Button size="sm" onClick={() => setViewState("create")}>
          <PlusIcon className="size-4 mr-1" />
          {t("create")}
        </Button>
      </div>

      {isLoadingTemplates ? (
        <Loading />
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
          <FileTextIcon className="size-8 mx-auto mb-2 opacity-50" />
          <p>{t("no_templates_available")}</p>
          <p className="text-sm">{t("create_template_to_prefill_forms")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((template) => {
            const medicationCount =
              template.template_data?.medication_request?.length ?? 0;

            return (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {template.name}
                    </span>
                    {medicationCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {medicationCount} {t("medications")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(template.created_date), "PPp")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {onTemplateSelect && (
                    <Button
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {t("apply")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            form.reset();
            setViewState("list");
          }}
          className="p-1"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h3 className="font-medium">{t("create_template")}</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("enter_template_name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-sm text-gray-500">
            {t("add_medications_after_creating")}
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setViewState("list");
              }}
              disabled={isCreating}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="size-4 mr-2 animate-spin" />}
              {t("create")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
      <FileTextIcon className="size-4" />
      {t("templates")}
    </Button>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileTextIcon className="size-5" />
              {onTemplateSelect
                ? t("select_response_template")
                : t("response_templates")}
            </SheetTitle>
            <SheetDescription>
              {onTemplateSelect
                ? t("select_template_to_prefill_or_manage")
                : t("response_templates_description")}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
            {viewState === "list" ? renderList() : renderForm()}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_template_confirmation", {
                name: templateToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
