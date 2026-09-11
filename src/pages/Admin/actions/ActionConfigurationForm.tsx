import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, navigate, useNavigationPrompt } from "raviger";
import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import Page from "@/components/Common/Page";

import { ActionListEditor } from "@/components/QuestionnaireV2/builder/actions/ActionListEditor";
import { useActionRegistry } from "@/components/QuestionnaireV2/builder/actions/useActionRegistry";
import { findActionIssues } from "@/components/QuestionnaireV2/builder/actionValidation";

import {
  ACTION_CONFIGURATION_CONTEXTS,
  ACTION_CONFIGURATION_CONTEXT_TYPES,
  ActionConfigurationContext,
  ActionConfigurationRead,
  ActionConfigurationRetrieve,
} from "@/types/actions/actionConfiguration";
import actionConfigurationApi from "@/types/actions/actionConfigurationApi";
import {
  QuestionnaireAction,
  normalizeQuestionnaireActions,
} from "@/types/questionnaire/actions";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { ADMIN_ACTIONS_PATH } from "./ActionConfigurationList";
import { actionContextHint, actionContextLabel } from "./labels";
import { actionConfigurationKeys } from "./queryKeys";

interface ActionConfigurationFormProps {
  /** Editing an existing configuration; omitted on `/new`. */
  id?: string;
}

/**
 * Loads the configuration being edited (nothing on `/new`) and hands it to
 * the editor, which seeds its state from it once. Keyed by id so a
 * different configuration remounts the editor rather than syncing into it.
 */
export function ActionConfigurationForm({ id }: ActionConfigurationFormProps) {
  const { t } = useTranslation();
  const {
    data: existing,
    isLoading,
    isError,
  } = useQuery({
    queryKey: actionConfigurationKeys.detail(id ?? ""),
    queryFn: query(actionConfigurationApi.retrieve, {
      pathParams: { id: id ?? "" },
    }),
    enabled: Boolean(id),
  });

  if (id && isLoading) {
    return (
      <Page title={t("action_configurations")} hideTitleOnPage>
        <FormSkeleton rows={6} />
      </Page>
    );
  }
  // A deleted or mistyped id: the fetch settled with nothing (the global
  // handler has already toasted the error) — say so and offer the way
  // back rather than leaving the skeleton up.
  if (id && (isError || !existing)) {
    return (
      <Page title={t("action_configurations")} hideTitleOnPage>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>{t("no_data_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => navigate(ADMIN_ACTIONS_PATH)}
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Button>
        </div>
      </Page>
    );
  }
  return (
    <ActionConfigurationEditor key={id ?? "new"} id={id} existing={existing} />
  );
}

interface ActionConfigurationEditorProps {
  id?: string;
  existing?: ActionConfigurationRetrieve;
}

/**
 * Create or edit one action configuration: its identity on the left, the
 * shared action list editor on the right. Context and the on-demand flag
 * are creation-time only (the backend's update spec does not carry them),
 * so an existing configuration shows them as badges.
 */
function ActionConfigurationEditor({
  id,
  existing,
}: ActionConfigurationEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t("field_required")).max(254),
        description: z.string().trim(),
        action_context: z.enum(ACTION_CONFIGURATION_CONTEXTS),
        performable: z.boolean(),
      }),
    [t],
  );
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          name: existing.name,
          description: existing.description ?? "",
          action_context: existing.action_context,
          performable: existing.performable,
        }
      : {
          name: "",
          description: "",
          action_context: "APPOINTMENT",
          performable: false,
        },
  });

  // The action list is edit state of its own (not a form field): the
  // editor mutates it per keystroke and the save rules read it directly.
  const [actions, setActions] = useState<QuestionnaireAction[]>(() =>
    normalizeQuestionnaireActions(existing?.actions),
  );
  const [actionsDirty, setActionsDirty] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const dirty = form.formState.isDirty || actionsDirty;
  useNavigationPrompt(dirty, t("unsaved_changes_warning"));

  const registry = useActionRegistry();
  // `useWatch`, not `form.watch`: the latter is a subscription the React
  // Compiler cannot memoize safely (it skips the whole component).
  const context = useWatch({ control: form.control, name: "action_context" });
  const contextType = ACTION_CONFIGURATION_CONTEXT_TYPES[context];
  const issues = useMemo(
    () =>
      findActionIssues(actions, {
        questions: [],
        instructions: registry.instructions,
      }),
    [actions, registry.instructions],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: actionConfigurationKeys.all });

  /** Back to the list. The dirty flags must be flushed pristine BEFORE the
   *  navigation, or `useNavigationPrompt` still sees unsaved changes and
   *  blocks it (the same ordering the fill page relies on). */
  const leavePristine = () => {
    flushSync(() => {
      setActionsDirty(false);
      form.reset(form.getValues());
    });
    navigate(ADMIN_ACTIONS_PATH);
  };

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: mutate(actionConfigurationApi.create),
    onSuccess: () => {
      invalidate();
      toast.success(t("action_configuration_created"));
      leavePristine();
    },
  });
  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: mutate(actionConfigurationApi.update, {
      pathParams: { id: id ?? "" },
    }),
    onSuccess: (updated: ActionConfigurationRead) => {
      queryClient.setQueryData(
        actionConfigurationKeys.detail(id ?? ""),
        (previous: ActionConfigurationRetrieve | undefined) =>
          previous ? { ...previous, ...updated } : previous,
      );
      invalidate();
      toast.success(t("action_configuration_updated"));
      setActionsDirty(false);
      form.reset(form.getValues());
    },
  });
  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: mutate(actionConfigurationApi.delete, {
      pathParams: { id: id ?? "" },
    }),
    onSuccess: () => {
      invalidate();
      toast.success(t("action_configuration_deleted"));
      leavePristine();
    },
  });
  const isSaving = isCreating || isUpdating;

  const changeActions = (next: QuestionnaireAction[]) => {
    setActions(next);
    setActionsDirty(true);
  };

  const onSubmit = (values: FormValues) => {
    // The action rules gate Save the way the studio's do: the failing
    // action is opened so the author sees what to fix.
    const issue = issues[0];
    if (issue) {
      toast.error(t(issue.messageKey));
      setOpenIndex(issue.index);
      return;
    }
    const body = {
      name: values.name,
      description: values.description,
      actions,
    };
    if (isEditing) update(body);
    else
      create({
        ...body,
        action_context: values.action_context,
        performable: values.performable,
        facility: null,
      });
  };

  const title = isEditing
    ? (existing?.name ?? t("action_configurations"))
    : t("action_configuration_new");

  return (
    <Page title={title} hideTitleOnPage>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* raviger's Link (not a bare anchor): the click goes through
                navigate(), so a dirty form gets the app's unsaved-changes
                prompt and a clean one a client-side transition. */}
            <Button asChild variant="outline" size="xs">
              <Link href={ADMIN_ACTIONS_PATH}>
                <ArrowLeft className="size-4" />
                {t("back")}
              </Link>
            </Button>
            <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
              {title}
            </h1>
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDeleting || isSaving}
                  >
                    <Trash2 className="size-4" />
                    {t("delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("action_configuration_delete")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("action_configuration_delete_confirm", {
                        name: existing?.name ?? "",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(undefined)}>
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" disabled={isSaving || (isEditing && !dirty)}>
              {t("save")}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus={!isEditing} />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-900">
                    {t("action_configuration_context")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {actionContextLabel(context, t)}
                    </Badge>
                    {form.getValues("performable") && (
                      <Badge variant="secondary">
                        {t("action_configuration_on_demand")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {actionContextHint(context, t)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("action_configuration_context_locked")}
                  </p>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="action_context"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("action_configuration_context")}
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value === field.value) return;
                            field.onChange(value as ActionConfigurationContext);
                            // Conditions and steps were authored against
                            // the previous context's fields; they cannot
                            // resolve under the new one, so they go.
                            if (actions.length > 0) {
                              changeActions([]);
                              setOpenIndex(null);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="w-full"
                              aria-label={t("action_configuration_context")}
                            >
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTION_CONFIGURATION_CONTEXTS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {actionContextLabel(option, t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {actionContextHint(field.value, t)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="performable"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={t("action_configuration_performable")}
                          />
                        </FormControl>
                        <div className="space-y-0.5">
                          <FormLabel>
                            {t("action_configuration_performable")}
                          </FormLabel>
                          <FormDescription>
                            {t("action_configuration_performable_hint")}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {t("actions")}
                </h2>
                <p className="text-xs text-gray-500">
                  {actionContextHint(context, t)}
                </p>
              </div>
              <ActionListEditor
                contextType={contextType}
                questions={[]}
                actions={actions}
                issues={issues}
                openIndex={openIndex}
                onOpenIndexChange={setOpenIndex}
                registry={registry}
                onActionsChange={changeActions}
                emptyHint={t("action_configuration_empty_hint")}
              />
            </section>
          </div>
        </form>
      </Form>
    </Page>
  );
}
