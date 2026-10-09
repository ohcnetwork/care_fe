import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Settings2,
  Trash2,
} from "lucide-react";
import { Link, navigate, useNavigationPrompt } from "raviger";
import { useCallback, useId, useState } from "react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useCareAppTabs } from "@/hooks/useCareApps";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";

import mutate from "@/Utils/request/mutate";
import { createEncounterWorkspaceSchema } from "@/types/workspace/encounterWorkspace";
import {
  WORKSPACE_AUTH_CONTEXTS,
  WorkspaceAuthContext,
  WorkspaceRead,
  WorkspaceScope,
} from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";

import { EncounterWorkspaceEditor } from "./EncounterWorkspaceEditor";
import { WorkspaceOrganizationsField } from "./WorkspaceOrganizationsField";
import { parseWorkspaceJson } from "./workspaceEditorUtils";

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

export function WorkspaceForm({
  scope,
  existing,
  allowedContexts,
}: WorkspaceFormProps) {
  const { t } = useTranslation();
  const formId = useId();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const pluginTabs = useCareAppTabs("encounterTabs");
  const encounterSchema = createEncounterWorkspaceSchema(
    Object.keys(pluginTabs),
  );
  const [isEditorValid, setIsEditorValid] = useState(true);
  const [invalidTemplateSnapshot, setInvalidTemplateSnapshot] = useState<
    string | null
  >(null);
  const [accessState, setAccessState] = useState({
    dirty: false,
    pending: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(!existing);
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
          const template = parseWorkspaceJson(value);
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
          template:
            invalidTemplateSnapshot ??
            JSON.stringify(existing.template, null, 2),
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
  const { getValues } = form;
  const handleEditorValidityChange = useCallback(
    (valid: boolean) => {
      setIsEditorValid(valid);
      // Invalid inspector drafts are local to the editor. Keep their underlying
      // template stable until a valid change reaches the form's dirty tracking.
      setInvalidTemplateSnapshot((snapshot) =>
        valid ? null : (snapshot ?? getValues("template")),
      );
    },
    [getValues, setIsEditorValid, setInvalidTemplateSnapshot],
  );
  const authContext = useWatch({ control: form.control, name: "authContext" });
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
  const dirty = form.formState.isDirty || accessState.dirty || !isEditorValid;
  useNavigationPrompt(dirty, t("unsaved_changes_warning"));

  const save = useMutation({
    mutationFn: (values: WorkspaceFormValues) => {
      const body = {
        name: values.name,
        description: values.description,
        template: parseWorkspaceJson(values.template),
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
        setIsEditorValid(true);
        setInvalidTemplateSnapshot(null);
        setDeleteOpen(false);
      });
      queryClient.invalidateQueries({ queryKey: ["workspace-user-defaults"] });
      toast.success(t("workspace_deleted"));
      navigate(returnPath);
    },
  });
  const busy = save.isPending || remove.isPending || accessState.pending;

  return (
    <Page title={title} hideTitleOnPage className="px-0 md:px-0">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
        <header className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white/95 px-1 py-4 backdrop-blur-sm sm:gap-4">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="shrink-0 rounded-lg border-gray-200 shadow-none"
            disabled={busy}
          >
            <Link
              href={returnPath}
              basePath="/"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("back")}</span>
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="w-full min-w-0 text-lg font-semibold tracking-tight text-gray-950 sm:w-auto sm:text-xl">
                {title}
                {existing && (
                  <>
                    <span
                      className="mx-2 hidden font-normal text-gray-300 sm:inline"
                      aria-hidden="true"
                    >
                      /
                    </span>
                    <span className="block truncate text-sm font-medium text-gray-600 sm:inline sm:whitespace-normal sm:break-words sm:text-xl sm:font-semibold">
                      {existing.name}
                    </span>
                  </>
                )}
              </h1>
              {!existing && (
                <Badge
                  variant="secondary"
                  className="shrink-0 border-gray-200 bg-gray-50 font-medium text-gray-600"
                >
                  {contextLabel[authContext]}
                </Badge>
              )}
            </div>
            <p className="mt-1 hidden text-sm leading-5 text-gray-500 sm:block">
              {t("workspace_editor_description")}
            </p>
          </div>
          <div className="ml-auto flex w-full shrink-0 items-center justify-end gap-4 sm:w-auto">
            <span
              className="hidden items-center gap-1.5 text-xs text-gray-500 xl:flex"
              role="status"
            >
              {form.formState.isDirty || !isEditorValid ? (
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
              ) : (
                <Check
                  className="size-3.5 text-primary-700"
                  aria-hidden="true"
                />
              )}
              {t(
                form.formState.isDirty || !isEditorValid
                  ? "workspace_unsaved_changes"
                  : "no_changes_to_save",
              )}
            </span>
            <Button
              type="submit"
              form={formId}
              disabled={
                busy ||
                !isEditorValid ||
                (!!existing && !form.formState.isDirty)
              }
              className="h-10 w-full rounded-lg px-5 shadow-none sm:w-auto"
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {t(existing ? "save_changes" : "create_workspace")}
            </Button>
          </div>
        </header>

        <Form {...form}>
          <form
            id={formId}
            noValidate
            onSubmit={form.handleSubmit(
              (values) => {
                if (busy || !isEditorValid) return;
                if (!existing && !allowedContexts.includes(values.authContext))
                  return;
                save.mutate(values);
              },
              (errors) => {
                if (errors.name || errors.description || errors.departmentId) {
                  flushSync(() => setSettingsOpen(true));
                }
              },
            )}
            className="space-y-6"
          >
            <Collapsible
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              className="rounded-xl border border-gray-200 bg-white"
              role="region"
              aria-labelledby="workspace-settings-heading"
            >
              <h2 id="workspace-settings-heading">
                <CollapsibleTrigger
                  type="button"
                  className="group flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:px-5"
                >
                  <Settings2 className="size-4 shrink-0 text-gray-500" />
                  <span>{t("workspace_general_settings")}</span>
                  <span className="ml-auto flex items-center gap-3">
                    {(accessState.dirty ||
                      form.formState.dirtyFields.name ||
                      form.formState.dirtyFields.description ||
                      form.formState.dirtyFields.authContext ||
                      form.formState.dirtyFields.departmentId) && (
                      <span className="text-xs text-amber-700">
                        {t("workspace_unsaved_changes")}
                      </span>
                    )}
                    <ChevronDown className="size-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
                  </span>
                </CollapsibleTrigger>
              </h2>
              <CollapsibleContent
                forceMount
                className="space-y-4 border-t border-gray-100 px-4 py-4 data-[state=closed]:hidden sm:px-5"
              >
                <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-gray-600">
                          {t("name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={busy}
                            autoComplete="off"
                            className="h-10 bg-gray-50/50 shadow-none"
                          />
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
                        <FormLabel className="text-xs font-medium text-gray-600">
                          {t("description")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={busy}
                            rows={1}
                            className="min-h-10 resize-y bg-gray-50/50 shadow-none"
                            placeholder={t("workspace_description_hint")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {!existing && scope.authContext === "facility" && (
                  <div className="grid items-start gap-5 border-t border-gray-100 pt-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="authContext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-600">
                            {t("workspace_ownership")}
                          </FormLabel>
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
                              <SelectTrigger className="h-10 w-full bg-gray-50/50 shadow-none">
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
                    <div className="space-y-2 text-sm leading-5 text-gray-500 md:pt-6">
                      <p>{contextDescription[authContext]}</p>
                      {authContext === "facility" && (
                        <p>{t("workspace_access_after_create")}</p>
                      )}
                    </div>
                    {authContext === "facility_organization" && (
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
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
                  </div>
                )}
                {!existing && scope.authContext === "instance" && (
                  <p className="border-t border-gray-100 pt-4 text-sm leading-5 text-gray-500">
                    {t("workspace_instance_access_after_create")}
                  </p>
                )}
                {existing && (
                  <WorkspaceOrganizationsField
                    scope={scope}
                    workspaceId={existing.id}
                    disabled={save.isPending || remove.isPending}
                    onStateChange={setAccessState}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>

            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <EncounterWorkspaceEditor
                    value={field.value}
                    onChange={field.onChange}
                    disabled={busy}
                    onValidityChange={handleEditorValidityChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {save.isError && (
              <Alert variant="destructive">
                <AlertDescription>{t("workspace_save_error")}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>

        {existing && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
            <p className="text-xs text-gray-500">
              {t("workspace_delete_hint")}
            </p>
            <AlertDialog
              open={deleteOpen}
              onOpenChange={(open) => {
                if (!remove.isPending) setDeleteOpen(open);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  className="text-gray-500 hover:bg-red-50 hover:text-red-700"
                >
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
