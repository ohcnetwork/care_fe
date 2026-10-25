import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2, Plus } from "lucide-react";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/careui/button";
import { Field, FieldError, FieldLabel } from "@/components/careui/field";
import { Input } from "@/components/careui/input";
import { Textarea } from "@/components/careui/textarea";
import { FillHeader } from "@/components/QuestionnaireV2/fill/FillHeader";
import { FillSessionTabs } from "@/components/QuestionnaireV2/fill/FillSessionTabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/context/PermissionContext";
import { cn } from "@/lib/utils";
import { EncounterRead } from "@/types/emr/encounter/encounter";
import patientApi from "@/types/emr/patient/patientApi";
import {
  ReferralAvailabilityRead,
  ReferralCreate,
  ReferralEndpoint,
  ReferralQuestionnaireResult,
  ReferralRetrieve,
} from "@/types/emr/referral/referral";
import referralApi, {
  referralAvailabilityApi,
} from "@/types/emr/referral/referralApi";
import facilityApi from "@/types/facility/facilityApi";
import { FacilityOrganizationType } from "@/types/facilityOrganization/facilityOrganization";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import { ReferralCreateRecords } from "./ReferralCreateRecords";
import { ReferralDestinationPicker } from "./ReferralDestinationPicker";
import { ReferralQuestionnaireAnswers } from "./ReferralQuestionnaireAnswers";
import { ReferralQuestionnaireForm } from "./ReferralQuestionnaireForm";
import { hasUnsupportedReferralQuestions } from "./referralQuestionnaireUtils";
import { referralResourceError } from "./referralResourceError";
import {
  ReferralResourceContext,
  StagedReferralResource,
} from "./ReferralResourcePicker";
import { ReferralRoute } from "./ReferralRoute";

interface CreateReferralDialogProps {
  children?: ReactNode;
  onCreated?: (referral: ReferralRetrieve) => void;
}
type ReferralOrigin =
  | { encounter: EncounterRead; patientId?: never; facilityId?: never }
  | { encounter?: never; patientId: string; facilityId?: string };

export function CreateReferralDialog({
  encounter,
  patientId,
  facilityId,
  children,
  onCreated,
}: CreateReferralDialogProps & ReferralOrigin) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isPending) setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline" className="careui">
            <Plus className="size-4" />
            {t("referral_new")}
          </Button>
        )}
      </DialogTrigger>
      {open && (
        <CreateReferralContent
          encounter={encounter}
          patientId={encounter ? encounter.patient.id : patientId}
          facilityId={encounter?.facility.id ?? facilityId}
          setIsPending={setIsPending}
          onCancel={() => setOpen(false)}
          onCreated={(referral) => {
            setOpen(false);
            setIsPending(false);
            onCreated?.(referral);
          }}
        />
      )}
    </Dialog>
  );
}

interface CreateReferralContentProps {
  patientId: string;
  encounter?: EncounterRead;
  facilityId?: string;
  setIsPending: (pending: boolean) => void;
  onCancel: () => void;
  onCreated: (referral: ReferralRetrieve) => void;
}

function CreationSection({
  title,
  number,
  framed = true,
  children,
}: {
  title: string;
  number?: number;
  framed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "space-y-4",
        framed && "rounded-xl border border-cui-border bg-cui-muted/30 p-3.5",
      )}
      aria-label={title}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-cui-foreground">
        <span
          aria-hidden
          className="h-4 w-1 shrink-0 rounded-full bg-cui-primary"
        />
        {number != null && (
          <span
            className="shrink-0 text-sm font-medium text-cui-muted-foreground tabular-nums"
            aria-hidden
          >
            {number}.
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function DestinationName({ endpoint }: { endpoint: ReferralEndpoint }) {
  const names = endpoint.departments.length
    ? endpoint.departments.map((item) => item.name).join(", ")
    : (endpoint.organization?.name ??
      endpoint.facility?.name ??
      endpoint.external_name);
  return (
    <div className="text-sm text-cui-muted-foreground">
      <p>{names}</p>
      {endpoint.departments.length > 0 && endpoint.facility && (
        <p>{endpoint.facility.name}</p>
      )}
    </div>
  );
}

function CreateReferralContent({
  patientId,
  encounter,
  facilityId,
  setIsPending,
  onCancel,
  onCreated,
}: CreateReferralContentProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const formId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sendErrorRef = useRef<HTMLDivElement>(null);
  const [actionsHeight, setActionsHeight] = useState(0);
  const encounterId = encounter?.id;
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [availability, setAvailability] =
    useState<ReferralAvailabilityRead | null>(null);
  const [choosingDestination, setChoosingDestination] = useState(true);
  const [questionnaireId, setQuestionnaireId] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [formReady, setFormReady] = useState(false);
  const [reviewResults, setReviewResults] = useState<
    ReferralQuestionnaireResult[]
  >([]);
  const [records, setRecords] = useState<StagedReferralResource[]>([]);
  const patientQuery = useQuery({
    queryKey: ["patient", patientId, facilityId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId },
      queryParams: { facility: facilityId },
    }),
    enabled: !encounter,
  });
  // Encounter access does not itself authorize the patient-profile popup or
  // clinical history. Fetch this independently without source-facility scope.
  const chartPatientQuery = useQuery({
    queryKey: ["referral-create", patientId, "chart-access"],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId },
      silent: true,
    }),
    enabled: !!encounter,
    retry: false,
  });
  const facilityQuery = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId ?? "" },
    }),
    enabled: !encounter && !!facilityId,
  });
  const patientData =
    !patientQuery.isError && patientQuery.data?.id === patientId
      ? patientQuery.data
      : undefined;
  const chartPatient = encounter
    ? !chartPatientQuery.isError && chartPatientQuery.data?.id === patientId
      ? chartPatientQuery.data
      : undefined
    : patientData;
  const patient = encounter?.patient ?? patientData;
  const sourceFacility = encounter?.facility ?? facilityQuery.data;
  const permissions = encounter?.permissions ?? patient?.permissions ?? [];
  const canStageRecords = hasPermission("can_write_referral", permissions);
  const canUpload = encounter
    ? hasPermission("can_write_encounter_clinical_data", permissions) &&
      !["completed", "cancelled", "entered_in_error", "discontinued"].includes(
        encounter.status,
      )
    : hasPermission("can_write_patient", permissions);
  const source: ReferralEndpoint | null = encounter
    ? {
        facility: { id: encounter.facility.id, name: encounter.facility.name },
        departments: encounter.organizations
          .filter((item) => item.org_type !== FacilityOrganizationType.ROOT)
          .map(({ id, name }) => ({ id, name })),
        organization: null,
        external_name: null,
      }
    : null;
  const resourceContext: ReferralResourceContext = {
    patientId,
    encounterId,
    sourceFacility,
    destinationFacility: availability?.destination.facility,
  };
  const questionnairesQuery = useQuery({
    queryKey: [
      "referral-availabilities",
      availability?.id,
      "questionnaires",
      "request",
    ],
    queryFn: query(referralAvailabilityApi.questionnaires, {
      pathParams: { availabilityId: availability?.id ?? "" },
      queryParams: { questionnaire_type: "request" },
    }),
    enabled: !!availability,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const questionnaires = (questionnairesQuery.data?.results ?? []).filter(
    (item) => encounterId || item.subject_type === "patient",
  );
  const questionnaire = questionnaireId
    ? questionnaires.find((item) => item.id === questionnaireId)
    : questionnaires[0];
  const unsupported =
    questionnaire && hasUnsupportedReferralQuestions(questionnaire.questions);
  const createMutation = useMutation<ReferralRetrieve, Error, ReferralCreate>({
    mutationFn: mutate(referralApi.create),
    retry: false,
    onMutate: () => setIsPending(true),
    onSettled: () => setIsPending(false),
    onSuccess: (referral) => {
      void queryClient.invalidateQueries({ queryKey: ["referrals"] });
      toast.success(t("referral_created"));
      onCreated(referral);
    },
  });
  useEffect(() => {
    if (createMutation.isError) {
      sendErrorRef.current?.scrollIntoView({ block: "center" });
      sendErrorRef.current?.focus({ preventScroll: true });
    }
  }, [createMutation.isError]);
  const moveTo = (next: "edit" | "review") => {
    setStep(next);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
    });
  };
  const review = (results: ReferralQuestionnaireResult[]) => {
    if (
      !availability ||
      !questionnaire ||
      !formReady ||
      !title.trim() ||
      createMutation.isPending
    )
      return;
    setReviewResults(results);
    moveTo("review");
  };
  const send = () => {
    if (
      !availability ||
      !questionnaire ||
      createMutation.isPending ||
      step !== "review"
    )
      return;
    createMutation.mutate({
      availability: availability.id,
      patient: patientId,
      ...(encounterId ? { encounter: encounterId } : {}),
      title: title.trim(),
      note: note.trim(),
      questionnaire: questionnaire.id,
      questionnaire_response: { results: reviewResults },
      ...(canStageRecords && records.length
        ? { resources: records.map((item) => item.resource) }
        : {}),
    });
  };
  const unknownDelivery =
    createMutation.isError &&
    (!(createMutation.error instanceof HTTPError) ||
      createMutation.error.status >= 500);

  return (
    <DialogContent
      className="careui fixed inset-0 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-cui-background p-0 text-cui-foreground sm:max-w-none dark:bg-cui-background"
      showCloseButton={false}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogTitle className="sr-only">
        {t("referral_request_form")}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {t("referral_create_description")}
      </DialogDescription>
      <FillSessionTabs
        contained
        patientId={patientId}
        formTitle={t("referral_request_form")}
        historyAccess={{
          responses:
            !!chartPatient &&
            hasPermission(
              "can_view_questionnaire_responses",
              chartPatient.permissions,
            ),
          clinicalData:
            !!chartPatient &&
            hasPermission("can_view_clinical_data", chartPatient.permissions),
        }}
        onClose={onCancel}
        exitDisabled={createMutation.isPending}
      >
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-4 py-3 md:px-8 [&_[data-question-id]]:scroll-mt-[calc(var(--fill-actions-height)+0.75rem)]"
          style={
            { "--fill-actions-height": `${actionsHeight}px` } as CSSProperties
          }
        >
          <FillHeader
            patient={patient}
            encounter={encounter}
            showPatientDetails={!!chartPatient}
            allowClinicalData={
              !!chartPatient &&
              hasPermission("can_view_clinical_data", chartPatient.permissions)
            }
            contained
            onActionsHeightChange={setActionsHeight}
            actions={
              <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={createMutation.isPending}
                  onClick={() => {
                    if (step === "edit") onCancel();
                    else moveTo("edit");
                  }}
                >
                  {step === "review" && <ArrowLeft className="size-4" />}
                  {t(step === "review" ? "referral_back_to_editing" : "cancel")}
                </Button>
                {step === "edit" ? (
                  <Button
                    type="submit"
                    form={formId}
                    disabled={
                      !availability ||
                      !questionnaire ||
                      !formReady ||
                      unsupported ||
                      !title.trim() ||
                      questionnairesQuery.isFetching
                    }
                  >
                    {t("referral_review")}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={send}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {t(
                      createMutation.isPending
                        ? "referral_sending"
                        : "referral_send",
                    )}
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            }
          />
          {!patient && (
            <p role="status" className="text-sm text-cui-muted-foreground">
              {t(
                patientQuery.isError
                  ? "referral_patient_context_failed"
                  : "loading",
              )}
            </p>
          )}
          <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 pb-6 pt-2">
            <div className="space-y-1">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-semibold outline-none"
              >
                {t(step === "review" ? "referral_review" : "referral_new")}
              </h1>
              <p className="text-sm text-cui-muted-foreground">
                {t(
                  step === "review"
                    ? "referral_review_description"
                    : "referral_create_description",
                )}
              </p>
            </div>
            <div className="space-y-6" hidden={step !== "edit"}>
              <CreationSection title={t("referral_destination")} number={1}>
                {availability && (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {availability.name}
                        </p>
                        <DestinationName endpoint={availability.destination} />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setChoosingDestination(!choosingDestination)
                        }
                      >
                        {t(
                          choosingDestination
                            ? "cancel"
                            : "referral_change_destination",
                        )}
                      </Button>
                    </div>
                    {!choosingDestination && availability.description && (
                      <p className="text-sm text-cui-muted-foreground">
                        {availability.description}
                      </p>
                    )}
                  </div>
                )}
                {choosingDestination && (
                  <ReferralDestinationPicker
                    defaultFacility={sourceFacility}
                    selected={availability}
                    onSelect={(item) => {
                      if (availability?.id !== item.id) {
                        setAvailability(item);
                        setQuestionnaireId("");
                        setTitle(item.name);
                        createMutation.reset();
                      }
                      setChoosingDestination(false);
                    }}
                  />
                )}
              </CreationSection>
              <CreationSection title={t("referral_reason")} number={2}>
                <Field>
                  <FieldLabel htmlFor={`${formId}-title`}>
                    {t("referral_title")}
                  </FieldLabel>
                  <Input
                    id={`${formId}-title`}
                    form={formId}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={255}
                    placeholder={t("referral_title_placeholder")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${formId}-note`}>
                    {t("referral_additional_note")}
                  </FieldLabel>
                  <Textarea
                    id={`${formId}-note`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={t("referral_additional_note_placeholder")}
                    rows={3}
                  />
                </Field>
              </CreationSection>
              {availability && (
                <CreationSection
                  title={t("referral_service_questions")}
                  number={3}
                  framed={false}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{availability.name}</p>
                    <DestinationName endpoint={availability.destination} />
                    <p className="text-sm text-cui-muted-foreground">
                      {t("referral_service_questions_description")}
                    </p>
                  </div>
                  {questionnairesQuery.isPending ? (
                    <p
                      role="status"
                      className="flex items-center gap-2 py-6 text-sm"
                    >
                      <Loader2 className="size-4 animate-spin" />
                      {t("loading")}
                    </p>
                  ) : questionnairesQuery.isError ? (
                    <div className="space-y-2">
                      <FieldError>{t("referral_forms_load_failed")}</FieldError>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => questionnairesQuery.refetch()}
                      >
                        {t("try_again")}
                      </Button>
                    </div>
                  ) : !questionnaire ? (
                    <p className="text-sm text-cui-muted-foreground">
                      {t(
                        encounterId
                          ? "referral_no_request_form"
                          : "referral_no_patient_request_form",
                      )}
                    </p>
                  ) : (
                    <>
                      {questionnaires.length > 1 && (
                        <Field>
                          <FieldLabel htmlFor={`${formId}-questionnaire`}>
                            {t("referral_request_form")}
                          </FieldLabel>
                          <Select
                            value={questionnaire.id}
                            onValueChange={(value) => {
                              setQuestionnaireId(value);
                              createMutation.reset();
                            }}
                          >
                            <SelectTrigger id={`${formId}-questionnaire`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="careui">
                              {questionnaires.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      )}
                      <ReferralQuestionnaireForm
                        key={`${availability.id}-${questionnaire.id}`}
                        questionnaire={questionnaire}
                        patientId={patientId}
                        encounterId={encounterId}
                        facilityId={facilityId}
                        formId={formId}
                        disabled={step === "review" || createMutation.isPending}
                        onSubmit={review}
                        onReadyChange={setFormReady}
                      />
                    </>
                  )}
                </CreationSection>
              )}
              {canStageRecords && (
                <CreationSection
                  title={t("referral_selected_records")}
                  number={availability ? 4 : 3}
                >
                  <p className="text-sm text-cui-muted-foreground">
                    {t("referral_stage_record_description")}
                  </p>
                  <ReferralCreateRecords
                    context={resourceContext}
                    value={records}
                    onChange={setRecords}
                    canUpload={canUpload}
                  />
                </CreationSection>
              )}
            </div>
            {step === "review" && availability && questionnaire && (
              <div className="space-y-6">
                <CreationSection title={t("referral_destination")}>
                  <ReferralRoute
                    source={source}
                    destination={availability.destination}
                    labeled
                  />
                  <div className="border-t border-cui-border pt-3">
                    <p className="text-sm font-semibold">{availability.name}</p>
                  </div>
                </CreationSection>
                <CreationSection title={t("referral_reason")}>
                  <p className="text-base font-semibold">{title}</p>
                  {note && (
                    <p className="whitespace-pre-wrap text-sm">{note}</p>
                  )}
                </CreationSection>
                <CreationSection title={t("referral_service_questions")}>
                  <p className="text-sm font-semibold">{questionnaire.title}</p>
                  <ReferralQuestionnaireAnswers
                    results={reviewResults}
                    questions={questionnaire.questions}
                  />
                </CreationSection>
                {canStageRecords && (
                  <CreationSection title={t("referral_selected_records")}>
                    <ReferralCreateRecords
                      context={resourceContext}
                      value={records}
                      onChange={setRecords}
                      canUpload={false}
                      readOnly
                    />
                  </CreationSection>
                )}
              </div>
            )}
            {createMutation.isError && (
              <div
                ref={sendErrorRef}
                role="alert"
                tabIndex={-1}
                className="space-y-2 rounded-lg border border-cui-destructive/30 p-4 outline-none"
              >
                <FieldError role={undefined}>
                  {referralResourceError(
                    createMutation.error,
                    t("referral_create_failed"),
                  )}
                </FieldError>
                {unknownDelivery && (
                  <p className="text-sm text-cui-muted-foreground">
                    {t("referral_send_delivery_unknown")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </FillSessionTabs>
    </DialogContent>
  );
}
