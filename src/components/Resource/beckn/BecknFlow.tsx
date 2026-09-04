import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import CatalogPicker from "@/components/Resource/beckn/CatalogPicker";
import ConfirmDialog, {
  ConfirmSummaryRow,
} from "@/components/Resource/beckn/ConfirmDialog";
import SlotPicker from "@/components/Resource/beckn/SlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { GENDER_TYPES } from "@/common/constants";

import { formatDateTime } from "@/Utils/utils";
import { useBecknTransaction } from "@/hooks/useBecknTransaction";
import {
  BecknPatient,
  BecknServiceType,
  BecknSlot,
  CatalogOption,
  availabilityForOption,
  buildConfirmBody,
  buildDiscoverBody,
  buildInitBody,
  buildSelectBody,
  healthServiceTypeLabel,
} from "@/types/beckn/becknModels";

interface BecknFlowProps {
  serviceType: BecknServiceType;
  facilityId: string;
  patient?: BecknPatient;
  discover: { textSearch?: string; healthServiceType?: string };
  /** Consultation only: resource-request title → `contract.descriptor.name`. */
  title?: string;
  /** Appointment only: link the originating referral. */
  coordinationRef?: string;
  /** Consultation (RR form): kick off discover as soon as the flow mounts. */
  autoStart?: boolean;
  onConfirmed?: (resourceRequestId?: string) => void;
}

/**
 * Reusable Beckn orchestrator over the Care BAP.
 *
 * - `consultation`: pick a coordinator → Submit fires `init` (full
 *   ServiceCoordination contract), which mints the referral and creates the
 *   ResourceRequest → confirmation popup → `confirm` (carrying the contract id
 *   minted at init) finalises it. No slots.
 * - `appointment`: pick a provider → `select` → choose a slot → confirm popup →
 *   `confirm` books a TokenBooking (linked to the referral via coordinationRef).
 *
 * Both flows are driven by the origin facility as the BAP consumer: it places
 * the order and therefore fires `confirm` itself.
 */
export default function BecknFlow({
  serviceType,
  facilityId,
  patient,
  discover,
  title,
  coordinationRef,
  autoStart,
  onConfirmed,
}: BecknFlowProps) {
  const { t } = useTranslation();
  const flow = useBecknTransaction();
  const { act, transactionId, phase } = flow;
  const healthServiceType = discover.healthServiceType;
  const isConsultation = serviceType === "consultation";

  const [option, setOption] = useState<CatalogOption>();
  const [slot, setSlot] = useState<BecknSlot>();
  const [slotKey, setSlotKey] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Consultation: FE-generated coordination id, created once at init and reused
  // unchanged at confirm.
  const [coordinationId, setCoordinationId] = useState<string>();

  const startDiscover = useCallback(() => {
    void act("discover", buildDiscoverBody({ serviceType, ...discover }));
  }, [act, serviceType, discover]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !startedRef.current && !transactionId) {
      startedRef.current = true;
      startDiscover();
    }
  }, [autoStart, transactionId, startDiscover]);

  // Consultation Submit → init; appointment Submit → select.
  const doSubmit = useCallback(() => {
    if (!option || !transactionId) return;
    if (isConsultation) {
      const newCoordinationId = crypto.randomUUID();
      setCoordinationId(newCoordinationId);
      void act(
        "init",
        buildInitBody({
          transactionId,
          option,
          coordinationId: newCoordinationId,
          patient,
          facilityId,
          title,
        }),
      );
      return;
    }
    void act(
      "select",
      buildSelectBody({
        serviceType,
        transactionId,
        option,
        healthServiceType,
        availability: availabilityForOption(flow.slices["on_discover"], option),
      }),
    );
  }, [
    act,
    option,
    transactionId,
    isConsultation,
    serviceType,
    patient,
    facilityId,
    title,
    healthServiceType,
    flow.slices,
  ]);

  const doConfirm = useCallback(() => {
    if (!option || !transactionId) return;
    setConfirmOpen(false);
    void act(
      "confirm",
      buildConfirmBody({
        serviceType,
        transactionId,
        option,
        patient,
        facilityId,
        slot,
        healthServiceType,
        coordinationRef,
        contractId: flow.initResult.contractId,
        coordinationId,
      }),
    );
  }, [
    act,
    option,
    transactionId,
    serviceType,
    patient,
    facilityId,
    slot,
    healthServiceType,
    coordinationRef,
    flow.initResult.contractId,
    coordinationId,
  ]);

  // Both flows terminate at ON_CONFIRM: the origin facility confirms its own
  // referral (the BAP consumer places the order), and the appointment booking
  // is likewise finalised by confirm.
  const done = phase === "confirmed";

  const confirmedRef = useRef(false);
  useEffect(() => {
    if (done && !confirmedRef.current) {
      confirmedRef.current = true;
      onConfirmed?.(flow.resourceRequestId);
    }
  }, [done, flow.resourceRequestId, onConfirmed]);

  const startOver = useCallback(() => {
    startedRef.current = false;
    confirmedRef.current = false;
    setOption(undefined);
    setSlot(undefined);
    setSlotKey(undefined);
    setConfirmOpen(false);
    setCoordinationId(undefined);
    flow.reset();
  }, [flow]);

  // A Beckn action is "busy" from the moment we fire it until its `on_*`
  // callback arrives (POST in flight → polling). Driving the UI off this — rather
  // than the raw status — means the gaps between submit and callback show a
  // loader instead of a stale interactive state.
  const busy = flow.acting || !!flow.awaiting;
  const showPicker = !busy && phase === "discovered";
  const showSlots = !busy && phase === "selected" && !isConsultation;
  // Consultation: `init` mints the referral, then the origin confirms it.
  const showReferralConfirm =
    !busy && isConsultation && phase === "initialized";

  const waitingMessage = (() => {
    switch (flow.awaiting) {
      case "discover":
        return t("beckn_searching_providers");
      case "select":
        return t("beckn_loading_slots");
      case "init":
        return t("beckn_submitting_referral");
      case "confirm":
        return isConsultation
          ? t("beckn_confirming_referral")
          : t("beckn_booking_appointment");
      default:
        return t("beckn_working");
    }
  })();

  // The popup is the last checkpoint before the order is placed on the network,
  // so it carries enough to verify *who* is being referred and *what* is being
  // committed to. Optional rows are dropped rather than rendered as dashes.
  const genderLabel = GENDER_TYPES.find((g) => g.id === patient?.gender)?.text;
  const serviceTypeLabel = healthServiceTypeLabel(healthServiceType);
  const referralId = flow.initResult.contractId;

  const confirmSummary: ConfirmSummaryRow[] = [
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
    ...(isConsultation && title
      ? [{ label: t("request_title"), value: title }]
      : []),
    ...(serviceTypeLabel
      ? [{ label: t("ccn_service_type"), value: serviceTypeLabel }]
      : []),
    {
      label: isConsultation
        ? t("ccn_coordination_desk")
        : t("beckn_provider_offer"),
      value: option?.label ?? "—",
    },
    ...(isConsultation
      ? []
      : [{ label: t("beckn_slot"), value: slot?.label ?? "—" }]),
    // Minted by the BPP at init — proof the referral exists and names what
    // confirm is about to finalise.
    ...(isConsultation && referralId
      ? [{ label: t("ccn_referral_id"), value: referralId }]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {serviceType === "appointment"
            ? t("book_appointment")
            : t("beckn_referral_booking")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {done ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-medium">
              {serviceType === "appointment"
                ? t("beckn_appointment_booked")
                : t("beckn_referral_created")}
            </p>
            {flow.resourceRequestId ? (
              <p className="mt-1 text-xs">
                {t("beckn_resource_request_id", {
                  id: flow.resourceRequestId,
                })}
              </p>
            ) : null}
          </div>
        ) : phase === "error" ? (
          <>
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {flow.error ?? t("something_went_wrong")}
            </div>
            <Button variant="outline" onClick={startOver}>
              {t("beckn_start_over")}
            </Button>
          </>
        ) : busy ? (
          <StatusLine text={waitingMessage} />
        ) : phase === "idle" ? (
          <Button variant="primary" onClick={startDiscover}>
            {t("beckn_find_providers")}
          </Button>
        ) : showPicker ? (
          <div className="space-y-3">
            <CatalogPicker
              options={flow.catalog}
              value={option?.key}
              onChange={setOption}
            />
            <Button variant="primary" disabled={!option} onClick={doSubmit}>
              {isConsultation ? t("submit") : t("beckn_select_provider")}
            </Button>
          </div>
        ) : showSlots ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("beckn_choose_slot")}</p>
            <SlotPicker
              slots={flow.slots}
              value={slotKey}
              onChange={(s, key) => {
                setSlot(s);
                setSlotKey(key);
              }}
            />
            <Button
              variant="primary"
              disabled={!slot}
              onClick={() => setConfirmOpen(true)}
            >
              {t("beckn_confirm_booking")}
            </Button>
          </div>
        ) : showReferralConfirm ? (
          <Button variant="primary" onClick={() => setConfirmOpen(true)}>
            {t("ccn_confirm_referral")}
          </Button>
        ) : (
          <StatusLine text={t("beckn_working")} />
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          isConsultation
            ? t("ccn_confirm_referral")
            : t("beckn_confirm_appointment")
        }
        description={patient?.abha ? undefined : t("beckn_no_abha_on_file")}
        summary={confirmSummary}
        confirmLabel={isConsultation ? t("confirm") : t("book_appointment")}
        confirming={phase === "confirming"}
        onConfirm={doConfirm}
      />
    </Card>
  );
}

function StatusLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <CareIcon icon="l-spinner" className="size-4 animate-spin" />
      {text}
    </div>
  );
}
