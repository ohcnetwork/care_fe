/**
 * ── Beckn NFH models (care_ccn_fe) ────────────────────────────────────
 *
 * The plug never speaks Beckn to the network. It calls Care BE's BAP REST
 * endpoints (`/api/v1/beckn/bap/*`), which wrap payloads in a Beckn `context`,
 * drive onyx, and record every request + `on_*` callback under one
 * `transactionId`. This module holds:
 *   - the small wire types the BE returns (action result, status record, slice),
 *   - defensive parsers that turn an `on_*` slice into UI-ready options/slots,
 *   - the request-body builders for discover / select / confirm.
 *
 * The BE is not fully pushed yet, so every parser reads defensively (tolerates
 * missing keys / shape drift) rather than assuming the exact schema.
 */

import { t } from "i18next";

import { PatientRead } from "@/types/emr/patient/patient";

export type BecknServiceType = "consultation" | "appointment";

export type BecknActionName =
  "discover" | "select" | "init" | "confirm" | "status" | "cancel" | "update";

export type BecknResult = "ack" | "nack" | "error" | "skipped";

export interface BecknActionResult {
  transactionId: string;
  result: BecknResult;
}

export interface BecknRouting {
  bppId?: string;
  bppUri?: string;
  bapId?: string;
  bapUri?: string;
}

/** Lightweight record polled at `GET /bap/transaction/<id>` (no `?action`). */
export interface BecknTxnStatus {
  transactionId: string;
  serviceType?: string;
  status: string;
  routing?: BecknRouting;
  context?: Record<string, unknown>;
  actions?: string[];
  resourceRequestId?: string;
}

/** A single action's stored payload at `GET /bap/transaction/<id>?action=on_*`. */
export interface BecknSlice {
  transactionId: string;
  status: string;
  action: string;
  ready: boolean;
  data: { context?: Record<string, unknown>; message?: unknown } | null;
}

/** One selectable provider/offer flattened from an `on_discover` catalog. */
export interface CatalogOption {
  key: string;
  label: string;
  offerId?: string;
  offerName?: string;
  resourceId?: string;
  providerName?: string;
  /** Selected provider's id → used as `assignedFacilityId` in init/confirm. */
  providerId?: string;
  catalogName?: string;
  bppId?: string;
  bppUri?: string;
  /** Resource `availabilitySchedule` window, IST-stamped, carried into select. */
  availabilityStart?: string;
  availabilityEnd?: string;
}

/** One appointment slot flattened from an `on_select` contract. */
export interface BecknSlot {
  id?: string;
  start?: string;
  end?: string;
  healthServiceType?: string;
  label: string;
}

/** Terminal statuses — polling stops when the record reaches one of these. */
export const BECKN_TERMINAL_STATUSES = ["ON_CONFIRM", "NACK", "ERROR"] as const;

export function isTerminalStatus(status?: string): boolean {
  return (
    !!status && (BECKN_TERMINAL_STATUSES as readonly string[]).includes(status)
  );
}

/** `ON_DISCOVER` → `on_discover`; used to fetch the matching slice. */
export function sliceActionFor(status?: string): string | undefined {
  return status && status.startsWith("ON_") ? status.toLowerCase() : undefined;
}

// ── defensive accessors ────────────────────────────────────────────────
function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function descriptorName(v: unknown): string | undefined {
  return asString(asRecord(asRecord(v)?.descriptor)?.name);
}

/**
 * Schedule times arrive from discover as zone-less local timestamps; the network
 * runs on IST, so stamp the offset rather than letting `new Date()` read them as
 * browser-local. Values that already carry a zone are left alone.
 */
function withIstOffset(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return /(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+05:30`;
}

/**
 * Pull a resource's `availabilitySchedule` window. Tolerates the schedule sitting
 * on the resource itself or under `resourceAttributes`, and being a single object
 * or a list (first entry wins).
 */
function extractAvailability(resource: Record<string, unknown> | undefined): {
  availabilityStart?: string;
  availabilityEnd?: string;
} {
  const raw =
    resource?.availabilitySchedule ??
    asRecord(resource?.resourceAttributes)?.availabilitySchedule;
  const schedule = asRecord(raw) ?? asRecord(asArray(raw)[0]);
  return {
    availabilityStart: withIstOffset(asString(schedule?.startTime)),
    availabilityEnd: withIstOffset(asString(schedule?.endTime)),
  };
}

/**
 * Flatten `on_discover` → one option per (catalog × offer).
 *
 * Catalog shape (per BE spec): `data.message.catalogs[]` each with
 * `descriptor.name`, `provider{descriptor.name}`, `resources[]` and
 * `offers[]{id, descriptor.name}`. Offer↔resource pairing is best-effort
 * (index-aligned, else first resource) since the BE is not final.
 *
 * Provider routing (`bppId`/`bppUri`) is captured per catalog: a single discover
 * can aggregate providers from multiple BPPs, so select/init/confirm must be
 * routed back to the specific selected catalog's BPP (falling back to the
 * `on_discover` envelope context). The BE merges these into the Beckn envelope.
 */
export function extractOffers(slice: BecknSlice | undefined): CatalogOption[] {
  const message = asRecord(slice?.data?.message);
  const ctx = asRecord(slice?.data?.context);
  const catalogs = asArray(message?.catalogs);
  const out: CatalogOption[] = [];

  catalogs.forEach((rawCat, ci) => {
    const cat = asRecord(rawCat);
    if (!cat) return;
    const providerName = descriptorName(cat.provider) ?? descriptorName(rawCat);
    const providerId = asString(asRecord(cat.provider)?.id);
    const catalogName = descriptorName(rawCat);
    // A single discover can aggregate multiple BPPs; route later actions to the
    // selected catalog's BPP, falling back to the on_discover envelope context.
    const bppId = asString(cat.bppId) ?? asString(ctx?.bppId);
    const bppUri = asString(cat.bppUri) ?? asString(ctx?.bppUri);
    const resources = asArray(cat.resources);
    const offers = asArray(cat.offers);
    const iterable = offers.length ? offers : [undefined];

    iterable.forEach((rawOffer, oi) => {
      const offer = asRecord(rawOffer);
      const resource = asRecord(resources[oi] ?? resources[0]);
      const offerName = descriptorName(rawOffer);
      const label =
        [providerName, offerName].filter(Boolean).join(" — ") ||
        catalogName ||
        asString(offer?.id) ||
        t("beckn_option_fallback_label", { index: `${ci + 1}.${oi + 1}` });

      out.push({
        key: `${ci}-${oi}`,
        label,
        offerId: asString(offer?.id),
        offerName,
        resourceId: asString(resource?.id),
        providerName,
        providerId,
        catalogName,
        bppId,
        bppUri,
        ...extractAvailability(resource),
      });
    });
  });

  return out;
}

/** Flatten `on_select` → selectable slots from `message.contract.performance[]`. */
export function extractSlots(slice: BecknSlice | undefined): BecknSlot[] {
  const message = asRecord(slice?.data?.message);
  const contract = asRecord(message?.contract);
  const performance = asArray(contract?.performance);

  return performance.map((rawPerf, i) => {
    const perf = asRecord(rawPerf);
    const attrs = asRecord(perf?.performanceAttributes);
    const start = asString(attrs?.appointmentWindowStart);
    const end = asString(attrs?.appointmentWindowEnd);
    return {
      id: asString(perf?.id),
      start,
      end,
      healthServiceType: asString(attrs?.healthServiceType),
      label:
        formatSlotLabel(start, end) ||
        t("beckn_slot_fallback_label", { index: i + 1 }),
    };
  });
}

function formatSlotLabel(start?: string, end?: string): string {
  if (!start) return "";
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return start;
  const e = end ? new Date(end) : undefined;
  const day = s.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return e && !Number.isNaN(e.getTime())
    ? `${day}, ${time(s)}–${time(e)}`
    : `${day}, ${time(s)}`;
}

/** Result read from the `on_init` slice, threaded into `confirm`. */
export interface BecknInitResult {
  /** Confirm's top-level `contract.id` — the BE's `referral.id`. */
  contractId?: string;
  /** Echoed back to verify the FE-generated coordinationId round-tripped. */
  coordinationId?: string;
}

/**
 * Parse `on_init` → the ids `confirm` needs. Per the BE contract, confirm's
 * `contract.id` is the referral id the BPP minted at init
 * (`message.contract.contractAttributes.referral.id`), falling back to the
 * contract's own id if the referral block is absent.
 */
export function extractInitResult(
  slice: BecknSlice | undefined,
): BecknInitResult {
  const message = asRecord(slice?.data?.message);
  const contract = asRecord(message?.contract);
  const attrs = asRecord(contract?.contractAttributes);
  const referral = asRecord(attrs?.referral);
  return {
    contractId: asString(referral?.id) ?? asString(contract?.id),
    coordinationId: asString(attrs?.coordinationId) ?? asString(contract?.id),
  };
}

// ── request-body builders ──────────────────────────────────────────────

const SCHEMA_BASE = "https://schema.beckn.io";

/**
 * JSON-LD `@context` URIs for Beckn attribute extension containers. onyx
 * validates every `*Attributes` object (contract/participant/performance/…)
 * against an "Attributes" schema that requires BOTH `@context` and `@type`;
 * omitting `@context` NACKs with `property "@context" is missing`.
 */
const ATTR_CONTEXT = {
  contract: `${SCHEMA_BASE}/HealthContract/v2.1/context.jsonld`,
  referral: `${SCHEMA_BASE}/HealthReferral/v2.1/context.jsonld`,
  participant: `${SCHEMA_BASE}/HealthParticipant/v2.1/context.jsonld`,
  performance: `${SCHEMA_BASE}/HealthPerformance/v2.1/context.jsonld`,
  // Service-coordination (CC referral) flow: discover → init → confirm.
  coordination: `${SCHEMA_BASE}/ServiceCoordination/v2.1/context.jsonld`,
} as const;

/** Map a Care resource category to the Beckn `healthServiceType` code. */
export function healthServiceTypeForCategory(
  category: string | undefined,
): string {
  // "Other" is presented as "Diagnostic" in this plug (translation override).
  return category && /(other|lab|diagnostic)/i.test(category)
    ? "LAB_TEST"
    : "PHYSICAL_CONSULTATION";
}

/** The `healthServiceType` codes this flow supports, with their i18n labels. */
export const HEALTH_SERVICE_TYPES = [
  {
    value: "PHYSICAL_CONSULTATION",
    labelKey: "ccn_service_type__physical_consultation",
  },
  { value: "LAB_TEST", labelKey: "ccn_service_type__lab_test" },
] as const;

/** Human label for a `healthServiceType`, falling back to the raw code. */
export function healthServiceTypeLabel(value: string | undefined): string {
  if (!value) return "";
  const match = HEALTH_SERVICE_TYPES.find((o) => o.value === value);
  return match ? t(match.labelKey) : value;
}

/**
 * Build a commitment's `offer` for select/confirm. onyx validation requires
 * `offer.resourceIds` (mirroring the committed `resources[].id`); omitting it
 * NACKs with `property "resourceIds" is missing`.
 */
function buildOffer(option: CatalogOption): Record<string, unknown> {
  return pruneUndefined({
    id: option.offerId,
    resourceIds: option.resourceId ? [option.resourceId] : undefined,
  });
}

function buildResources(option: CatalogOption): Record<string, unknown>[] {
  return [pruneUndefined({ id: option.resourceId, quantity: { count: 1 } })];
}

/**
 * Build one commitment for select/init/confirm. onyx requires a commitment-level
 * `status.descriptor.code` (omitting it NACKs with `property "status" is
 * missing`); it tracks the commitment lifecycle and mirrors the contract's
 * `status.code`. `id` follows the BE convention `commitment-<resourceId>` for the
 * coordination flow; the appointment flow keeps the legacy literal `c1`.
 */
function buildCommitment(
  option: CatalogOption,
  statusCode: string,
  id = "c1",
): Record<string, unknown> {
  return {
    id,
    status: { descriptor: { code: statusCode } },
    offer: buildOffer(option),
    resources: buildResources(option),
  };
}

function commitmentIdFor(option: CatalogOption): string {
  return option.resourceId ? `commitment-${option.resourceId}` : "c1";
}

/** Patient fields the FE threads into a Beckn `participant`. */
export interface BecknPatient {
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  abha?: string;
}

/**
 * Best-effort ABHA lookup from a patient's identifiers (matched by system or
 * display). Returns undefined when the patient has no ABHA on file — the flow
 * then proceeds with name only.
 */
function findAbha(patient: PatientRead): string | undefined {
  const identifier = (patient.instance_identifiers ?? []).find((i) => {
    const system = i.config?.config?.system?.toLowerCase() ?? "";
    const display = i.config?.config?.display?.toLowerCase() ?? "";
    return (
      system.includes("abha") ||
      system.includes("abdm") ||
      display.includes("abha")
    );
  });
  return identifier?.value;
}

/**
 * Narrow a Care patient to the fields Beckn carries. Both flows go through
 * this, so the participant sent on the wire and the summary shown in the
 * confirmation popup are always built from the same fields.
 */
export function becknPatientFrom(
  patient: PatientRead | null | undefined,
): BecknPatient | undefined {
  if (!patient) return undefined;
  return {
    name: patient.name,
    gender: patient.gender,
    dateOfBirth: patient.date_of_birth ?? undefined,
    abha: findAbha(patient),
  };
}

/**
 * Build the PATIENT participant. onyx requires the `@context`/`@type` pair; the
 * coordination flow additionally carries `gender` (upper-cased to the Beckn
 * enum), `dateOfBirth` and the ABHA `healthIds`. Missing fields are pruned so a
 * name-only patient still yields a valid participant.
 */
function buildPatientParticipant(
  patient: BecknPatient | undefined,
): Record<string, unknown> {
  const healthIds = patient?.abha
    ? [{ system: "ABHA", value: patient.abha }]
    : undefined;
  return {
    descriptor: { name: patient?.name ?? "Patient" },
    participantAttributes: pruneUndefined({
      "@context": ATTR_CONTEXT.participant,
      "@type": "hpa:HealthParticipant",
      participantRole: "PATIENT",
      gender: patient?.gender ? patient.gender.toUpperCase() : undefined,
      dateOfBirth: patient?.dateOfBirth,
      healthIds,
    }),
  };
}

/**
 * `contractAttributes` for the ServiceCoordination (CC referral) flow, shared by
 * init and confirm. `coordinationId` is FE-generated once and reused; the
 * selected coordinator's provider id becomes `assignedFacilityId`.
 */
function buildCoordinationAttributes(
  option: CatalogOption,
  coordinationId: string | undefined,
  facilityId: string | undefined,
): Record<string, unknown> {
  return pruneUndefined({
    "@context": ATTR_CONTEXT.coordination,
    "@type": "scoord:ServiceCoordination",
    coordinationId,
    lifecycleState: "ACTIVE",
    targetCriteria: { modality: "IN_PERSON", urgencyTier: "ROUTINE" },
    facilityId,
    assignedFacilityId: option.providerId,
  });
}

/**
 * Top-level Beckn `context` for a post-discover action (select/init/confirm).
 * Carries the selected catalog's routing (`bppId`/`bppUri`) — a single discover
 * can span multiple BPPs, so each later action must target the specific
 * provider's BPP — plus the JSON-LD `schemaContext` for the attribute containers
 * this action emits. The BE merges these into the full Beckn envelope (action,
 * bapId/bapUri, messageId, timestamp, …).
 */
function buildContext(
  option: CatalogOption,
  schemaContext: string[],
): Record<string, unknown> {
  return pruneUndefined({
    bppId: option.bppId,
    bppUri: option.bppUri,
    schemaContext,
  });
}

export interface DiscoverParams {
  serviceType: BecknServiceType;
  textSearch?: string;
  healthServiceType?: string;
  /** Coordination flow: filter coordinators by acceptance mode. */
  acceptanceMode?: string;
}

export function buildDiscoverBody(
  params: DiscoverParams,
): Record<string, unknown> {
  const { serviceType, textSearch, healthServiceType, acceptanceMode } = params;

  // Both flows use a flat `query` block; the fields differ per service type.
  const query: Record<string, unknown> = {};
  if (textSearch) query.textSearch = textSearch;
  if (serviceType === "consultation") {
    // Coordination flow: filter coordination desks by acceptance mode.
    query.acceptanceMode = acceptanceMode ?? "MANUAL_REVIEW";
  } else if (healthServiceType) {
    // Appointment flow: filter providers by the requested service type.
    query.healthServiceType = healthServiceType;
  }
  return { service_type: serviceType, query };
}

export interface InitParams {
  transactionId: string;
  option: CatalogOption;
  /** FE-generated, created once and reused unchanged at confirm. */
  coordinationId: string;
  patient?: BecknPatient;
  /** Origin facility creating the referral. */
  facilityId?: string;
  /** Resource-request title → `contract.descriptor.name`. */
  title?: string;
}

/**
 * Build the coordination-flow `init` body: the full ServiceCoordination contract
 * the BE relays to the selected CC/BPP. Routing targets the selected catalog's
 * BPP; the BE fills bapId/bapUri/action/messageId/timestamp.
 */
export function buildInitBody(params: InitParams): Record<string, unknown> {
  const { transactionId, option, coordinationId, patient, facilityId, title } =
    params;
  return {
    transactionId,
    context: buildContext(option, [
      ATTR_CONTEXT.coordination,
      ATTR_CONTEXT.participant,
    ]),
    message: {
      contract: pruneUndefined({
        descriptor: title ? { name: title } : undefined,
        status: { code: "ACTIVE" },
        commitments: [
          buildCommitment(option, "ACTIVE", commitmentIdFor(option)),
        ],
        participants: [buildPatientParticipant(patient)],
        contractAttributes: buildCoordinationAttributes(
          option,
          coordinationId,
          facilityId,
        ),
      }),
    },
  };
}

export interface SelectParams {
  serviceType: BecknServiceType;
  transactionId: string;
  option: CatalogOption;
  healthServiceType?: string;
}

export function buildSelectBody(params: SelectParams): Record<string, unknown> {
  const { serviceType, transactionId, option, healthServiceType } = params;
  const contractAttributes =
    serviceType === "consultation"
      ? {
          "@context": ATTR_CONTEXT.referral,
          "@type": "hrf:HealthReferral",
          coordinationId: transactionId,
        }
      : pruneUndefined({
          "@context": ATTR_CONTEXT.contract,
          "@type": "hct:HealthContract",
          healthServiceType,
          appointmentWindowStart: option.availabilityStart,
          appointmentWindowEnd: option.availabilityEnd,
        });

  return {
    transactionId,
    context: buildContext(option, [
      serviceType === "consultation"
        ? ATTR_CONTEXT.referral
        : ATTR_CONTEXT.contract,
    ]),
    message: {
      contract: {
        status: { code: "DRAFT" },
        commitments: [buildCommitment(option, "DRAFT")],
        contractAttributes,
      },
    },
  };
}

export interface ConfirmParams {
  serviceType: BecknServiceType;
  transactionId: string;
  option: CatalogOption;
  patient?: BecknPatient;
  facilityId?: string;
  slot?: BecknSlot;
  healthServiceType?: string;
  coordinationRef?: string;
  /** Coordination flow: confirm's top-level contract id, from on_init. */
  contractId?: string;
  /** Coordination flow: FE-generated id from init, reused unchanged here. */
  coordinationId?: string;
}

export function buildConfirmBody(
  params: ConfirmParams,
): Record<string, unknown> {
  const {
    serviceType,
    transactionId,
    option,
    patient,
    facilityId,
    slot,
    healthServiceType,
    coordinationRef,
    contractId,
    coordinationId,
  } = params;

  if (serviceType === "consultation") {
    return {
      transactionId,
      context: buildContext(option, [
        ATTR_CONTEXT.coordination,
        ATTR_CONTEXT.participant,
      ]),
      message: {
        contract: pruneUndefined({
          id: contractId,
          status: { code: "ACTIVE" },
          commitments: [
            buildCommitment(option, "ACTIVE", commitmentIdFor(option)),
          ],
          participants: [buildPatientParticipant(patient)],
          contractAttributes: buildCoordinationAttributes(
            option,
            coordinationId,
            facilityId,
          ),
        }),
      },
    };
  }

  return {
    transactionId,
    context: buildContext(option, [
      ATTR_CONTEXT.contract,
      ATTR_CONTEXT.participant,
      ATTR_CONTEXT.performance,
    ]),
    message: {
      contract: {
        status: { code: "ACTIVE" },
        commitments: [buildCommitment(option, "ACTIVE")],
        participants: [buildPatientParticipant(patient)],
        performance: [
          {
            id: slot?.id,
            performanceAttributes: pruneUndefined({
              "@context": ATTR_CONTEXT.performance,
              "@type": "hpe:HealthPerformance",
              healthServiceType,
              appointmentWindowStart: slot?.start,
              appointmentWindowEnd: slot?.end,
            }),
          },
        ],
        contractAttributes: pruneUndefined({
          "@context": ATTR_CONTEXT.contract,
          "@type": "hct:HealthContract",
          healthServiceType,
          coordinationRef,
        }),
      },
    },
  };
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}
