import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Braces, Loader2, Trash2 } from "lucide-react";
import { Link, navigate, useNavigationPrompt } from "raviger";
import { useState } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import Page from "@/components/Common/Page";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";

import useAuthUser from "@/hooks/useAuthUser";
import { useCareAppEncounterWidgets } from "@/hooks/useCareAppEncounterWidgets";
import { useCareAppTabs } from "@/hooks/useCareApps";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import mutate from "@/Utils/request/mutate";
import {
  createEncounterWorkspaceSchema,
  ENCOUNTER_WIDGET_TYPES,
} from "@/types/workspace/encounterWorkspace";
import {
  WORKSPACE_AUTH_CONTEXTS,
  WorkspaceAuthContext,
  WorkspaceRead,
  WorkspaceScope,
  WorkspaceTemplate,
} from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";

import { WorkspaceOrganizationsField } from "./WorkspaceOrganizationsField";

interface WorkspaceFormValues {
  name: string;
  description: string;
  template: string;
  authContext: WorkspaceAuthContext;
  departmentId: string;
}

interface WorkspaceFormProps {
  scope: WorkspaceScope;
  existing?: WorkspaceRead;
  allowedContexts: WorkspaceAuthContext[];
}

function parseTemplate(value: string): WorkspaceTemplate {
  const parsed: unknown = JSON.parse(value);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }
  return parsed as WorkspaceTemplate;
}

export function WorkspaceForm({
  scope,
  existing,
  allowedContexts,
}: WorkspaceFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const pluginTabs = useCareAppTabs("encounterTabs");
  const encounterSchema = createEncounterWorkspaceSchema(
    Object.keys(pluginTabs),
  );
  const { widgets: pluginWidgets, loadingPlugins } =
    useCareAppEncounterWidgets();
  const [accessState, setAccessState] = useState({
    dirty: false,
    pending: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const schema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("workspace_name_required"))
        .max(255, t("workspace_name_too_long")),
      description: z.string(),
      template: z.string().superRefine((value, ctx) => {
        try {
          const template = parseTemplate(value);
          if ("schema_version" in template || "pages" in template) {
            const parsed = encounterSchema.safeParse(template);
            if (!parsed.success) {
              ctx.addIssue({
                code: "custom",
                message: t("encounter_workspace_template_invalid"),
              });
            }
          }
        } catch {
          ctx.addIssue({
            code: "custom",
            message: t("workspace_template_invalid"),
          });
        }
      }),
      authContext: z.enum(WORKSPACE_AUTH_CONTEXTS),
      departmentId: z.string(),
    })
    .superRefine((values, ctx) => {
      if (
        !existing &&
        values.authContext === "facility_organization" &&
        !values.departmentId
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["departmentId"],
          message: t("workspace_department_required"),
        });
      }
    });
  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(schema),
    values: existing
      ? {
          name: existing.name,
          description: existing.description,
          template: JSON.stringify(existing.template, null, 2),
          authContext: scope.authContext,
          departmentId: "",
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      template: JSON.stringify(existing?.template ?? {}, null, 2),
      authContext: scope.authContext,
      departmentId: "",
    },
  });
  const authContext = useWatch({ control: form.control, name: "authContext" });
  const templateValue = useWatch({ control: form.control, name: "template" });
  let unsupportedWidgets: string[] = [];
  try {
    const parsed = encounterSchema.safeParse(JSON.parse(templateValue));
    if (parsed.success) {
      const widgetTypes = parsed.data.pages.flatMap((page) =>
        page.kind === "custom"
          ? page.columns.flatMap((column) =>
              column.widgets.map((widget) => widget.type),
            )
          : [],
      );
      unsupportedWidgets = [...new Set(widgetTypes)].filter(
        (type) =>
          !ENCOUNTER_WIDGET_TYPES.includes(type) &&
          !pluginWidgets.has(type) &&
          !loadingPlugins.has(type.split(".")[0]),
      );
    }
  } catch {
    // JSON validation is shown on submission or when Format JSON is used.
  }
  const returnPath = scope.basePath;
  const contextLabel = {
    instance: t("workspace_instance_scope"),
    facility: t("workspace_facility_scope"),
    facility_organization: t("workspace_department_scope"),
    user: t("workspace_personal_scope"),
  };
  const contextDescription = {
    instance: t("workspace_instance_description"),
    facility: t("workspace_facility_description"),
    facility_organization: t("workspace_department_description"),
    user: t("workspace_personal_description"),
  };

  const title = t(existing ? "edit_workspace" : "create_workspace");
  const dirty = form.formState.isDirty || accessState.dirty;
  useNavigationPrompt(dirty, t("unsaved_changes_warning"));

  const save = useMutation({
    mutationFn: (values: WorkspaceFormValues) => {
      const body = {
        name: values.name,
        description: values.description,
        template: parseTemplate(values.template),
      };
      return existing
        ? mutate(workspaceApi.update, { pathParams: { id: existing.id } })(body)
        : mutate(workspaceApi.create)({
            ...body,
            auth_context: values.authContext,
            inherited: false,
            ...(scope.authContext === "facility"
              ? { facility: scope.facilityId }
              : {}),
            ...(values.authContext === "facility_organization"
              ? { facility_organization: values.departmentId }
              : {}),
          });
    },
    onSuccess: async (data, values) => {
      const queryKey = ["workspace", "configuration", user.id, data.id];
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      flushSync(() =>
        form.reset(
          {
            name: data.name,
            description: data.description,
            template: JSON.stringify(data.template, null, 2),
            authContext: values.authContext,
            departmentId: values.departmentId,
          },
          { keepDirtyValues: false },
        ),
      );
      toast.success(t(existing ? "workspace_updated" : "workspace_created"));
      if (!existing) navigate(`${scope.basePath}/${data.id}/edit`);
    },
  });

  const remove = useMutation({
    mutationFn: mutate(workspaceApi.delete, {
      pathParams: { id: existing?.id ?? "" },
    }),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ["workspace", "configuration", user.id, existing?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      flushSync(() => {
        form.reset(form.getValues(), { keepDirtyValues: false });
        setAccessState({ dirty: false, pending: false });
        setDeleteOpen(false);
      });
      queryClient.invalidateQueries({ queryKey: ["workspace-user-defaults"] });
      toast.success(t("workspace_deleted"));
      navigate(returnPath);
    },
  });
  const busy = save.isPending || remove.isPending || accessState.pending;

  const formatTemplate = () => {
    try {
      form.setValue(
        "template",
        JSON.stringify(parseTemplate(form.getValues("template")), null, 2),
        { shouldDirty: true, shouldValidate: true },
      );
    } catch {
      form.setError(
        "template",
        { message: t("workspace_template_invalid") },
        { shouldFocus: true },
      );
    }
  };

  return (
    <Page title={title} hideTitleOnPage>
      <div className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-0">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm" disabled={busy}>
            <Link
              href={returnPath}
              basePath="/"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <ArrowLeft className="size-4" />
              {t("back")}
            </Link>
          </Button>
          <h1 className="flex-1 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {!existing && (
            <Badge variant="secondary">{contextLabel[authContext]}</Badge>
          )}
        </div>

        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) => {
              if (busy) return;
              if (!existing && !allowedContexts.includes(values.authContext))
                return;
              save.mutate(values);
            })}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
              <section
                className="space-y-5"
                aria-labelledby="workspace-details-heading"
              >
                <div>
                  <h2
                    id="workspace-details-heading"
                    className="text-base font-semibold"
                  >
                    {t("workspace_details")}
                  </h2>
                  {!existing && (
                    <p className="mt-1 text-sm text-gray-600">
                      {contextDescription[authContext]}
                    </p>
                  )}
                </div>
                {!existing && scope.authContext === "facility" && (
                  <FormField
                    control={form.control}
                    name="authContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("workspace_ownership")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value: WorkspaceAuthContext) => {
                            if (busy || !allowedContexts.includes(value))
                              return;
                            field.onChange(value);
                            form.setValue("departmentId", "", {
                              shouldDirty: true,
                            });
                            form.clearErrors("departmentId");
                          }}
                          disabled={busy}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allowedContexts.map((context) => (
                              <SelectItem key={context} value={context}>
                                {contextLabel[context]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("workspace_ownership_fixed_hint")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {!existing &&
                  authContext === "facility_organization" &&
                  scope.authContext === "facility" && (
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("workspace_owner_department")}
                          </FormLabel>
                          <fieldset disabled={busy}>
                            <FacilityOrganizationSelector
                              facilityId={scope.facilityId}
                              singleSelection
                              optional
                              value={field.value ? [field.value] : []}
                              onChange={(ids) => {
                                if (!busy) {
                                  field.onChange(ids?.[0] ?? "");
                                  form.clearErrors("departmentId");
                                }
                              }}
                            />
                          </fieldset>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={busy} autoComplete="off" />
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
                        <Textarea {...field} disabled={busy} rows={5} />
                      </FormControl>
                      <FormDescription>
                        {t("workspace_description_hint")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {authContext === "facility" && !existing && (
                  <Alert>
                    <AlertDescription>
                      {t("workspace_access_after_create")}
                    </AlertDescription>
                  </Alert>
                )}
              </section>
              <section className="min-w-0 rounded-lg border bg-white p-4 sm:p-5">
                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <FormLabel className="flex items-center gap-2 text-base">
                          <Braces className="size-4" />
                          {t("workspace_template")}
                        </FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={formatTemplate}
                          disabled={busy}
                        >
                          {t("workspace_format_json")}
                        </Button>
                      </div>
                      <FormDescription>
                        {t("workspace_template_hint")}
                      </FormDescription>
                      <p className="text-sm text-gray-600">
                        {t("encounter_workspace_template_hint")}
                      </p>
                      <p className="text-sm text-gray-600 break-words">
                        {t("encounter_workspace_core_widgets", {
                          widgets: ENCOUNTER_WIDGET_TYPES.join(", "),
                        })}
                      </p>
                      {unsupportedWidgets.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            {t("encounter_workspace_unsupported_widgets", {
                              widgets: unsupportedWidgets.join(", "),
                            })}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={busy}
                          spellCheck={false}
                          autoCapitalize="off"
                          autoCorrect="off"
                          rows={18}
                          className="mt-3 min-h-80 resize-y font-mono text-sm leading-6"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>
            </div>

            {save.isError && (
              <Alert variant="destructive">
                <AlertDescription>{t("workspace_save_error")}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
              <span className="mr-auto text-sm text-gray-500">
                {t(
                  form.formState.isDirty
                    ? "workspace_unsaved_changes"
                    : "no_changes_to_save",
                )}
              </span>
              <Button
                type="submit"
                disabled={busy || (!!existing && !form.formState.isDirty)}
              >
                {save.isPending && <Loader2 className="size-4 animate-spin" />}
                {t(existing ? "save_changes" : "create_workspace")}
              </Button>
            </div>
          </form>
        </Form>

        {existing && scope.authContext === "facility" && (
          <WorkspaceOrganizationsField
            scope={scope}
            workspaceId={existing.id}
            disabled={save.isPending || remove.isPending}
            onStateChange={setAccessState}
          />
        )}

        {existing && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
            <p className="text-sm text-gray-600">
              {t("workspace_delete_hint")}
            </p>
            <AlertDialog
              open={deleteOpen}
              onOpenChange={(open) => {
                if (!remove.isPending) setDeleteOpen(open);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={busy}>
                  <Trash2 className="size-4" />
                  {t("delete_workspace")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("delete_workspace")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("workspace_delete_confirm", { name: existing.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {remove.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {t("workspace_delete_error")}
                    </AlertDescription>
                  </Alert>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={remove.isPending}>
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={busy}
                    onClick={(event) => {
                      event.preventDefault();
                      if (!busy) remove.mutate(undefined);
                    }}
                  >
                    {remove.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Page>
  );
}
