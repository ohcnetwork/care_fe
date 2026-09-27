import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useStore } from "jotai";
import {
  ArrowLeft,
  Bookmark,
  Loader2,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { FIXED_QUESTIONNAIRES } from "@/components/Questionnaire/data/StructuredFormData";
import { useFormRenderer } from "@/components/QuestionnaireV2/form/FormContext";
import {
  errorsAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import useAuthUser from "@/hooks/useAuthUser";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type {
  QuestionnaireAnswer,
  QuestionnaireResponseTemplateReadSpec,
  QuestionnaireResponseTemplateRetrieveSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

import {
  applyFormTemplate,
  captureFormTemplate,
  type FormTemplateApplyMode,
  previewFormTemplate,
} from "./formTemplate";
import { hydrateStructuredTemplateEntries } from "./structuredTemplate";

type View = "list" | "save" | "preview";

/** Form templates use the existing API's metadata container. Keeping structured
 * answers inside `questionnaire` also isolates them from legacy order editors. */
export function FormTemplateSheet() {
  const { t } = useTranslation();
  const { questionnaire, subject, frozen } = useFormRenderer();
  const currentUser = useAuthUser();
  const { hasPermission } = usePermissions();
  const { facility } = useCurrentFacilitySilently();
  const facilityId = subject.facilityId;
  const canWrite = hasPermission(
    "can_write_questionnaire_response_template",
    facilityId ? (facility?.permissions ?? []) : undefined,
  );
  const store = useStore();
  const responses = useAtomValue(responsesAtom);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [savedEntries, setSavedEntries] = useState<QuestionnaireAnswer[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [active, setActive] =
    useState<QuestionnaireResponseTemplateRetrieveSpec>();
  const [hydrated, setHydrated] = useState<
    Record<string, QuestionnaireResponse>
  >({});
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [mode, setMode] = useState<FormTemplateApplyMode>("empty");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const requestVersion = useRef(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const frozenRef = useRef(frozen);
  const mountedRef = useRef(false);
  useEffect(() => {
    frozenRef.current = frozen;
  }, [frozen]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const queryKey = [
    "questionnaireResponseTemplates",
    "form",
    currentUser.id,
    facilityId ?? null,
    questionnaire.id,
  ];
  const captured = useMemo(
    () => captureFormTemplate(questionnaire, responses),
    [questionnaire, responses],
  );
  const templatesQuery = useQuery({
    queryKey,
    queryFn: query.paginated(questionnaireResponseTemplateApi.list, {
      queryParams: { facility: facilityId, key_filter: "questionnaire" },
    }),
    enabled: open && view === "list",
  });
  const templates = (templatesQuery.data?.results ?? []).filter((template) => {
    const meta = template.template_data.meta;
    return (
      meta?.kind === "form" &&
      meta.schema_version === 1 &&
      meta.questionnaire_id === questionnaire.id &&
      (meta.facility_id ?? null) === (facilityId ?? null) &&
      template.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    );
  });
  const entries = useMemo(
    () => active?.template_data.questionnaire ?? [],
    [active],
  );
  const plan = useMemo(
    () => applyFormTemplate(questionnaire, responses, entries, mode, hydrated),
    [questionnaire, responses, entries, mode, hydrated],
  );
  const skipped = [...new Set([...unavailable, ...plan.unavailable])];
  const isOwnTemplate = active?.created_by?.id === currentUser.id;

  const close = () => {
    requestVersion.current++;
    setOpen(false);
    setLoading(false);
    setError("");
  };
  const create = useMutation({
    mutationFn: mutate(questionnaireResponseTemplateApi.create),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates"],
      });
      close();
      toast.success(t("form_template_saved"));
    },
    onError: () => setError(t("form_template_save_failed")),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      mutate(questionnaireResponseTemplateApi.delete, { pathParams: { id } })(
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaireResponseTemplates"],
      });
      setConfirmDelete(false);
      setActive(undefined);
      setView("list");
      toast.success(t("form_template_deleted"));
    },
    onError: () => setError(t("failed_to_delete_template")),
  });
  const busy = loading || create.isPending || remove.isPending;

  const openSave = (trigger?: HTMLButtonElement) => {
    requestVersion.current++;
    if (trigger) triggerRef.current = trigger;
    const snapshot = captureFormTemplate(
      questionnaire,
      store.get(responsesAtom),
    );
    setSavedEntries(snapshot.entries);
    setExcluded(snapshot.excluded);
    setSelected(snapshot.entries.map((entry) => entry.question_id));
    setName("");
    setDescription("");
    setError("");
    setLoading(false);
    setView("save");
    setOpen(true);
  };
  const openList = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    requestVersion.current++;
    setSearch("");
    setError("");
    setLoading(false);
    setView("list");
    setOpen(true);
  };
  const selectTemplate = async (
    template: QuestionnaireResponseTemplateReadSpec,
  ) => {
    if (!template.id) return;
    const version = ++requestVersion.current;
    setView("preview");
    setActive(undefined);
    setHydrated({});
    setUnavailable([]);
    setMode("empty");
    setLoading(true);
    setError("");
    try {
      const details = await callApi(questionnaireResponseTemplateApi.retrieve, {
        pathParams: { id: template.id },
      });
      const meta = details.template_data.meta;
      if (
        meta?.kind !== "form" ||
        meta.schema_version !== 1 ||
        meta.questionnaire_id !== questionnaire.id ||
        (meta.facility_id ?? null) !== (facilityId ?? null)
      )
        throw new Error("Template scope changed");
      const resolved = await hydrateStructuredTemplateEntries(
        questionnaire,
        details.template_data.questionnaire ?? [],
        { subject, currentUser },
      );
      if (!mountedRef.current || version !== requestVersion.current) return;
      setActive(details);
      setHydrated(resolved.responses);
      setUnavailable(resolved.unavailable);
    } catch {
      if (mountedRef.current && version === requestVersion.current)
        setError(t("form_template_load_failed"));
    } finally {
      if (mountedRef.current && version === requestVersion.current)
        setLoading(false);
    }
  };
  const handleSave = () => {
    if (frozen || !canWrite || !name.trim() || !selected.length || busy) return;
    create.mutate({
      name: name.trim(),
      description: description.trim(),
      facility: facilityId,
      users: [],
      facility_organizations: [],
      // The backend's legacy questionnaire field accepts only a bare slug.
      // Metadata keeps form UUIDs unambiguous until UUID association is supported.
      template_data: {
        questionnaire: savedEntries.filter((entry) =>
          selected.includes(entry.question_id),
        ),
        meta: {
          kind: "form",
          schema_version: 1,
          questionnaire_id: questionnaire.id,
          questionnaire_version:
            questionnaire.internal_revision ?? questionnaire.version ?? null,
          facility_id: facilityId ?? null,
        },
      },
    });
  };
  const handleApply = () => {
    if (frozen || busy || !active || !plan.appliedCount) return;
    const before = store.get(responsesAtom);
    const result = applyFormTemplate(
      questionnaire,
      before,
      entries,
      mode,
      hydrated,
    );
    if (!result.appliedCount) return;
    store.set(responsesAtom, result.responses);
    // Only clear errors on fields actually changed by this application.
    const changedIds = new Set(
      Object.keys(result.responses).filter(
        (id) => result.responses[id] !== before[id],
      ),
    );
    const errorsBefore = store.get(errorsAtom);
    store.set(
      errorsAtom,
      errorsBefore.filter((item) => !changedIds.has(item.question_id)),
    );
    close();
    toast.success(t("form_template_applied"), {
      action: {
        label: t("form_template_undo"),
        onClick: () => {
          if (
            !mountedRef.current ||
            frozenRef.current ||
            store.get(responsesAtom) !== result.responses
          ) {
            toast.info(t("form_template_undo_unavailable"));
            return;
          }
          store.set(responsesAtom, before);
          store.set(errorsAtom, errorsBefore);
        },
      },
    });
  };

  // Quick order forms keep their existing order-template UI; they have no stable
  // questionnaire record to identify a reusable whole-form template.
  if (FIXED_QUESTIONNAIRES[questionnaire.id]) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={frozen}
          onClick={(event) => openList(event.currentTarget)}
        >
          <Bookmark className="size-4" />
          {t("form_template_use")}
        </Button>
        {canWrite && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              frozen || (!captured.answerCount && !captured.excluded.length)
            }
            onClick={(event) => openSave(event.currentTarget)}
          >
            <Save className="size-4" />
            {t("form_template_save_as")}
          </Button>
        )}
      </div>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next && !create.isPending && !remove.isPending) close();
        }}
      >
        <SheetContent
          className="flex flex-col gap-0 p-0 sm:max-w-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <SheetHeader className="border-b bg-gray-50 p-5 pr-10 text-left">
            <div className="flex items-center gap-2">
              {view !== "list" && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  aria-label={t("back")}
                  disabled={busy}
                  onClick={() => {
                    requestVersion.current++;
                    setView("list");
                    setError("");
                  }}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <SheetTitle>
                {t(
                  view === "save"
                    ? "form_template_save_title"
                    : view === "preview"
                      ? "form_template_preview"
                      : "form_templates",
                )}
              </SheetTitle>
            </div>
            <SheetDescription>{questionnaire.title}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {view === "save" && (
              <>
                <p className="text-sm text-gray-600">
                  {t("form_template_save_help")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="form-template-name">
                    {t("form_template_name")}
                  </Label>
                  <Input
                    id="form-template-name"
                    value={name}
                    maxLength={255}
                    onChange={(event) => setName(event.target.value)}
                    disabled={create.isPending || frozen}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-template-description">
                    {t("form_template_description_optional")}
                  </Label>
                  <Textarea
                    id="form-template-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={create.isPending || frozen}
                  />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    {t("form_template_included", { count: selected.length })}
                  </h3>
                  <div className="divide-y rounded-lg border">
                    {previewFormTemplate(savedEntries, t).map((entry) => (
                      <label
                        key={entry.id}
                        className="flex cursor-pointer items-start gap-3 p-3"
                      >
                        <Checkbox
                          aria-label={t("form_template_include", {
                            label: entry.label,
                          })}
                          checked={selected.includes(entry.id)}
                          disabled={create.isPending || frozen}
                          onCheckedChange={(checked) =>
                            setSelected((ids) =>
                              checked
                                ? [...ids, entry.id]
                                : ids.filter((id) => id !== entry.id),
                            )
                          }
                        />
                        <span className="min-w-0 space-y-1 text-sm">
                          <span className="block font-medium">
                            {entry.label}
                          </span>
                          <span className="block whitespace-pre-wrap break-words text-gray-600">
                            {entry.value}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {!!excluded.length && (
                  <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="font-medium">{t("form_template_excluded")}</p>
                    <p className="mt-1">{excluded.join(", ")}</p>
                    <p className="mt-1">{t("form_template_excluded_help")}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  {t("form_template_private_help")}
                </p>
              </>
            )}
            {view === "list" && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    aria-label={t("form_template_search")}
                    placeholder={t("form_template_search")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                {templatesQuery.isLoading ? (
                  <Loader2
                    className="mx-auto size-5 animate-spin"
                    aria-label={t("loading")}
                  />
                ) : templatesQuery.isError ? (
                  <div className="space-y-3">
                    <p role="alert" className="text-sm text-red-700">
                      {t("form_template_load_failed")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => templatesQuery.refetch()}
                    >
                      {t("form_template_retry")}
                    </Button>
                  </div>
                ) : templates.length ? (
                  <div className="divide-y rounded-lg border">
                    {templates.map((template) => (
                      <button
                        type="button"
                        key={template.id}
                        className="flex w-full items-start gap-3 p-4 text-left hover:bg-gray-50 focus-visible:outline-primary-700"
                        onClick={() => selectTemplate(template)}
                      >
                        <Bookmark className="mt-0.5 size-4 shrink-0 text-primary-700" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {template.name}
                          </span>
                          {template.description && (
                            <span className="mt-1 block break-words text-sm text-gray-600">
                              {template.description}
                            </span>
                          )}
                          <span className="mt-2 block text-xs text-gray-500">
                            {t("form_template_answers", {
                              count:
                                template.template_data.questionnaire?.length ??
                                0,
                            })}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Bookmark className="mx-auto mb-3 size-8 text-gray-400" />
                    <p className="font-medium">
                      {t(
                        search
                          ? "no_templates_match_search"
                          : "no_templates_yet",
                      )}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {t(
                        search
                          ? "try_different_search_terms"
                          : "form_template_empty_help",
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
            {view === "preview" &&
              (loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm">
                  <Loader2 className="size-5 animate-spin" />
                  {t("loading")}
                </div>
              ) : (
                active && (
                  <>
                    <div>
                      <h3 className="font-semibold">{active.name}</h3>
                      {active.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {active.description}
                        </p>
                      )}
                    </div>
                    {active.template_data.meta?.questionnaire_version !==
                      (questionnaire.internal_revision ??
                        questionnaire.version ??
                        null) && (
                      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                        {t("form_template_version_changed")}
                      </p>
                    )}
                    <RadioGroup
                      value={mode}
                      onValueChange={(value) =>
                        setMode(value as FormTemplateApplyMode)
                      }
                      className="gap-3"
                      disabled={frozen}
                    >
                      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                        <RadioGroupItem
                          value="empty"
                          aria-label={t("form_template_fill_empty")}
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {t("form_template_fill_empty")}
                          </span>
                          <span className="mt-1 block text-sm text-gray-600">
                            {t("form_template_fill_empty_help")}
                          </span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                        <RadioGroupItem
                          value="replace"
                          aria-label={t("form_template_replace")}
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {t("form_template_replace")}
                          </span>
                          <span className="mt-1 block text-sm text-gray-600">
                            {t("form_template_replace_help")}
                          </span>
                        </span>
                      </label>
                    </RadioGroup>
                    <p className="text-sm text-gray-600">
                      {t("form_template_apply_summary", {
                        apply: plan.appliedCount,
                        keep: plan.preservedCount,
                      })}
                    </p>
                    <div className="divide-y rounded-lg border">
                      {previewFormTemplate(
                        entries.map((entry) => ({
                          ...entry,
                          answer: hydrated[entry.question_id]
                            ? { ...hydrated[entry.question_id] }
                            : entry.answer,
                        })),
                        t,
                      ).map((entry) => (
                        <div key={entry.id} className="space-y-1 p-3 text-sm">
                          <p className="font-medium">{entry.label}</p>
                          <p className="whitespace-pre-wrap break-words text-gray-600">
                            {entry.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    {!!skipped.length && (
                      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                        <p className="font-medium">
                          {t("form_template_skipped")}
                        </p>
                        <p className="mt-1">{skipped.join(", ")}</p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      {t("form_template_review_before_submit")}
                    </p>
                  </>
                )
              ))}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-white p-4">
            {view === "list" && canWrite && (
              <Button
                variant="outline"
                disabled={
                  frozen || (!captured.answerCount && !captured.excluded.length)
                }
                onClick={() => openSave()}
              >
                <Save className="size-4" />
                {t("form_template_save_as")}
              </Button>
            )}
            {view === "save" && (
              <>
                <Button
                  variant="ghost"
                  onClick={close}
                  disabled={create.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  disabled={frozen || busy || !name.trim() || !selected.length}
                  onClick={handleSave}
                >
                  {create.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {t("form_template_save")}
                </Button>
              </>
            )}
            {view === "preview" && (
              <>
                {isOwnTemplate && canWrite && (
                  <Button
                    className="mr-auto"
                    variant="ghost"
                    size="icon"
                    aria-label={t("delete_template")}
                    disabled={busy || frozen}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={close}
                  disabled={remove.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  disabled={frozen || busy || !active || !plan.appliedCount}
                  onClick={handleApply}
                >
                  {t("form_template_apply")}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("delete_template")}
        description={t("delete_template_confirmation", {
          name: active?.name ?? "",
        })}
        confirmText={t("delete")}
        variant="destructive"
        disabled={remove.isPending || frozen}
        onConfirm={() => {
          if (active?.id && isOwnTemplate) remove.mutate(active.id);
        }}
      />
    </>
  );
}
