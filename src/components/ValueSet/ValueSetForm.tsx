import { ArrowLeft } from "lucide-react";
import { useNavigationPrompt } from "raviger";
import { useEffect, useRef, useState } from "react";
import type { FieldErrors, FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import type { ValueSetRead, ValueSetScope } from "@/types/valueSet/valueSet";

import { goBack } from "@/Utils/utils";

import { collectFormIssues, type FormIssue } from "./collectValueSetFormIssues";
import type { ScopedValueSet } from "./useScopedValueSets";
import { useValueSetEditorForm } from "./useValueSetEditorForm";
import { ValueSetBasedOnFields } from "./ValueSetBasedOnFields";
import { ValueSetBasicFields } from "./ValueSetBasicFields";
import { ValueSetCompositionFields } from "./ValueSetCompositionFields";
import { ValueSetFormErrors } from "./ValueSetFormErrors";
import { ValueSetFormPreview } from "./ValueSetFormPreview";
import type {
  ValueSetFormData,
  ValueSetFormState,
  ValueSetFormSubmit,
} from "./valueSetFormTypes";

export type {
  ValueSetFormData,
  ValueSetFormState,
  ValueSetFormSubmit,
} from "./valueSetFormTypes";

interface ValueSetFormProps {
  scope: ValueSetScope;
  initialData?: ValueSetRead;
  /** Pre-selected parent for a new set (the list's Customize action). */
  initialParent?: ValueSetRead;
  onSubmit: (data: ValueSetFormSubmit) => void;
  onCancel?: () => void;
  onStateChange?: (state: ValueSetFormState) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  /** Facility access is saved independently by its own field. Keeping it in
   *  this slot lets the editor present one coherent workspace without
   *  coupling access mutations to the value-set payload. */
  accessControl?: React.ReactNode;
}

export function ValueSetForm({
  scope,
  initialData,
  initialParent,
  onSubmit,
  onCancel,
  onStateChange,
  isSubmitting,
  isReadOnly,
  accessControl,
}: ValueSetFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [parent, setParent] = useState<ValueSetRead | undefined>(initialParent);
  // Mode changes also dirty the slug. Only direct edits should stop name-based
  // generation; otherwise switching out of Customize can strand an empty slug.
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [openRules, setOpenRules] = useState<{
    include: number | null;
    exclude: number | null;
  }>({
    include: initialData?.compose.include.length ? 0 : null,
    exclude: initialData?.compose.exclude.length ? 0 : null,
  });
  // The seeded parent always comes from the list's Shared catalogue, which is
  // the only place Customize is offered.
  const [parentScope, setParentScope] =
    useState<ScopedValueSet["authContext"]>("instance");
  const {
    form,
    inherited,
    showBasedOn,
    isSharedCatalogueReady,
    isSharedSlugCheckBlocked,
    showSharedCatalogueError,
    refetchSharedCatalogue,
  } = useValueSetEditorForm({ scope, initialData, initialParent });
  const pageTitle = initialData
    ? isReadOnly
      ? t("preview_value_set")
      : t("edit_value_set")
    : t("create_valueset");
  const isDirty = form.formState.isDirty;
  // The embedded sheet stores this snapshot in a ref for its close guard;
  // it does not mirror form values or rerender the parent on field edits.
  useEffect(() => {
    onStateChange?.({ isDirty, isSubmitting: !!isSubmitting });
  }, [isDirty, isSubmitting, onStateChange]);
  useNavigationPrompt(
    isDirty && !isSubmitting && !isReadOnly,
    t("unsaved_changes_warning"),
  );

  const focusIssue = (issue: FormIssue) => {
    const parts = issue.name.split(".");
    if (
      parts[0] === "compose" &&
      (parts[1] === "include" || parts[1] === "exclude")
    ) {
      setOpenRules((current) => ({ ...current, [parts[1]]: Number(parts[2]) }));
    }
    requestAnimationFrame(() => {
      const target = issue.name.endsWith(".display")
        ? (issue.name.replace(
            /\.display$/,
            ".code",
          ) as FieldPath<ValueSetFormData>)
        : issue.name;
      // Advanced filters can be collapsed independently of their rule.
      // Reveal every disclosure containing the field before focusing it.
      const control = formRef.current?.querySelector<HTMLElement>(
        `[name="${target}"]`,
      );
      let disclosure = control?.closest("details");
      while (disclosure) {
        disclosure.open = true;
        disclosure = disclosure.parentElement?.closest("details") ?? null;
      }
      form.setFocus(target);
      // Bring the focused control into view after opening its rule.
      document.activeElement?.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    });
  };
  const handleInvalid = (errors: FieldErrors<ValueSetFormData>) => {
    const firstIssue = collectFormIssues(errors)[0];
    if (firstIssue) focusIssue(firstIssue);
  };
  const saveButton = (
    <Button
      variant="primary"
      type="submit"
      aria-label={isSubmitting ? t("saving") : t("save_valueset")}
      disabled={isSubmitting || !isDirty || isSharedSlugCheckBlocked}
      className="h-11 shadow-none lg:h-9"
    >
      {isSubmitting ? t("saving") : t("save")}
    </Button>
  );

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={(event) => {
          void form.handleSubmit((data) => {
            // Disabled buttons do not cover keyboard or programmatic submit.
            // Explicit customizations and existing edits need no collision check.
            if (showBasedOn && !data.inherited && !isSharedCatalogueReady) {
              return;
            }
            if (!isReadOnly && !isSubmitting) onSubmit(data);
          }, handleInvalid)(event);
        }}
        className="space-y-6"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-500"
              disabled={isSubmitting}
              onClick={onCancel ?? (() => goBack(scope.basePath))}
              aria-label={onCancel ? t("cancel") : t("valueset_back_to_list")}
            >
              <ArrowLeft aria-hidden className="size-4" />
            </Button>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-xl leading-7 font-semibold tracking-tight text-gray-900">
                {pageTitle}
              </h1>
              {isReadOnly && (
                <Badge variant="secondary">{t("read_only")}</Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ValueSetFormPreview control={form.control} hasParent={!!parent} />
            {!isReadOnly && <div className="hidden lg:block">{saveButton}</div>}
          </div>
        </header>

        <ValueSetFormErrors control={form.control} onFocusIssue={focusIssue} />

        <div className="space-y-7">
          <div className="min-w-0 space-y-7">
            {showBasedOn && scope.authContext === "facility" && (
              <ValueSetBasedOnFields
                facilityId={scope.facilityId}
                form={form}
                parent={parent}
                parentScope={parentScope}
                isSlugManuallyEdited={isSlugManuallyEdited}
                onParentChange={(next, nextScope) => {
                  setParent(next);
                  setParentScope(nextScope);
                }}
                disabled={isReadOnly || isSubmitting}
              />
            )}

            <ValueSetBasicFields
              form={form}
              initialData={initialData}
              inherited={inherited}
              isSlugManuallyEdited={isSlugManuallyEdited}
              onSlugManuallyEdited={() => setIsSlugManuallyEdited(true)}
              disabled={isReadOnly || isSubmitting}
              isSharedSlugCheckBlocked={isSharedSlugCheckBlocked}
              showSharedCatalogueError={showSharedCatalogueError}
              onRetrySharedCatalogue={() => void refetchSharedCatalogue()}
            />

            {accessControl && (
              <Card className="shadow-none">
                <CardContent className="p-4 sm:p-5">
                  {accessControl}
                </CardContent>
              </Card>
            )}

            <ValueSetCompositionFields
              form={form}
              hasParentRules={!!(initialData || parent)}
              disabled={isReadOnly || isSubmitting}
              isReadOnly={isReadOnly}
              isDirty={isDirty}
              openRules={openRules}
              onOpenRule={(type, index) =>
                setOpenRules((current) => ({ ...current, [type]: index }))
              }
            />
          </div>

          {isReadOnly && (
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700">
              {t("no_permission_to_edit_valueset")}
            </div>
          )}
        </div>
        {!isReadOnly && (
          <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:hidden">
            <p role="status" className="text-sm text-gray-500">
              {t(isDirty ? "valueset_unsaved_changes" : "no_changes_to_save")}
            </p>
            {saveButton}
          </div>
        )}
      </form>
    </Form>
  );
}
