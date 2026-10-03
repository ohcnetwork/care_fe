import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, navigate, useNavigationPrompt } from "raviger";
import { useMemo } from "react";
import { flushSync } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ImmunizationPolicyRead,
  ImmunizationPolicyScope,
} from "@/types/emr/immunizationPolicy/immunizationPolicy";
import immunizationPolicyApi from "@/types/emr/immunizationPolicy/immunizationPolicyApi";

import { PolicyTemplateEditor } from "./PolicyTemplateEditor";
import {
  newPolicyTemplate,
  normalizePolicyTemplate,
  policySchema,
} from "./policySchema";
import { useImmunizationPolicyAccess } from "./useImmunizationPolicyAccess";
import { useImmunizationPolicyOwnership } from "./useImmunizationPolicyOwnership";

interface ImmunizationPolicyFormProps {
  scope: ImmunizationPolicyScope;
  id?: string;
}

export default function ImmunizationPolicyForm({
  scope,
  id,
}: ImmunizationPolicyFormProps) {
  const { t } = useTranslation();
  const access = useImmunizationPolicyAccess(scope);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["immunization-policies", "detail", id],
    queryFn: query(immunizationPolicyApi.retrieve, {
      pathParams: { id: id ?? "" },
    }),
    enabled: !!id && access.canRead,
  });
  const ownership = useImmunizationPolicyOwnership(scope, data);
  const canEdit = access.canWrite && (!id || ownership.canEditHere);
  const wrongScope =
    data?.facility != null && data.facility !== scope.facilityId;
  const accessDenied = !access.canRead || (!id && !access.canWrite);

  if (
    access.isLoading ||
    ownership.isLoading ||
    (id && access.canRead && isLoading)
  ) {
    return (
      <Page title={t("immunization_policies")} hideTitleOnPage>
        <FormSkeleton rows={6} />
      </Page>
    );
  }

  if (accessDenied || wrongScope || (id && !data)) {
    return (
      <Page title={t("immunization_policies")} hideTitleOnPage>
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>
              {t(
                accessDenied
                  ? "immunization_policy_access_denied"
                  : "immunization_policy_load_error",
              )}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={scope.basePath} basePath="/">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Link>
            </Button>
            {isError && (
              <Button variant="outline" onClick={() => refetch()}>
                {t("immunization_retry")}
              </Button>
            )}
          </div>
        </div>
      </Page>
    );
  }

  return (
    <ImmunizationPolicyEditor
      key={`${scope.basePath}/${id ?? "new"}`}
      scope={scope}
      existing={data}
      canEdit={canEdit}
      ownership={
        id ? ownership.ownership : scope.facilityId ? "facility" : "instance"
      }
      onRetryOwnership={ownership.refetch}
    />
  );
}

interface ImmunizationPolicyEditorProps {
  scope: ImmunizationPolicyScope;
  existing?: ImmunizationPolicyRead;
  canEdit: boolean;
  ownership: "instance" | "facility" | "unknown";
  onRetryOwnership: () => Promise<void>;
}

function ImmunizationPolicyEditor({
  scope,
  existing,
  canEdit,
  ownership,
  onRetryOwnership,
}: ImmunizationPolicyEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const schema = useMemo(() => policySchema(t), [t]);
  type FormValues = z.infer<typeof schema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      policy_template: existing
        ? normalizePolicyTemplate(existing.policy_template)
        : newPolicyTemplate(),
    },
  });
  const template = useWatch({ control: form.control, name: "policy_template" });
  const validation =
    form.formState.submitCount > 0
      ? schema.safeParse(form.getValues())
      : undefined;
  const issues =
    validation && !validation.success ? validation.error.issues : [];
  const isDirty = form.formState.isDirty;
  useNavigationPrompt(isDirty, t("unsaved_changes_warning"));

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["immunization-policies"] });
    toast.success(
      t(
        existing
          ? "immunization_policy_updated"
          : "immunization_policy_created",
      ),
    );
    flushSync(() => form.reset(form.getValues()));
    navigate(scope.basePath);
  };

  const create = useMutation({
    mutationFn: mutate(immunizationPolicyApi.create),
    onSuccess: handleSaved,
  });
  const update = useMutation({
    mutationFn: mutate(immunizationPolicyApi.update, {
      pathParams: { id: existing?.id ?? "" },
    }),
    onSuccess: handleSaved,
  });
  const isPending = create.isPending || update.isPending;
  const disabled = !canEdit || isPending;
  const title = existing?.name ?? t("immunization_policy_new");
  const shared = !!scope.facilityId && ownership === "instance";
  const unknownScope = !!existing && ownership === "unknown";

  return (
    <Page title={title} hideTitleOnPage>
      <Form {...form}>
        <form
          noValidate
          className="mx-auto max-w-6xl space-y-6 pb-8"
          onSubmit={form.handleSubmit((values) => {
            if (!canEdit || isPending) return;
            if (existing) update.mutate(values);
            else
              create.mutate({ ...values, facility: scope.facilityId ?? null });
          })}
        >
          <header className="space-y-4 border-b border-gray-200 pb-5">
            <Link
              href={scope.basePath}
              basePath="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              {t("immunization_policies")}
            </Link>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="break-words text-2xl font-semibold tracking-tight text-gray-950">
                    {title}
                  </h1>
                  <Badge variant="outline" size="xs">
                    {t(`immunization_scope_${ownership}`)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {t("immunization_policy_editor_hint")}
                </p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-3">
                  {isDirty && (
                    <span className="text-xs text-gray-500">
                      {t("immunization_unsaved")}
                    </span>
                  )}
                  <Button
                    type="submit"
                    disabled={isPending || (!!existing && !isDirty)}
                    className="ml-auto h-10 sm:ml-0"
                  >
                    {isPending && (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {t("immunization_policy_save")}
                  </Button>
                </div>
              )}
            </div>
          </header>

          {!canEdit && (
            <Alert>
              <AlertTitle>{t("read_only")}</AlertTitle>
              <AlertDescription>
                {t(
                  unknownScope
                    ? "immunization_policy_unknown_scope"
                    : shared
                      ? "immunization_policy_shared_read_only"
                      : "immunization_policy_read_only",
                )}
                {unknownScope && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onRetryOwnership}
                    className="mt-2"
                  >
                    {t("immunization_retry")}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
          {(create.isError || update.isError) && (
            <Alert variant="destructive">
              <AlertTitle>{t("error")}</AlertTitle>
              <AlertDescription>
                {t("immunization_policy_save_error")}
              </AlertDescription>
            </Alert>
          )}
          {issues.length > 0 && (
            <Alert variant="destructive" role="alert">
              <AlertTitle>
                {t("immunization_policy_validation_title")}
              </AlertTitle>
              <AlertDescription>
                {t("immunization_policy_validation_hint")}
              </AlertDescription>
            </Alert>
          )}

          <fieldset
            disabled={disabled}
            className="grid items-start gap-4 border-b border-gray-200 pb-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
          >
            <legend className="sr-only">{t("basic_information")}</legend>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>
                    {t("immunization_policy_name")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={255} />
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
                    <Textarea {...field} rows={1} className="min-h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          <PolicyTemplateEditor
            value={template}
            title={t("immunization_recommendation_template")}
            disabled={disabled}
            issues={issues}
            onChange={(value) =>
              form.setValue("policy_template", value, {
                shouldDirty: true,
                shouldValidate: form.formState.submitCount > 0,
              })
            }
          />
        </form>
      </Form>
    </Page>
  );
}
