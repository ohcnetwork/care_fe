import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useNavigationPrompt } from "raviger";
import {
  ComponentProps,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Muted } from "@/components/ui/typography";

import { FillSessionTabs } from "@/components/QuestionnaireV2/fill/FillSessionTabs";
import { ReferralPatientHeader } from "@/components/Referral/ReferralPatientHeader";
import { ReferralQuestionnaireAnswers } from "@/components/Referral/ReferralQuestionnaireAnswers";
import { ReferralQuestionnaireForm } from "@/components/Referral/ReferralQuestionnaireForm";
import { referralResourceError } from "@/components/Referral/referralResourceError";
import { ReferralSharedRecords } from "@/components/Referral/ReferralSharedRecords";
import { ReferralStatusBadge } from "@/components/Referral/ReferralStatusBadge";
import { useReferralPermissions } from "@/components/Referral/useReferralPermissions";
import useAuthUser from "@/hooks/useAuthUser";
import { Code } from "@/types/base/code/code";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import {
  ReferralQuestionnaire,
  ReferralQuestionnaireResult,
  ReferralResponseCreate,
  ReferralRetrieve,
} from "@/types/emr/referral/referral";
import referralApi from "@/types/emr/referral/referralApi";
import query, { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

const RESPONSE_RECORD_CATEGORIES = ["response"] as const;

interface ResponseAttempt {
  body: ReferralResponseCreate;
  previousIds: string[];
  shouldComplete: boolean;
}

class ResponseDeliveryUnknownError extends Error {
  readonly silent = true;

  constructor(
    readonly attempt: ResponseAttempt,
    cause: unknown,
  ) {
    super("Response delivery could not be confirmed", { cause });
  }
}

// The API fills optional answer fields with null/empty defaults. Compare the
// submitted answers, not serialization differences or server-derived output.
function normalizeAnswers(results: ReferralQuestionnaireResult[]): unknown {
  const code = (value?: Code | null) =>
    value
      ? { system: value.system, code: value.code, display: value.display }
      : null;
  return results.map((result) => ({
    question_id: result.question_id,
    values: result.values.map((value) => ({
      value: value.value ?? null,
      unit: code(value.unit),
      coding: code(value.coding),
    })),
    note: result.note ?? null,
    taken_at: result.taken_at
      ? Number.isNaN(Date.parse(result.taken_at))
        ? result.taken_at
        : new Date(result.taken_at).toISOString()
      : null,
    body_site: code(result.body_site),
    method: code(result.method),
    sub_results: (result.sub_results ?? []).map(normalizeAnswers),
  }));
}

export function ReferralResponseEditor({
  referral,
  responseOnly,
  receivingEncounter,
  contextUnavailable = false,
  contextWarning,
  onClose,
  onPending = () => undefined,
  requestCloseRef,
  onCloseAutoFocus,
  page = false,
}: {
  referral: ReferralRetrieve;
  responseOnly: boolean;
  receivingEncounter?: EncounterRead;
  contextUnavailable?: boolean;
  contextWarning?: ReactNode;
  onClose: (retainAttempt?: boolean) => void;
  onPending?: (value: boolean) => void;
  requestCloseRef?: RefObject<(() => void) | null>;
  page?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
}) {
  const { t } = useTranslation();
  const formId = useId();
  const client = useQueryClient();
  const user = useAuthUser();
  const {
    canWrite,
    sourceFacilityId,
    canWriteAtDestination,
    destinationFacility,
  } = useReferralPermissions(referral);
  // A receiving doctor may gain read access to the source chart after opening
  // a local encounter. That must not make the originating encounter the
  // treatment context for a cross-facility response.
  const canUseSourceEncounter =
    !responseOnly ||
    !canWriteAtDestination ||
    sourceFacilityId === destinationFacility?.id;
  const encounterId =
    receivingEncounter?.id ??
    (canUseSourceEncounter && sourceFacilityId
      ? (referral.encounter ?? undefined)
      : undefined);
  const facilityId =
    receivingEncounter?.facility.id ??
    (canUseSourceEncounter ? sourceFacilityId : destinationFacility?.id);
  const recoveryKey = [
    "referral-response-recovery",
    user.id,
    referral.id,
    responseOnly,
  ] as const;
  // Keep an ambiguous delivery in memory across route changes, scoped to this
  // user/referral. It must be reconciled before another POST is possible.
  const { data: recovery } = useQuery<{
    attempt: ResponseAttempt;
    questionnaire: ReferralQuestionnaire;
  } | null>({
    queryKey: recoveryKey,
    queryFn: () => null,
    initialData: null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [leaving, setLeaving] = useState(false);
  const closeEditor = useCallback(
    (retainAttempt = false) => {
      if (page) flushSync(() => setLeaving(true));
      onClose(retainAttempt);
    },
    [onClose, page],
  );
  const [selectedId, setSelectedId] = useState(
    recovery?.questionnaire.id ?? "",
  );
  const [ready, setReady] = useState(false);
  const [responseSaved, setResponseSaved] = useState(false);
  const [lockedForm, setLockedForm] = useState<
    ReferralQuestionnaire | undefined
  >(recovery?.questionnaire);
  const [uncertainAttempt, setUncertainAttempt] = useState<
    ResponseAttempt | undefined
  >(recovery?.attempt);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    ReferralQuestionnaireResult[]
  >([]);
  const [dirty, setDirty] = useState(false);
  const [recordsDialogOpen, setRecordsDialogOpen] = useState(false);
  const [tab, setTab] = useState("response");
  const [discardAction, setDiscardAction] = useState<
    { type: "close" } | { type: "change"; formId: string }
  >();
  const completeAfterSave = useRef(false);
  const forms = useQuery({
    queryKey: ["referrals", "forms", referral.id],
    queryFn: query(referralApi.questionnaires, {
      pathParams: { referralId: referral.id },
      silent: true,
    }),
  });
  const choices = (forms.data?.results ?? []).filter(
    (form) =>
      (!!referral.encounter || form.subject_type === "patient") &&
      form.questionnaire_type === (responseOnly ? "response" : "request"),
  );
  const selected =
    lockedForm ?? choices.find((item) => item.id === selectedId) ?? choices[0];
  const formsAccessLost =
    forms.error instanceof HTTPError &&
    [401, 403, 404].includes(forms.error.status);
  const readReferral = () =>
    callApi(referralApi.get, {
      pathParams: { referralId: referral.id },
      silent: true,
    });
  const complete = useMutation({
    mutationFn: async (body: { status: "completed" }) => {
      const latest = await readReferral();
      if (latest.status === "completed") return latest;
      if (!["pending", "in_progress"].includes(latest.status)) {
        throw new HTTPError({
          message: "Referral status changed",
          status: 409,
          silent: true,
          cause: { detail: t("referral_response_completion_status_changed") },
        });
      }
      return callApi(referralApi.update, {
        pathParams: { referralId: referral.id },
        body,
        silent: true,
      });
    },
    retry: false,
    onMutate: () => onPending(true),
    onSettled: () => onPending(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["referrals"] });
      toast.success(t("referral_response_completed"));
      closeEditor();
    },
  });
  const handleResponseSaved = async (
    shouldComplete: boolean,
    status: ReferralRetrieve["status"],
  ) => {
    setResponseSaved(true);
    setUncertainAttempt(undefined);
    client.setQueryData(recoveryKey, null);
    await client.invalidateQueries({ queryKey: ["referrals"] });
    if (shouldComplete && ["pending", "in_progress"].includes(status)) {
      // Once saved, retry only the status change; never post the reply twice.
      await complete
        .mutateAsync({ status: "completed" })
        .catch(() => undefined);
    } else {
      toast.success(
        t(
          shouldComplete && status === "completed"
            ? "referral_response_completed"
            : "referral_response_saved",
        ),
      );
      closeEditor();
    }
  };
  const create = useMutation({
    mutationFn: async (body: ReferralResponseCreate) => {
      // A fresh baseline prevents an older identical answer from being mistaken
      // for this submission after a timeout. If this read fails, no POST is sent.
      const before = await readReferral();
      const attempt: ResponseAttempt = {
        body,
        previousIds: before.questionnaire_responses.map(
          (response) => response.id,
        ),
        shouldComplete: completeAfterSave.current,
      };
      try {
        await callApi(referralApi.addResponse, {
          pathParams: { referralId: referral.id },
          body,
          silent: true,
        });
      } catch (error) {
        if (
          !(error instanceof HTTPError) ||
          error.status >= 500 ||
          error.status === 408
        ) {
          throw new ResponseDeliveryUnknownError(attempt, error);
        }
        throw error;
      }
      return { shouldComplete: attempt.shouldComplete, status: before.status };
    },
    retry: false,
    onMutate: () => onPending(true),
    onSettled: () => onPending(false),
    onError: (error) => {
      if (error instanceof ResponseDeliveryUnknownError) {
        setUncertainAttempt(error.attempt);
        if (selected)
          client.setQueryData(recoveryKey, {
            attempt: error.attempt,
            questionnaire: selected,
          });
      } else {
        setLockedForm(undefined);
      }
    },
    onSuccess: ({ shouldComplete, status }) =>
      handleResponseSaved(shouldComplete, status),
  });
  const checkDelivery = useMutation({
    mutationFn: async (attempt: ResponseAttempt) => {
      const latest = await readReferral();
      const submitted = JSON.stringify(
        normalizeAnswers(attempt.body.questionnaire_response.results),
      );
      const matches = latest.questionnaire_responses.filter(
        (response) =>
          !attempt.previousIds.includes(response.id) &&
          response.created_by?.id === user.id &&
          response.questionnaire === attempt.body.questionnaire &&
          response.status === "completed" &&
          JSON.stringify(
            normalizeAnswers(response.questionnaire_response.results),
          ) === submitted,
      );
      return { confirmed: matches.length === 1, latest, attempt };
    },
    retry: false,
    onMutate: () => onPending(true),
    onSettled: () => onPending(false),
    onSuccess: async ({ confirmed, latest, attempt }) => {
      if (confirmed) {
        await handleResponseSaved(attempt.shouldComplete, latest.status);
      } else {
        // Keep the surrounding response list current for manual review while
        // preserving this form and its delivery hold.
        await client.invalidateQueries({ queryKey: ["referrals"] });
      }
    },
  });
  const busy =
    create.isPending || complete.isPending || checkDelivery.isPending;
  const frozen =
    !canWrite ||
    contextUnavailable ||
    busy ||
    responseSaved ||
    !!uncertainAttempt;
  useNavigationPrompt(
    page &&
      !leaving &&
      (busy ||
        recordsDialogOpen ||
        (dirty && !responseSaved) ||
        !!uncertainAttempt),
    t("unsaved_changes"),
  );
  const requestClose = useCallback(() => {
    if (busy || recordsDialogOpen) return;
    if (uncertainAttempt) {
      // The recovery cache preserves the submission across dialog or page exits.
      // Reopening reconciles this attempt instead of posting it again.
      closeEditor(true);
    } else if (dirty && !responseSaved) {
      setDiscardAction({ type: "close" });
    } else {
      closeEditor();
    }
  }, [
    busy,
    recordsDialogOpen,
    dirty,
    closeEditor,
    responseSaved,
    uncertainAttempt,
  ]);
  useEffect(() => {
    if (!requestCloseRef) return;
    requestCloseRef.current = requestClose;
    return () => {
      requestCloseRef.current = null;
    };
  }, [requestClose, requestCloseRef]);

  const changeForm = (id: string) => {
    setSelectedId(id);
    setReady(false);
    setDirty(false);
    create.reset();
  };
  const canSaveAndComplete =
    selected?.questionnaire_type === "response" &&
    ["pending", "in_progress"].includes(referral.status);
  const requests = referral.questionnaire_responses.filter(
    (response) =>
      response.questionnaire_type === "request" &&
      response.status === "completed",
  );

  const form = (
    <div className="space-y-5">
      {forms.error && selected && !formsAccessLost && !lockedForm && (
        <div
          role="alert"
          className="space-y-3 rounded-lg border border-border bg-muted p-3"
        >
          <p className="text-sm">
            {t("referral_response_forms_refresh_failed")}
          </p>
          <Button
            variant="outline"
            disabled={forms.isFetching}
            onClick={() => void forms.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {forms.isPending && !lockedForm ? (
        <p role="status">{t("loading")}</p>
      ) : forms.error && !lockedForm && (!selected || formsAccessLost) ? (
        <div className="space-y-3">
          <FieldError role="alert">
            {t("referral_forms_load_failed")}
          </FieldError>
          <Button variant="outline" onClick={() => forms.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : !selected ? (
        <Muted>{t("referral_no_active_forms")}</Muted>
      ) : (
        <>
          {choices.length > 1 ? (
            <Field>
              <FieldLabel htmlFor={`${formId}-form`}>
                {t("referral_form")}
              </FieldLabel>
              <Select
                value={selected.id}
                disabled={frozen}
                onValueChange={(id) => {
                  if (id === selected.id) return;
                  if (dirty) setDiscardAction({ type: "change", formId: id });
                  else changeForm(id);
                }}
              >
                <SelectTrigger id={`${formId}-form`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(lockedForm ? [lockedForm] : choices).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ·{" "}
                      {t(`referral_form_type_${item.questionnaire_type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {selected.title}
              </p>
              <Muted>
                {t(`referral_form_type_${selected.questionnaire_type}`)}
              </Muted>
              {selected.description && <Muted>{selected.description}</Muted>}
            </div>
          )}
          {uncertainAttempt || responseSaved ? (
            <ReferralQuestionnaireAnswers
              questions={selected.questions}
              results={
                uncertainAttempt?.body.questionnaire_response.results ??
                submittedAnswers
              }
            />
          ) : (
            <ReferralQuestionnaireForm
              key={selected.id}
              formId={formId}
              questionnaire={selected}
              patientId={referral.patient}
              encounterId={encounterId}
              facilityId={facilityId}
              disabled={frozen}
              hideHeader
              onReadyChange={setReady}
              onDirtyChange={setDirty}
              onSubmit={(results) => {
                if (ready && !frozen && !recordsDialogOpen) {
                  setLockedForm(selected);
                  setSubmittedAnswers(results);
                  create.mutate({
                    questionnaire: selected.id,
                    questionnaire_response: { results },
                  });
                }
              }}
            />
          )}
        </>
      )}
      {responseOnly && (
        <div className="border-t border-border pt-5">
          <ReferralSharedRecords
            referral={referral}
            canWrite={canWrite && !frozen && !lockedForm && !formsAccessLost}
            categories={RESPONSE_RECORD_CATEGORIES}
            receivingEncounter={receivingEncounter}
            title={t("referral_records_response")}
            description={t("referral_response_records_help")}
            onDialogOpenChange={setRecordsDialogOpen}
          />
        </div>
      )}
    </div>
  );
  const context = (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold">{referral.title}</h1>
        <p className="text-sm font-medium">{referral.patient_name}</p>
        <ReferralStatusBadge status={referral.status} />
        <p className="text-sm text-muted-foreground">
          {referral.availability_name}
        </p>
      </header>
      {referral.note && (
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {referral.note}
        </p>
      )}
      {requests.map((request) => (
        <section key={request.id} className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            {request.questionnaire_snapshot.title}
          </h3>
          <ReferralQuestionnaireAnswers
            questions={request.questionnaire_snapshot.questions}
            results={request.questionnaire_response.results}
          />
        </section>
      ))}
      {requests.length === 0 && (
        <Muted>{t("referral_response_no_request")}</Muted>
      )}
      <div className="border-t border-border pt-5">
        <ReferralSharedRecords referral={referral} canWrite={false} />
      </div>
    </div>
  );
  const footer = (
    <div className="max-h-[45dvh] shrink-0 space-y-3 overflow-y-auto border-t border-border p-4">
      {responseSaved && (
        <p role="status" className="text-sm text-primary">
          {t("referral_response_saved_completion_pending")}
        </p>
      )}
      {uncertainAttempt && (
        <div role="alert" className="space-y-3 rounded-lg bg-muted p-3">
          <p className="text-sm">{t("referral_response_delivery_unknown")}</p>
          {checkDelivery.data && !checkDelivery.data.confirmed && (
            <p className="text-sm text-muted-foreground">
              {t("referral_response_delivery_unconfirmed")}
            </p>
          )}
          {checkDelivery.error && (
            <FieldError>
              {referralResourceError(
                checkDelivery.error,
                t("referral_response_delivery_check_failed"),
              )}
            </FieldError>
          )}
          <Button
            variant="outline"
            disabled={busy || contextUnavailable}
            onClick={() => checkDelivery.mutate(uncertainAttempt)}
          >
            {checkDelivery.isPending && (
              <Spinner className="size-4 animate-spin" />
            )}
            {t("referral_response_check_saved")}
          </Button>
        </div>
      )}
      {complete.error && (
        <FieldError role="alert">
          {referralResourceError(complete.error, t("referral_update_failed"))}
        </FieldError>
      )}
      {create.error && !uncertainAttempt && !responseSaved && (
        <FieldError role="alert">
          {referralResourceError(
            create.error,
            t("referral_response_save_failed"),
          )}
        </FieldError>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={requestClose}
          disabled={busy || recordsDialogOpen}
        >
          {t(responseSaved || uncertainAttempt ? "close" : "cancel")}
        </Button>
        {responseSaved ? (
          <Button
            disabled={
              !canWrite ||
              contextUnavailable ||
              complete.isPending ||
              recordsDialogOpen
            }
            onClick={() => complete.mutate({ status: "completed" })}
          >
            {complete.isPending && <Spinner className="size-4 animate-spin" />}
            {t("referral_complete")}
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              form={formId}
              variant={
                responseOnly && canSaveAndComplete ? "outline" : "default"
              }
              disabled={!selected || !ready || frozen || recordsDialogOpen}
              onClick={() => {
                completeAfterSave.current = false;
                setTab("response");
              }}
            >
              {create.isPending && <Spinner className="size-4 animate-spin" />}
              {t(
                responseOnly
                  ? "referral_save_response"
                  : "referral_save_request_information",
              )}
            </Button>
            {canSaveAndComplete && (
              <Button
                type="submit"
                variant={responseOnly ? "default" : "outline"}
                form={formId}
                disabled={!ready || frozen || recordsDialogOpen}
                onClick={() => {
                  completeAfterSave.current = true;
                  setTab("response");
                }}
              >
                {t("referral_save_response_complete")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {page ? (
        <FillSessionTabs
          formTitle={t("referral_respond")}
          dirty={dirty && !responseSaved}
          onClose={requestClose}
          exitDisabled={busy || recordsDialogOpen}
          referenceTab={{
            title: t("referral_response_reference_tab"),
            content: context,
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
            <div className="mx-auto max-w-5xl space-y-5">
              <ReferralPatientHeader
                referral={referral}
                receivingEncounter={receivingEncounter}
              >
                <span className="text-sm text-muted-foreground">
                  {referral.title}
                </span>
              </ReferralPatientHeader>
              <section
                aria-label={t("referral_respond")}
                className="rounded-xl border border-border bg-background p-4 sm:p-6"
              >
                <h1 className="mb-5 text-xl font-semibold">
                  {t("referral_respond")}
                </h1>
                {contextWarning}
                {form}
              </section>
            </div>
          </div>
          <div className="bg-background">{footer}</div>
        </FillSessionTabs>
      ) : (
        <DialogContent
          className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <DialogHeader className="shrink-0 border-b border-border p-4 pr-12 text-left sm:p-5 sm:pr-12">
            <DialogTitle>
              {t(
                responseOnly
                  ? "referral_respond"
                  : "referral_add_request_information",
              )}
            </DialogTitle>
            <DialogDescription className="break-words text-foreground">
              <span className="font-medium">{referral.patient_name}</span> ·{" "}
              {referral.title}
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (typeof value === "string") setTab(value);
            }}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="shrink-0 border-b border-border px-4 pt-2 sm:px-5">
              <TabsList
                variant="line"
                aria-label={t("referral_response_context")}
              >
                <TabsTrigger value="response">
                  {t(
                    responseOnly
                      ? "referral_form_type_response"
                      : "referral_request_information",
                  )}
                </TabsTrigger>
                <TabsTrigger value="request">
                  {t("referral_response_request_tab")}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <TabsContent
                value="response"
                keepMounted
                hidden={tab !== "response"}
              >
                {form}
              </TabsContent>
              <TabsContent value="request">{context}</TabsContent>
            </div>
          </Tabs>
          {footer}
        </DialogContent>
      )}
      <AlertDialog
        open={!!discardAction}
        onOpenChange={(value) => {
          if (!value) setDiscardAction(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                responseOnly
                  ? "referral_response_discard_title"
                  : "discard_changes",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("referral_response_discard_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("referral_response_keep_editing")}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                const action = discardAction;
                setDiscardAction(undefined);
                if (action?.type === "change") changeForm(action.formId);
                else closeEditor();
              }}
            >
              {t("discard")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
