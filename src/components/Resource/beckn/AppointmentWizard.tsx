import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { GENDER_TYPES } from "@/common/constants";

import dayjs from "@/Utils/dayjs";
import { formatDateTime } from "@/Utils/utils";
import { BecknPhase, useBecknTransaction } from "@/hooks/useBecknTransaction";
import { cn } from "@/lib/utils";
import {
  BecknActionName,
  BecknPatient,
  BecknSlice,
  BecknSlot,
  CatalogOption,
  HEALTH_SERVICE_TYPES,
  availabilityForOption,
  buildConfirmBody,
  buildDiscoverBody,
  buildSelectBody,
  healthServiceTypeLabel,
} from "@/types/beckn/becknModels";

interface AppointmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patient?: BecknPatient;
  /** Links the booking to the originating referral once the BE surfaces it. */
  coordinationRef?: string;
  onBooked?: (resourceRequestId?: string) => void;
}

type WizardStep = "service" | "provider" | "slot" | "review" | "done";

const STEPS: readonly WizardStep[] = ["service", "provider", "slot", "review"];

const SERVICE_TYPE_ICONS: Record<string, IconName> = {
  PHYSICAL_CONSULTATION: "l-user-md",
  LAB_TEST: "l-file-medical",
};

/** Beckn protocol events in the order the appointment flow emits them. */
const TRAIL = [
  "discover",
  "on_discover",
  "select",
  "on_select",
  "confirm",
  "on_confirm",
] as const;

/** How many trail entries a phase has completed. */
function trailProgress(phase: BecknPhase): number {
  switch (phase) {
    case "discovering":
      return 1;
    case "discovered":
      return 2;
    case "selecting":
      return 3;
    case "selected":
      return 4;
    case "confirming":
      return 5;
    case "confirmed":
      return 6;
    default:
      return 0;
  }
}

/**
 * Full-screen appointment-booking wizard for the CC console: Service →
 * Provider → Slot → Review, over the Beckn appointment flow (discover →
 * select → confirm). Completed steps are revisitable; changing the provider
 * re-fires `select` so the slots always match the selection, and changing the
 * service resets the transaction (a new discovery). The protocol itself stays
 * subtle — a collapsible network-activity trail pinned to the footer.
 */
export default function AppointmentWizard({
  open,
  onOpenChange,
  facilityId,
  patient,
  coordinationRef,
  onBooked,
}: AppointmentWizardProps) {
  const { t } = useTranslation();
  const flow = useBecknTransaction();
  // `reset` is referentially stable; depending on it (not the per-render
  // `flow` object) keeps `startOver` stable so effects keyed on it fire only
  // when intended.
  const { act, reset, transactionId, phase } = flow;

  const [step, setStep] = useState<WizardStep>("service");
  const [healthServiceType, setHealthServiceType] = useState<string>(
    HEALTH_SERVICE_TYPES[0].value,
  );
  const [option, setOption] = useState<CatalogOption>();
  const [slot, setSlot] = useState<BecknSlot>();
  const [slotKey, setSlotKey] = useState<string>();
  // The provider key `select` was last fired for — lets Continue skip a
  // redundant re-select when the provider is unchanged.
  const [lastSelectKey, setLastSelectKey] = useState<string>();
  const [abandonOpen, setAbandonOpen] = useState(false);

  const lastActionRef = useRef<
    { name: BecknActionName; body: Record<string, unknown> } | undefined
  >(undefined);
  const confirmedRef = useRef(false);

  const busy = flow.acting || !!flow.awaiting;
  const hasError = phase === "error" || !!flow.error;

  const fire = useCallback(
    (name: BecknActionName, body: Record<string, unknown>) => {
      lastActionRef.current = { name, body };
      void act(name, body);
    },
    [act],
  );

  // Advance the UI step when the awaited callback lands. Back-navigation only
  // touches `step`, so it never fights this effect (the phase is unchanged).
  useEffect(() => {
    if (phase === "discovered") {
      setStep("provider");
    } else if (phase === "selected") {
      setStep("slot");
    } else if (phase === "confirmed") {
      setStep("done");
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "confirmed" && !confirmedRef.current) {
      confirmedRef.current = true;
      onBooked?.(flow.resourceRequestId);
    }
  }, [phase, flow.resourceRequestId, onBooked]);

  const startOver = useCallback(() => {
    confirmedRef.current = false;
    lastActionRef.current = undefined;
    setOption(undefined);
    setSlot(undefined);
    setSlotKey(undefined);
    setLastSelectKey(undefined);
    setStep("service");
    reset();
  }, [reset]);

  // Terminal states survive close (the closing animation keeps its view) and
  // reset on the next OPEN — edge-triggered so a mid-session render can never
  // wipe the success view or an error the user is still reading.
  const prevOpenRef = useRef(open);
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (
      open &&
      !wasOpen &&
      (confirmedRef.current || (!transactionId && hasError))
    ) {
      startOver();
    }
  }, [open, transactionId, hasError, startOver]);

  const guardClose = (next: boolean) => {
    // An in-flight action counts as an active transaction even before the
    // discover response delivers the transactionId.
    const inFlight = !!transactionId || flow.acting || !!flow.awaiting;
    if (!next && inFlight && step !== "done") {
      setAbandonOpen(true);
      return;
    }
    onOpenChange(next);
  };

  const abandon = () => {
    setAbandonOpen(false);
    startOver();
    onOpenChange(false);
  };

  const goTo = (target: WizardStep) => {
    // During an error the body pins to ErrorView, so stepper jumps would move
    // the highlight without changing the content — Try again / Start over are
    // the only exits.
    if (busy || hasError || step === "done") return;
    if (target === "service") {
      startOver();
    } else if (target === "provider") {
      setSlot(undefined);
      setSlotKey(undefined);
      setStep("provider");
    } else if (target === "slot") {
      setStep("slot");
    }
  };

  const findProviders = () =>
    fire(
      "discover",
      buildDiscoverBody({ serviceType: "appointment", healthServiceType }),
    );

  const continueFromProvider = () => {
    if (!option || !transactionId) return;
    // Same provider and its slots are already loaded → nothing to re-fetch.
    if (option.key === lastSelectKey && flow.slices["on_select"]) {
      setStep("slot");
      return;
    }
    setSlot(undefined);
    setSlotKey(undefined);
    setLastSelectKey(option.key);
    fire(
      "select",
      buildSelectBody({
        serviceType: "appointment",
        transactionId,
        option,
        healthServiceType,
        availability: availabilityForOption(flow.slices["on_discover"], option),
      }),
    );
  };

  const confirmBooking = () => {
    if (!option || !transactionId) return;
    fire(
      "confirm",
      buildConfirmBody({
        serviceType: "appointment",
        transactionId,
        option,
        patient,
        facilityId,
        slot,
        healthServiceType,
        coordinationRef,
        contractId: flow.initResult.contractId,
        coordinationId: undefined,
      }),
    );
  };

  const retry = () => {
    const last = lastActionRef.current;
    if (last) {
      void act(last.name, last.body);
    } else {
      startOver();
    }
  };

  const waitingMessage = (() => {
    switch (flow.awaiting) {
      case "discover":
        return t("beckn_searching_providers");
      case "select":
        return t("beckn_loading_slots");
      case "confirm":
        return t("beckn_booking_appointment");
      default:
        return t("beckn_working");
    }
  })();

  const serviceLabel = healthServiceTypeLabel(healthServiceType);

  const body = (() => {
    if (step === "done") {
      return (
        <SuccessView
          patient={patient}
          option={option}
          slot={slot}
          serviceLabel={serviceLabel}
          resourceRequestId={flow.resourceRequestId}
          onDone={() => onOpenChange(false)}
        />
      );
    }
    // Busy wins over error: a retry clears `flow.error` and re-fires, but the
    // polled status can read NACK for another cycle — showing the waiting view
    // keeps Try again from being clickable twice.
    if (busy) {
      return <WaitingView message={waitingMessage} onStartOver={startOver} />;
    }
    if (hasError) {
      return (
        <ErrorView
          message={flow.error ?? t("something_went_wrong")}
          onRetry={retry}
          onStartOver={startOver}
        />
      );
    }
    switch (step) {
      case "service":
        return (
          <ServiceStep
            value={healthServiceType}
            onChange={setHealthServiceType}
            onContinue={findProviders}
          />
        );
      case "provider":
        return (
          <ProviderStep
            options={flow.catalog}
            value={option?.key}
            serviceLabel={serviceLabel}
            onChange={setOption}
            onBack={() => goTo("service")}
            onContinue={continueFromProvider}
          />
        );
      case "slot":
        return (
          <SlotStep
            slots={flow.slots}
            value={slotKey}
            providerLabel={option?.providerName ?? option?.label ?? ""}
            onChange={(s, key) => {
              setSlot(s);
              setSlotKey(key);
            }}
            onBack={() => goTo("provider")}
            onContinue={() => setStep("review")}
          />
        );
      case "review":
        return (
          <ReviewStep
            patient={patient}
            option={option}
            slot={slot}
            serviceLabel={serviceLabel}
            onBack={() => setStep("slot")}
            onConfirm={confirmBooking}
          />
        );
    }
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={guardClose}>
        <DialogContent className="inset-0 top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none">
          <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
            <DialogTitle className="text-base font-semibold">
              {t("book_appointment")}
            </DialogTitle>
            {patient?.name ? <PatientChip patient={patient} /> : null}
          </header>

          <WizardStepper
            step={step}
            busy={busy || hasError}
            onStepClick={goTo}
          />

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-2xl">{body}</div>
          </main>

          <NetworkTrail
            phase={phase}
            awaiting={flow.awaiting}
            transactionId={transactionId}
            status={flow.status}
            slices={flow.slices}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={abandonOpen} onOpenChange={setAbandonOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ccn_wizard_abandon_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ccn_wizard_abandon_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("ccn_wizard_abandon_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={abandon}>
              {t("ccn_wizard_abandon_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PatientChip({ patient }: { patient: BecknPatient }) {
  const { t } = useTranslation();
  const initials =
    (patient.name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "?";
  const age = patient.dateOfBirth
    ? dayjs().diff(dayjs(patient.dateOfBirth), "year")
    : undefined;
  const genderLabel = GENDER_TYPES.find((g) => g.id === patient.gender)?.text;
  const meta = [age, genderLabel].filter((v) => v !== undefined).join(" · ");

  return (
    <div className="mr-8 ml-auto flex min-w-0 items-center gap-2 rounded-full border py-1 pr-3 pl-1">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-medium text-primary-800">
        {initials}
      </span>
      <span className="truncate text-sm">
        {patient.name}
        {meta ? <span className="text-gray-500"> · {meta}</span> : null}
      </span>
      {patient.abha ? (
        <Badge variant="green" className="shrink-0 text-[10px]">
          {t("ccn_abha_label")}
        </Badge>
      ) : null}
    </div>
  );
}

function WizardStepper({
  step,
  busy,
  onStepClick,
}: {
  step: WizardStep;
  busy: boolean;
  onStepClick: (target: WizardStep) => void;
}) {
  const { t } = useTranslation();
  const currentIndex = step === "done" ? STEPS.length : STEPS.indexOf(step);

  return (
    <nav className="flex shrink-0 items-center gap-2 border-b px-4 py-3 sm:px-6">
      {STEPS.map((s, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const clickable = isDone && !busy && step !== "done";
        return (
          <div key={s} className="flex min-w-0 items-center gap-2">
            {index > 0 ? (
              <span
                className={cn(
                  "h-px w-4 sm:w-8",
                  isDone || isCurrent ? "bg-primary-300" : "bg-gray-200",
                )}
              />
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => onStepClick(s)}
              className={cn(
                "flex items-center gap-1.5",
                clickable ? "cursor-pointer" : "cursor-default",
              )}
            >
              {isDone ? (
                <CareIcon
                  icon="l-check-circle"
                  className="size-5 text-primary-600"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[11px]",
                    isCurrent
                      ? "border-primary-600 font-medium text-primary-700"
                      : "border-gray-300 text-gray-400",
                  )}
                >
                  {index + 1}
                </span>
              )}
              <span
                className={cn(
                  "truncate text-sm",
                  isCurrent
                    ? "font-medium text-gray-900"
                    : isDone
                      ? "text-gray-700"
                      : "text-gray-400",
                )}
              >
                {t(`ccn_wizard_step__${s}`)}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function StepHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      ) : null}
    </div>
  );
}

function StepFooter({
  onBack,
  continueLabel,
  continueDisabled,
  continueIcon,
  onContinue,
}: {
  onBack?: () => void;
  continueLabel: string;
  continueDisabled?: boolean;
  continueIcon?: IconName;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-6 flex items-center justify-between">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          <CareIcon icon="l-arrow-left" className="size-4" />
          {t("back")}
        </Button>
      ) : (
        <span />
      )}
      <Button
        variant="primary"
        disabled={continueDisabled}
        onClick={onContinue}
      >
        {continueIcon ? (
          <CareIcon icon={continueIcon} className="size-4" />
        ) : null}
        {continueLabel}
      </Button>
    </div>
  );
}

function ServiceStep({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <StepHeading title={t("ccn_wizard_choose_service")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {HEALTH_SERVICE_TYPES.map((serviceType) => {
          const selected = serviceType.value === value;
          return (
            <button
              key={serviceType.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(serviceType.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                selected
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200 hover:bg-gray-50",
              )}
            >
              <CareIcon
                icon={SERVICE_TYPE_ICONS[serviceType.value] ?? "l-hospital"}
                className={cn(
                  "size-6 shrink-0",
                  selected ? "text-primary-700" : "text-gray-400",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-primary-900" : "text-gray-900",
                )}
              >
                {t(serviceType.labelKey)}
              </span>
              {selected ? (
                <CareIcon
                  icon="l-check"
                  className="ml-auto size-4 shrink-0 text-primary-700"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <StepFooter
        continueLabel={t("beckn_find_providers")}
        onContinue={onContinue}
      />
    </div>
  );
}

function ProviderStep({
  options,
  value,
  serviceLabel,
  onChange,
  onBack,
  onContinue,
}: {
  options: CatalogOption[];
  value?: string;
  serviceLabel: string;
  onChange: (option: CatalogOption) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <StepHeading
        title={t("ccn_wizard_choose_provider")}
        description={t("ccn_wizard_choose_provider_description", {
          service: serviceLabel,
        })}
      />
      {options.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("beckn_no_providers_returned")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((catalogOption) => {
            const selected = catalogOption.key === value;
            const secondary =
              catalogOption.providerName &&
              catalogOption.offerName &&
              catalogOption.offerName !== catalogOption.providerName
                ? catalogOption.offerName
                : undefined;
            return (
              <button
                key={catalogOption.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(catalogOption)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  selected
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:bg-gray-50",
                )}
              >
                <CareIcon
                  icon="l-hospital"
                  className={cn(
                    "size-6 shrink-0",
                    selected ? "text-primary-700" : "text-gray-400",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      selected ? "text-primary-900" : "text-gray-900",
                    )}
                  >
                    {catalogOption.providerName ?? catalogOption.label}
                  </span>
                  {secondary ? (
                    <span className="block truncate text-xs text-gray-500">
                      {secondary}
                    </span>
                  ) : null}
                </span>
                {selected ? (
                  <CareIcon
                    icon="l-check"
                    className="size-4 shrink-0 text-primary-700"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      <StepFooter
        onBack={onBack}
        continueLabel={t("continue")}
        continueDisabled={!value}
        onContinue={onContinue}
      />
    </div>
  );
}

function SlotStep({
  slots,
  value,
  providerLabel,
  onChange,
  onBack,
  onContinue,
}: {
  slots: BecknSlot[];
  value?: string;
  providerLabel: string;
  onChange: (slot: BecknSlot, key: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation();

  // Group by day so a multi-day slot list reads as a calendar, not a wall of
  // buttons. Slots without a start time land in a single unlabelled group.
  const groups = new Map<string, { slot: BecknSlot; key: string }[]>();
  slots.forEach((becknSlot, index) => {
    const day = becknSlot.start
      ? dayjs(becknSlot.start).format("dddd, D MMMM")
      : t("ccn_wizard_slots_any_day");
    const entry = { slot: becknSlot, key: becknSlot.id ?? String(index) };
    const existing = groups.get(day);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(day, [entry]);
    }
  });

  return (
    <div>
      <StepHeading
        title={t("ccn_wizard_choose_slot")}
        description={
          providerLabel
            ? t("ccn_wizard_choose_slot_description", {
                provider: providerLabel,
              })
            : undefined
        }
      />
      {slots.length === 0 ? (
        <p className="text-sm text-gray-500">{t("beckn_no_slots_returned")}</p>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([day, entries]) => (
            <div key={day}>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <CareIcon icon="l-calender" className="size-4 text-gray-400" />
                {day}
              </p>
              <div className="flex flex-wrap gap-2">
                {entries.map(({ slot: becknSlot, key }) => {
                  const active = value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange(becknSlot, key)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-primary-600 bg-primary-50 font-medium text-primary-900"
                          : "border-gray-200 hover:bg-gray-50",
                      )}
                    >
                      {becknSlot.start
                        ? formatDateTime(becknSlot.start, "h:mm A")
                        : becknSlot.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <StepFooter
        onBack={onBack}
        continueLabel={t("ccn_wizard_review_title")}
        continueDisabled={!value}
        onContinue={onContinue}
      />
    </div>
  );
}

function SummaryRows({
  patient,
  option,
  slot,
  serviceLabel,
}: {
  patient?: BecknPatient;
  option?: CatalogOption;
  slot?: BecknSlot;
  serviceLabel: string;
}) {
  const { t } = useTranslation();
  const genderLabel = GENDER_TYPES.find((g) => g.id === patient?.gender)?.text;
  const rows: { label: string; value: string }[] = [
    { label: t("patient"), value: patient?.name ?? "—" },
    ...(genderLabel ? [{ label: t("sex"), value: genderLabel }] : []),
    ...(patient?.dateOfBirth
      ? [
          {
            label: t("date_of_birth"),
            value: formatDateTime(patient.dateOfBirth),
          },
        ]
      : []),
    ...(patient?.abha
      ? [{ label: t("patient_id_abha"), value: patient.abha }]
      : []),
    { label: t("ccn_service_type"), value: serviceLabel },
    {
      label: t("beckn_provider_offer"),
      value: option?.providerName ?? option?.label ?? "—",
    },
    { label: t("beckn_slot"), value: slot?.label ?? "—" },
  ];

  return (
    <dl className="rounded-lg border text-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-4 border-b px-4 py-2.5 last:border-b-0"
        >
          <dt className="text-gray-500">{row.label}</dt>
          <dd className="min-w-0 text-right font-medium break-words">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewStep({
  patient,
  option,
  slot,
  serviceLabel,
  onBack,
  onConfirm,
}: {
  patient?: BecknPatient;
  option?: CatalogOption;
  slot?: BecknSlot;
  serviceLabel: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <StepHeading
        title={t("ccn_wizard_review_title")}
        description={t("ccn_wizard_review_description")}
      />
      <SummaryRows
        patient={patient}
        option={option}
        slot={slot}
        serviceLabel={serviceLabel}
      />
      {!patient?.abha ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t("beckn_no_abha_on_file")}
        </p>
      ) : null}
      <StepFooter
        onBack={onBack}
        continueLabel={t("beckn_confirm_booking")}
        continueIcon="l-check"
        onContinue={onConfirm}
      />
    </div>
  );
}

function SuccessView({
  patient,
  option,
  slot,
  serviceLabel,
  resourceRequestId,
  onDone,
}: {
  patient?: BecknPatient;
  option?: CatalogOption;
  slot?: BecknSlot;
  serviceLabel: string;
  resourceRequestId?: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <CareIcon icon="l-check-circle" className="size-14 text-green-600" />
      <h2 className="mt-4 text-xl font-semibold">
        {t("ccn_wizard_done_title")}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {t("ccn_wizard_done_description")}
      </p>
      <div className="mt-6 w-full max-w-md text-left">
        <SummaryRows
          patient={patient}
          option={option}
          slot={slot}
          serviceLabel={serviceLabel}
        />
      </div>
      {resourceRequestId ? (
        <p className="mt-3 font-mono text-xs text-gray-400">
          {t("beckn_resource_request_id", { id: resourceRequestId })}
        </p>
      ) : null}
      <Button variant="primary" className="mt-6" onClick={onDone}>
        {t("done")}
      </Button>
    </div>
  );
}

function WaitingView({
  message,
  onStartOver,
}: {
  message: string;
  onStartOver: () => void;
}) {
  const { t } = useTranslation();
  // Mounted only while a callback is awaited, so the timer is scoped to a
  // single wait: reassure after 20s instead of spinning silently.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), 20_000);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CareIcon icon="l-spinner" className="size-4 animate-spin" />
        {message}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-2/3" />
      </div>
      {slow ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p>{t("ccn_wizard_slow_hint")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onStartOver}
          >
            {t("beckn_start_over")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
  onStartOver,
}: {
  message: string;
  onRetry: () => void;
  onStartOver: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {message}
      </div>
      <div className="flex gap-2">
        <Button variant="primary" onClick={onRetry}>
          {t("ccn_wizard_try_again")}
        </Button>
        <Button variant="outline" onClick={onStartOver}>
          {t("beckn_start_over")}
        </Button>
      </div>
    </div>
  );
}

function NetworkTrail({
  phase,
  awaiting,
  transactionId,
  status,
  slices,
}: {
  phase: BecknPhase;
  awaiting: BecknActionName | null;
  transactionId?: string;
  status?: string;
  slices: Record<string, BecknSlice>;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  // How far the flow provably got: the live phase, or — once the phase has
  // collapsed to "error" — the cached callback slices.
  const slicesProgress = slices["on_confirm"]
    ? 6
    : slices["on_select"]
      ? 4
      : slices["on_discover"]
        ? 2
        : 0;
  const maxDone = Math.max(trailProgress(phase), slicesProgress);

  const inFlightIndex = awaiting
    ? TRAIL.indexOf(`on_${awaiting}` as (typeof TRAIL)[number])
    : -1;
  const doneBefore = inFlightIndex >= 0 ? inFlightIndex : maxDone;
  const isError = phase === "error";

  return (
    <footer className="shrink-0 border-t bg-gray-50 px-4 sm:px-6">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 py-2 text-xs text-gray-500"
      >
        <CareIcon icon="l-signal" className="size-3.5 shrink-0" />
        <span className="hidden shrink-0 sm:inline">
          {t("ccn_network_activity")}
        </span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
          {TRAIL.map((event, index) => {
            const done = index < doneBefore;
            const inFlight = index === inFlightIndex && !isError;
            const failed = isError && index === doneBefore;
            return (
              <span
                key={event}
                className={cn(
                  "flex items-center gap-0.5",
                  done && "text-green-700",
                  inFlight && "animate-pulse font-medium text-primary-700",
                  failed && "text-red-600",
                  !done && !inFlight && !failed && "text-gray-400",
                )}
              >
                {event}
                {done ? <CareIcon icon="l-check" className="size-3" /> : null}
              </span>
            );
          })}
        </span>
        <CareIcon
          icon={expanded ? "l-angle-down" : "l-angle-up"}
          className="ml-auto size-3.5 shrink-0"
        />
      </button>
      {expanded ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-2 pb-2 font-mono text-[11px] text-gray-500">
          <span>
            {t("ccn_transaction_label")}: {transactionId ?? "—"}
          </span>
          <span>
            {t("status")}: {status ?? "—"}
          </span>
        </div>
      ) : null}
    </footer>
  );
}
