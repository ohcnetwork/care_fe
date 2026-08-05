import { BookmarkIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ResourceDefinitionCategoryPicker } from "@/components/Common/ResourceDefinitionCategoryPicker";
import UserSelector from "@/components/Common/UserSelector";
import ManageResponseTemplatesSheet from "@/components/Questionnaire/ManageResponseTemplatesSheet";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import {
  StructuredList,
  type StructuredColumn,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import { applyTemplateItems } from "@/components/QuestionnaireV2/structured/shared/responseTemplates/applyTemplateItems";
import { useAddToTemplate } from "@/components/QuestionnaireV2/structured/shared/responseTemplates/useAddToTemplate";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import useAuthUser from "@/hooks/useAuthUser";

import { add } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { getBasePrice } from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";
import type {
  ActivityDefinitionTemplateSpec,
  QuestionnaireResponseTemplateReadSpec,
} from "@/types/questionnaire/questionnaireResponseTemplate";
import type { UserReadMinimal } from "@/types/user/user";
import Decimal from "decimal.js";

import {
  buildServiceRequestForTemplate,
  newServiceRequestRow,
  projectValues,
  serviceRequestRowFromTemplate,
  type ServiceRequestRow,
} from "./model";

/** Sum of every linked charge-item definition's BASE price — the same
 *  computation `ServiceRequestQuestion.tsx:229-236` ran inline in the
 *  collapsed row header. Deliberately NOT in `model.ts` — see that
 *  module's own comment at this exact boundary: `@/Utils/decimal` reads
 *  `care.config.ts`'s `import.meta.env`, which crashes `model.test.ts`
 *  under this repo's plain-`node:test` unit harness. This file is never
 *  imported by that harness, so it is the safe home for this helper.
 *
 *  `?? []` is NOT defensive filler — verified live (mount session): the
 *  `activity_definition/` LIST endpoint (`listActivityDefinition`, what
 *  `ResourceDefinitionCategoryPicker` actually calls to hand this editor an
 *  `ActivityDefinitionReadSpec`) omits `charge_item_definitions` entirely
 *  for at least one real fixture ("Complete Blood Count (CBC) Panel"),
 *  unlike the single-item RETRIEVE endpoint, even though both share the
 *  same TS response type. Picking that definition threw `Cannot read
 *  properties of undefined (reading 'reduce')` out of `rowSummary`,
 *  tripping `StructuredSlot`'s plugin error boundary and hard-blocking the
 *  whole section ("This section couldn't be displayed... required — the
 *  form can't be saved"). `newServiceRequestRow`/`serviceRequestRowFromTemplate`
 *  never touch this field, so this is the only call site that needed it. */
function activityDefinitionPrice(
  activityDefinition: ActivityDefinitionReadSpec,
): Decimal {
  return (activityDefinition.charge_item_definitions ?? []).reduce(
    (total, definition) =>
      add(total, getBasePrice(definition.price_components)),
    new Decimal(0),
  );
}

/** Service requests are applied, never prefetched — there is no server row
 *  to convert into a baseline, ever (the legacy widget only ever wrote a
 *  response). Module scope, like `projectValues` — a fresh `[]` literal on
 *  every render would defeat `useStructuredRows`'s own memoization of it.
 *  Mirrors `ChargeItemEditor.tsx`'s `NO_BASELINE`. */
const NO_BASELINE: readonly BaselineRow<ServiceRequestRow>[] = [];

/** Fetches the full activity definition a template only stores by slug,
 *  then resolves it into a row. The ONE fetch both `handleApplyTemplate`
 *  and `handleAddSingleFromTemplate` need — legacy duplicated this same
 *  `query(activityDefinitionApi.retrieveActivityDefinition, ...)` call at
 *  both of its call sites. */
async function resolveTemplateServiceRequest(
  templateServiceRequest: ActivityDefinitionTemplateSpec,
  facilityId: string,
  encounterId: string,
  requester: UserReadMinimal,
): Promise<ServiceRequestRow> {
  const activityDefinition = await query(
    activityDefinitionApi.retrieveActivityDefinition,
    {
      pathParams: {
        facilityId,
        activityDefinitionSlug: templateServiceRequest.slug,
      },
    },
  )({ signal: new AbortController().signal });
  return serviceRequestRowFromTemplate(
    templateServiceRequest,
    activityDefinition,
    encounterId,
    requester,
  );
}

export function ServiceRequestEditor({
  question,
  disabled,
  errors,
  encounterId,
  facilityId,
  questionnaireSlug,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const currentUser = useAuthUser();

  // No explicit type arguments — `TRow` infers from `projectValues`, `Mode`
  // defaults to "list" (service_request is a genuine list, like
  // charge_item — never a singleton).
  const list = useStructuredRows({
    questionId: question.id,
    baseline: NO_BASELINE,
    projectValues,
    disabled,
  });

  const { dialog: addToTemplateDialog, openAddToTemplate } =
    useAddToTemplate<ServiceRequestRow>({
      questionnaireSlug,
      facilityId,
      itemKey: "activity_definition",
      itemType: "service_request",
      toTemplateSpec: buildServiceRequestForTemplate,
      itemDisplayName: (row) => row.service_request.title,
      messages: {
        addedToTemplate: "service_request_added_to_template",
        createdWithItem: "template_created_with_service_request",
      },
    });

  const handleApplyTemplate = useCallback(
    async (template: QuestionnaireResponseTemplateReadSpec) => {
      if (!facilityId || !encounterId) return;
      const rows = await applyTemplateItems(
        template.template_data?.activity_definition,
        (templateSR) =>
          resolveTemplateServiceRequest(
            templateSR,
            facilityId,
            encounterId,
            currentUser,
          ),
        template.name,
        {
          empty: "template_has_no_service_requests",
          allFailed: "failed_to_apply_template",
          partial: "template_partially_applied",
          success: "template_applied_service_requests",
        },
      );
      list.addRows(rows);
    },
    [facilityId, encounterId, currentUser, list],
  );

  const handleAddSingleFromTemplate = useCallback(
    async (templateSR: ActivityDefinitionTemplateSpec) => {
      if (!facilityId || !encounterId) return;
      try {
        const row = await resolveTemplateServiceRequest(
          templateSR,
          facilityId,
          encounterId,
          currentUser,
        );
        list.addRow(row);
      } catch {
        toast.error(t("failed_to_add_service_request"));
      }
    },
    [facilityId, encounterId, currentUser, list, t],
  );

  const columns: StructuredColumn<ServiceRequestRow>[] = useMemo(() => {
    const base: StructuredColumn<ServiceRequestRow>[] = [
      {
        key: "category",
        header: t("category"),
        width: "10rem",
        // The mobile card's own title already shows the request's title
        // (`rowTitle` below); the category badge appears in `rowSummary`.
        mobileHidden: true,
        render: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {t(row.row.service_request.category)}
          </Badge>
        ),
      },
      {
        key: "priority",
        header: t("priority"),
        width: "9rem",
        required: true,
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Select
            value={row.row.service_request.priority}
            onValueChange={(value: Priority) =>
              update({
                service_request: {
                  ...row.row.service_request,
                  priority: value,
                },
              })
            }
            disabled={cellDisabled}
          >
            <SelectTrigger {...controlProps} className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Priority).map((value) => (
                <SelectItem key={value} value={value}>
                  {t(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "body_site",
        header: t("body_site"),
        width: "minmax(10rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <ValueSetSelect
            system="system-body-site"
            value={row.row.service_request.body_site}
            onSelect={(code) =>
              update({
                service_request: {
                  ...row.row.service_request,
                  body_site: code,
                },
              })
            }
            placeholder={t("select_body_site")}
            disabled={cellDisabled}
            className="w-full"
            {...controlProps}
          />
        ),
      },
      {
        key: "requester",
        header: t("requester"),
        width: "minmax(12rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, ariaLabel }) => (
          <UserSelector
            selected={row.row.service_request.requester}
            onChange={(user) =>
              update({
                service_request: {
                  ...row.row.service_request,
                  requester: user,
                },
              })
            }
            placeholder={t("select_requester")}
            facilityId={facilityId}
            disabled={cellDisabled}
            aria-label={ariaLabel}
          />
        ),
      },
      {
        key: "patient_instruction",
        header: t("patient_instruction"),
        width: "minmax(12rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Textarea
            {...controlProps}
            value={row.row.service_request.patient_instruction ?? ""}
            onChange={(event) =>
              update({
                service_request: {
                  ...row.row.service_request,
                  patient_instruction: event.target.value,
                },
              })
            }
            placeholder={t("enter_patient_instructions")}
            disabled={cellDisabled}
          />
        ),
      },
      {
        key: "note",
        header: t("note"),
        width: "minmax(10rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Textarea
            {...controlProps}
            value={row.row.service_request.note ?? ""}
            onChange={(event) =>
              update({
                service_request: {
                  ...row.row.service_request,
                  note: event.target.value,
                },
              })
            }
            placeholder={t("add_notes")}
            disabled={cellDisabled}
          />
        ),
      },
      {
        key: "price",
        header: t("price"),
        width: "8rem",
        render: ({ row }) => (
          <MonetaryDisplay
            amount={activityDefinitionPrice(row.row.activity_definition_object)}
          />
        ),
      },
    ];

    // The row-level "Add to template" trigger — `StructuredList`'s actions
    // cell has room for exactly one action (Remove; anything more is
    // explicitly deferred to Phase 4, per that primitive's own doc
    // comment), so this rides inside its own narrow, icon-only column
    // instead. Only offered when this fill session actually has a
    // questionnaire slug to scope templates to — mirrors legacy's
    // `onAddToTemplate={questionnaireSlug ? handleAddToTemplate : undefined}`
    // gate (`ServiceRequestQuestion.tsx:953`).
    if (questionnaireSlug) {
      base.push({
        key: "add_to_template",
        header: t("add_to_template"),
        headerHidden: true,
        width: "3rem",
        render: ({ row, disabled: cellDisabled }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("add_to_template")}
            disabled={cellDisabled}
            onClick={() => openAddToTemplate(row.row)}
          >
            <BookmarkIcon className="h-4 w-4 text-gray-600" />
          </Button>
        ),
      });
    }

    return base;
  }, [t, facilityId, questionnaireSlug, openAddToTemplate]);

  return (
    <div className="space-y-2">
      {addToTemplateDialog}

      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.service_request.title}
      />

      <StructuredList
        questionId={question.id}
        label={t("structured_type__service_request")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={list.removeRow}
        rowTitle={(row) => row.row.service_request.title}
        rowSummary={(row) => {
          const requester = row.row.service_request.requester;
          return (
            <span className="flex flex-wrap items-center gap-1">
              <span>{t(row.row.service_request.category)}</span>
              <span>·</span>
              <MonetaryDisplay
                amount={activityDefinitionPrice(
                  row.row.activity_definition_object,
                )}
              />
              {requester && (
                <>
                  <span>·</span>
                  <span>{formatName(requester)}</span>
                </>
              )}
            </span>
          );
        }}
        addControl={
          <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex-1 min-w-[200px]">
              <ResourceDefinitionCategoryPicker<ActivityDefinitionReadSpec>
                facilityId={facilityId!}
                // The picker is a TRIGGER, not a value holder — mirrors
                // `ChargeItemEditor.tsx`'s identical use. Unlike legacy
                // (`ServiceRequestQuestion.tsx:614-675`), the picked
                // `ActivityDefinitionReadSpec` is used DIRECTLY — no
                // second `retrieveActivityDefinition` fetch, no
                // `selectedActivityDefinition`/`activityDefinitionsMap`
                // component state, no selection effect. The list endpoint
                // (`listDefinitions`, below) already returns the same
                // `ActivityDefinitionReadSpec` shape the retrieve endpoint
                // does.
                value={undefined}
                onValueChange={(selected) => {
                  if (!selected || Array.isArray(selected) || !encounterId) {
                    return;
                  }
                  list.addRow(
                    newServiceRequestRow(selected, encounterId, currentUser),
                  );
                }}
                placeholder={t("select_activity_definition")}
                disabled={disabled}
                className="w-full"
                resourceType={ResourceCategoryResourceType.activity_definition}
                listDefinitions={{
                  queryFn: activityDefinitionApi.listActivityDefinition,
                  pathParams: { facilityId: facilityId! },
                  queryParams: { status: Status.active },
                }}
                translationBaseKey="activity_definition"
              />
            </div>
            {questionnaireSlug && (
              <ManageResponseTemplatesSheet
                questionnaireSlug={questionnaireSlug}
                facilityId={facilityId}
                onTemplateSelect={handleApplyTemplate}
                onActivityDefinitionSelect={handleAddSingleFromTemplate}
                disabled={disabled}
                key_filter="activity_definition"
                currentActivityDefinitions={list.rows.map((row) =>
                  buildServiceRequestForTemplate(row.row),
                )}
              />
            )}
          </div>
        }
      />
    </div>
  );
}
