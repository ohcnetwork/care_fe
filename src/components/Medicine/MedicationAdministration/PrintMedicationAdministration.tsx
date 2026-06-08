import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bed } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import {
  formatDosage,
  formatDuration,
  formatFrequency,
} from "@/components/Medicine/utils";

import useCurrentFacilitySilently from "@/pages/Facility/utils/useCurrentFacility";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { MedicationAdministrationRead } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import {
  ACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import { LocationRead } from "@/types/location/location";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";

// The four administration time slots (Bedtime / Morning / Afternoon / Night).
// Each carries its own abbreviation so the chart label stays correct even when
// some slots are filtered out.
const ADMIN_TIME_SLOTS = [
  { key: "B", i18nKey: "bed_time", start: 0, end: 6 },
  { key: "M", i18nKey: "morning_time", start: 6, end: 12 },
  { key: "A", i18nKey: "afternoon_time", start: 12, end: 18 },
  { key: "N", i18nKey: "night_time", start: 18, end: 24 },
] as const;

// Format a 0-24 hour into a readable 12-hour label e.g. 0 -> "12 AM", 18 -> "06 PM".
const formatSlotHour = (hour: number) => {
  const normalized = hour % 24;
  const period = normalized < 12 ? "AM" : "PM";
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${String(display).padStart(2, "0")} ${period}`;
};

interface GroupedMedication {
  productId: string;
  productName: string;
  requests: MedicationRequestRead[];
  isPRN: boolean;
  hasActiveRequests: boolean;
}

export const PrintMedicationAdministration = (props: {
  facilityId: string;
  encounterId: string;
  patientId: string;
}) => {
  const { facilityId, encounterId, patientId } = props;
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  // Fetch all medication requests for this encounter
  const { data: medicationRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["medication_requests_print", patientId, encounterId],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
      },
      pageSize: 200,
    }),
    enabled: !!patientId,
  });

  // Fetch all administrations for this encounter
  const { data: medicationAdministrations, isLoading: adminsLoading } =
    useQuery({
      queryKey: ["medication_administrations_print", patientId, encounterId],
      queryFn: query.paginated(medicationAdministrationApi.list, {
        pathParams: { patientId },
        queryParams: {
          encounter: encounterId,
          status: "completed",
        },
        pageSize: 200,
      }),
      enabled: !!patientId,
    });

  // Filter state
  const [showDiscontinued] = useState(false);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>(
    ADMIN_TIME_SLOTS.map((slot) => slot.key),
  );

  // Build the active time slots from the user's selection, preserving each
  // slot's fixed abbreviation and chronological order.
  const timeSlots = useMemo(
    () =>
      ADMIN_TIME_SLOTS.filter((slot) =>
        selectedSlotKeys.includes(slot.key),
      ).map((slot) => ({
        label: `${String(slot.start).padStart(2, "0")}:00`,
        abbreviation: slot.key,
        start: slot.start,
        end: slot.end,
      })),
    [selectedSlotKeys],
  );

  // Group medications by product - include all medications (active + stopped)
  // so that administrations from stopped requests are shown when the group has active requests
  const groupedMedications = useMemo(() => {
    if (!medicationRequests?.results) return { regular: [], prn: [] };

    const groups = new Map<string, GroupedMedication>();

    // Group ALL medications together
    medicationRequests.results.forEach((med) => {
      const productId =
        med.requested_product?.id || med.medication?.code || med.id;
      const productName =
        med.requested_product?.name ||
        med.medication?.display ||
        "Unknown Medication";
      const isPRN = med.dosage_instruction.some((di) => di.as_needed_boolean);
      const isActive = ACTIVE_MEDICATION_STATUSES.includes(
        med.status as (typeof ACTIVE_MEDICATION_STATUSES)[number],
      );

      if (!groups.has(productId)) {
        groups.set(productId, {
          productId,
          productName,
          requests: [],
          isPRN,
          hasActiveRequests: false,
        });
      }

      const group = groups.get(productId)!;
      group.requests.push(med);
      if (isActive) {
        group.hasActiveRequests = true;
      }
    });

    // Filter groups based on showDiscontinued or hasActiveRequests
    const allGroups = Array.from(groups.values()).filter(
      (g) => showDiscontinued || g.hasActiveRequests,
    );

    return {
      regular: allGroups.filter((g) => !g.isPRN),
      prn: allGroups.filter((g) => g.isPRN),
    };
  }, [medicationRequests, showDiscontinued]);

  // Get date ranges for the chart - one week per range from encounter
  // start through encounter end (or today if ongoing), in chronological order.
  const dateRanges = useMemo(() => {
    if (!encounter?.period?.start) return [];

    const start = new Date(encounter.period.start);
    start.setHours(0, 0, 0, 0);

    const end = encounter.period.end
      ? new Date(encounter.period.end)
      : new Date();
    end.setHours(23, 59, 59, 999);

    if (end < start) return [];

    const weeks: Date[][] = [];
    let cursor = new Date(start);

    while (cursor <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7 && cursor <= end; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [encounter]);

  // Index administrations by request ID, date, and time slot
  const adminIndex = useMemo(() => {
    const index: Record<
      string,
      Record<string, Record<string, MedicationAdministrationRead[]>>
    > = {};

    medicationAdministrations?.results?.forEach((admin) => {
      const requestId = admin.request;
      const adminDate = new Date(admin.occurrence_period_start);
      const dateKey = format(adminDate, "yyyy-MM-dd");
      const hour = adminDate.getHours();

      // Find which time slot this belongs to
      const slot = timeSlots.find((s) => {
        if (s.start < s.end) {
          return hour >= s.start && hour < s.end;
        }
        // Handle midnight crossing
        return hour >= s.start || hour < s.end;
      });

      if (!slot) return;
      const slotKey = slot.label;

      if (!index[requestId]) index[requestId] = {};
      if (!index[requestId][dateKey]) index[requestId][dateKey] = {};
      if (!index[requestId][dateKey][slotKey])
        index[requestId][dateKey][slotKey] = [];

      index[requestId][dateKey][slotKey].push(admin);
    });

    return index;
  }, [medicationAdministrations, timeSlots]);

  // Build the location breadcrumb (root → ... → bed) from the encounter's
  // current location by walking up the parent chain.
  const locationPath = useMemo(() => {
    const chain: LocationRead[] = [];
    let loc: LocationRead | undefined =
      encounter?.current_location ?? undefined;
    while (loc) {
      chain.unshift(loc);
      loc = loc.parent;
    }
    return chain;
  }, [encounter]);

  const hospitalId =
    encounter?.patient.instance_identifiers?.find(
      (identifier) =>
        identifier.config.config.use === PatientIdentifierUse.official,
    )?.value ?? encounter?.external_identifier;

  const isLoading = requestsLoading || adminsLoading;

  if (isLoading) return <Loading />;

  const hasData =
    groupedMedications.regular.length > 0 || groupedMedications.prn.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-4 text-gray-500">
        {t("no_medications_found_for_this_encounter")}
      </div>
    );
  }

  return (
    <PrintPreview
      title={`${t("drug_chart")} - ${encounter?.patient.name}`}
      disabled={!hasData}
      facility={facility}
      templateSlug={PrintTemplateType.medication_administration}
      hideFacilityHeader
    >
      {/* Force landscape with tight margins so the wide drug chart fits on
          a single A4 sheet per week. The parent print container also adds
          a chunky p-10 that would otherwise eat into the printable width. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 6mm; }
          html, body { background: white !important; }
          /* Strip outer padding/shadow that the generic PrintPreview wrapper
             applies, so the chart can use the full landscape width. */
          div:has(> #section-to-print) {
            padding: 0 !important;
            box-shadow: none !important;
            max-width: none !important;
          }
          /* Avoid splitting an individual medication row across pages. */
          .mar-row { break-inside: avoid; page-break-inside: avoid; }
          /* Repeat the table header on each printed page. */
          .mar-thead { display: table-header-group; }
        }
      `}</style>

      {/* Administration time slot filter (screen only) */}
      <div className="print:hidden rounded-lg bg-gray-50 p-4 mb-4">
        <p className="mb-3 text-sm font-medium text-gray-700">
          {t("administration_times")}:
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {ADMIN_TIME_SLOTS.map((slot) => {
            const checked = selectedSlotKeys.includes(slot.key);
            return (
              <label
                key={slot.key}
                className="flex cursor-pointer items-start gap-2"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={checked}
                  onCheckedChange={(value) =>
                    setSelectedSlotKeys((prev) =>
                      value
                        ? [...prev, slot.key]
                        : prev.filter((key) => key !== slot.key),
                    )
                  }
                />
                <span className="leading-tight">
                  <span className="block text-sm font-medium text-gray-950">
                    <Trans
                      i18nKey={slot.i18nKey}
                      components={{ strong: <span /> }}
                    />
                  </span>
                  <span className="block text-xs text-gray-500">
                    {formatSlotHour(slot.start)} - {formatSlotHour(slot.end)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-[297mm] mx-auto text-[11px] print:p-0 print:max-w-none print:text-[9px]">
        {/* Header */}
        <div className="mb-4 print:mb-3">
          <div className="flex items-start justify-between gap-4 border-b border-gray-300 pb-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-950 leading-tight print:text-xl">
                {t("medication_administration_record")}
              </h1>
              {facility?.name && (
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-800">
                  {facility.name}
                </p>
              )}
              {facility?.address && (
                <p className="whitespace-pre-line text-xs text-gray-500">
                  {facility.address}
                </p>
              )}
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt={t("logo")}
              className="h-10 w-auto shrink-0 object-contain"
            />
          </div>

          {encounter && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="grid grid-cols-2 gap-x-10">
                <div className="text-sm flex items-center gap-3">
                  <span>{t("patient")}</span>
                  <span className="font-semibold">
                    {":"}
                    {encounter.patient.name}
                  </span>
                </div>
                {encounter.period?.start && (
                  <div className="text-sm flex items-center gap-3">
                    <span>{t("encounter_date")}</span>
                    <span className="font-semibold">
                      {":"}
                      {format(
                        new Date(encounter.period.start),
                        "dd MMM yyyy, EEEE",
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-10 items-start">
                <div className="text-sm flex items-center gap-3">
                  <span>{`${t("age")}/${t("sex")}`}</span>
                  <span className="font-semibold">
                    {":"}
                    {`${formatPatientAge(encounter.patient, true)}, ${t(
                      `GENDER__${encounter.patient.gender}`,
                    )}`}
                  </span>
                </div>
                {hospitalId && (
                  <div className="text-sm flex items-center gap-3">
                    <span>{t("hospital_id")}</span>
                    <span className="font-semibold">
                      {":"}
                      {hospitalId}
                    </span>
                  </div>
                )}
              </div>
              {locationPath.length > 0 && (
                <div className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-gray-700">
                    {t("patient_ip_location")}:
                  </span>
                  {locationPath.map((loc, idx) => (
                    <span key={loc.id} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="text-gray-400">&rarr;</span>}
                      {loc.form === "bd" && (
                        <Bed className="size-3.5 text-gray-600" />
                      )}
                      <span className="font-semibold">{loc.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Regular Medications Drug Chart */}
        {groupedMedications.regular.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 border border-gray-400 p-2 flex items-center justify-between">
              <span className="text-gray-950 text-xl font-semibold ">
                {t("regular_medications")}
              </span>
              <div className="text-gray-600 text-base">
                <Trans
                  i18nKey="bed_time"
                  components={{
                    strong: <span className="text-gray-950" />,
                  }}
                />
                ,{" "}
                <Trans
                  i18nKey="morning_time"
                  components={{
                    strong: <span className="text-gray-950" />,
                  }}
                />
                ,{" "}
                <Trans
                  i18nKey="afternoon_time"
                  components={{
                    strong: <span className="text-gray-950" />,
                  }}
                />
                ,{" "}
                <Trans
                  i18nKey="night_time"
                  components={{
                    strong: <span className="text-gray-950" />,
                  }}
                />
              </div>
            </div>
            {dateRanges.map((dates, idx) => (
              <div
                key={`reg-${dates[0].toISOString()}`}
                className={cn(idx > 0 && "mt-3 print:break-before-page")}
              >
                <DrugChartTable
                  groups={groupedMedications.regular}
                  dates={dates}
                  adminIndex={adminIndex}
                  timeSlots={timeSlots}
                />
              </div>
            ))}
          </div>
        )}

        {/* PRN Medications */}
        {groupedMedications.prn.length > 0 && (
          <div className="mb-6 print:break-before-page">
            <div className="mb-2 border border-gray-400 p-2">
              <span className="text-gray-950 text-xl font-semibold ">
                {t("prn_medications")} ({t("as_needed")})
              </span>
            </div>
            {dateRanges.map((dates, idx) => (
              <div
                key={`prn-${dates[0].toISOString()}`}
                className={cn(idx > 0 && "mt-3 print:break-before-page")}
              >
                <DrugChartTable
                  groups={groupedMedications.prn}
                  dates={dates}
                  adminIndex={adminIndex}
                  timeSlots={timeSlots}
                  isPRN
                />
              </div>
            ))}
          </div>
        )}

        <PrintFooter
          className="mt-4"
          leftContent={t("computer_generated_medication_administration")}
        />
      </div>
    </PrintPreview>
  );
};

// Collect patient-facing instructions and clinical notes across every request
// in a medication group, de-duplicated for a compact footer strip.
const collectInstructionsAndNotes = (group: GroupedMedication) => {
  const instructions = new Set<string>();
  const notes = new Set<string>();

  group.requests.forEach((request) => {
    request.dosage_instruction.forEach((di) => {
      const patientInstruction = di.patient_instruction?.trim();
      if (patientInstruction) instructions.add(patientInstruction);
      di.additional_instruction?.forEach((ai) => {
        const text = ai.display?.trim();
        if (text) instructions.add(text);
      });
    });
    const note = request.note?.trim();
    if (note) notes.add(note);
  });

  return { instructions: [...instructions], notes: [...notes] };
};

// Drug Chart Table Component
const DrugChartTable = ({
  groups,
  dates,
  adminIndex,
  timeSlots,
  isPRN = false,
}: {
  groups: GroupedMedication[];
  dates: Date[];
  adminIndex: Record<
    string,
    Record<string, Record<string, MedicationAdministrationRead[]>>
  >;
  timeSlots: {
    label: string;
    abbreviation: string;
    start: number;
    end: number;
  }[];
  isPRN?: boolean;
}) => {
  const { t } = useTranslation();

  const slotLabels = timeSlots.map((slot) => slot.abbreviation);

  // Thicker divider after the final slot of a day; zebra shade alternate slots.
  const isLastSlotOfDay = (slotIndex: number) =>
    slotIndex === timeSlots.length - 1;
  const isShadedSlot = (slotIndex: number) => slotIndex % 2 === 1;

  const totalColumns = 2 + dates.length * timeSlots.length;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <table className="w-full border-collapse table-fixed">
        <thead className="mar-thead text-sm text-gray-600 ">
          <tr className="bg-gray-50">
            <th
              rowSpan={2}
              className="w-7 border-b border-r border-gray-300 p-1 text-center align-middle font-normal"
            >
              #
            </th>
            <th
              rowSpan={2}
              className="w-[200px] border-b border-r-2 border-gray-300 p-2 text-left align-middle font-normal"
            >
              {t("medication")}
            </th>
            {dates.map((date, dateIdx) => (
              <th
                key={date.toISOString()}
                colSpan={timeSlots.length}
                className={cn(
                  "border-b border-gray-200 px-1 pb-1 pt-1.5 text-center align-top font-normal",
                  dateIdx < dates.length - 1 && "border-r-2 border-r-gray-300",
                )}
              >
                <div>{format(date, "EEE")}</div>
                <div>{format(date, "dd/MM")}</div>
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50">
            {dates.map((date, dateIdx) =>
              timeSlots.map((slot, slotIdx) => (
                <th
                  key={`${date.toISOString()}-${slot.label}`}
                  title={slot.label}
                  className={cn(
                    "w-[26px] border-b border-gray-200 px-0.5 py-0.5 text-center font-normal",
                    isShadedSlot(slotIdx) && "bg-green-50",
                    isLastSlotOfDay(slotIdx) && dateIdx < dates.length - 1
                      ? "border-r-2 border-r-gray-300"
                      : "border-r border-gray-200",
                  )}
                >
                  {slotLabels[slotIdx]}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map((group, groupIdx) => {
            // Get the latest active request for display
            const latestRequest = group.requests[0];
            const instructions = latestRequest.dosage_instruction;
            const form =
              latestRequest.requested_product?.definitional?.dosage_form
                ?.display;
            const { instructions: patientInstructions, notes } =
              collectInstructionsAndNotes(group);
            const hasFooter =
              patientInstructions.length > 0 || notes.length > 0;

            return (
              <Fragment key={group.productId}>
                <tr className={cn("mar-row", isPRN && "bg-pink-50/40")}>
                  <td className="border-b border-r border-gray-300 p-1 text-center align-top font-semibold text-gray-950">
                    {groupIdx + 1}
                  </td>
                  <td className="border-b border-r-2 border-gray-300 p-2 align-top">
                    <div className="text-sm leading-tight text-gray-950 font-semibold">
                      {group.productName}
                    </div>
                    {form && <div className="mt-0.5 text-gray-600">{form}</div>}
                    <div className="mt-1 space-y-0.5">
                      {instructions.map((di, idx) => {
                        const summary = [
                          formatDosage(di),
                          isPRN ? t("as_needed") : formatFrequency(di),
                          formatDuration(di),
                          di.method?.display,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return summary ? (
                          <div key={idx} className="text-gray-600">
                            {summary}
                          </div>
                        ) : null;
                      })}
                    </div>
                    {group.requests.length > 1 && (
                      <div className="mt-1 text-[8px] text-gray-400">
                        ({group.requests.length} {t("orders")})
                      </div>
                    )}
                  </td>
                  {dates.map((date, dateIdx) =>
                    timeSlots.map((slot, slotIdx) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      // Check all requests in this group for administrations
                      const admins = group.requests.flatMap(
                        (req) =>
                          adminIndex[req.id]?.[dateKey]?.[slot.label] || [],
                      );

                      const hasAdmins = admins.length > 0;
                      const shaded = isShadedSlot(slotIdx);

                      // Checkmark per administration (up to 3, then show count)
                      const cellContent = hasAdmins ? (
                        admins.length <= 3 ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {admins.map((admin) => (
                              <span
                                key={admin.id}
                                className="text-[11px] font-bold leading-none text-green-600"
                              >
                                ✓
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="text-[11px] font-bold leading-none text-green-600">
                              ✓
                            </span>
                            <span className="text-[9px] font-semibold text-gray-600">
                              ×{admins.length}
                            </span>
                          </div>
                        )
                      ) : null;

                      return (
                        <td
                          key={`${date.toISOString()}-${slot.label}`}
                          className={cn(
                            "h-9 border-b border-gray-200 p-0 text-center align-middle",
                            shaded && "bg-green-50",
                            isLastSlotOfDay(slotIdx) &&
                              dateIdx < dates.length - 1
                              ? "border-r-2 border-r-gray-300"
                              : "border-r border-gray-200",
                          )}
                        >
                          {hasAdmins ? (
                            <>
                              {/* Print version - simple content without popover */}
                              <div className="hidden h-full w-full items-center justify-center print:flex">
                                {cellContent}
                              </div>
                              {/* Screen version - with popover for details */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex h-full min-h-[28px] w-full cursor-pointer items-center justify-center transition-colors hover:bg-green-100 print:hidden"
                                  >
                                    {cellContent}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-64 p-0 print:hidden"
                                  side="top"
                                >
                                  <div className="border-b bg-gray-50 px-3 py-2">
                                    <div className="text-sm font-semibold">
                                      {group.productName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {format(date, "EEE, dd MMM")} ·{" "}
                                      {slot.label}
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {admins.map((admin, idx) => (
                                      <div
                                        key={admin.id}
                                        className={cn(
                                          "px-3 py-2 text-sm",
                                          idx !== admins.length - 1 &&
                                            "border-b",
                                        )}
                                      >
                                        <div className="flex items-start justify-between">
                                          <span className="font-medium">
                                            {format(
                                              new Date(
                                                admin.occurrence_period_start,
                                              ),
                                              "HH:mm",
                                            )}
                                          </span>
                                          <span className="text-xs text-gray-600">
                                            {admin.dosage?.dose?.value}{" "}
                                            {admin.dosage?.dose?.unit?.display}
                                          </span>
                                        </div>
                                        <div className="mt-0.5 text-xs text-gray-600">
                                          {t("by")}{" "}
                                          {formatName(admin.created_by)}
                                        </div>
                                        {admin.note && (
                                          <div className="mt-1 text-xs italic text-gray-500">
                                            {admin.note}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </>
                          ) : (
                            <span className="text-gray-200">·</span>
                          )}
                        </td>
                      );
                    }),
                  )}
                </tr>
                {hasFooter && (
                  <tr className="mar-row">
                    <td className="border-b border-r border-gray-300" />
                    <td
                      colSpan={totalColumns - 1}
                      className="border-b border-gray-300 bg-gray-50/70 px-2 py-1 text-xs leading-snug text-gray-600"
                    >
                      {patientInstructions.length > 0 && (
                        <span>
                          <span>{t("instructions")}:</span>
                          <span className="font-semibold text-gray-700">
                            {patientInstructions.join("; ")}
                          </span>{" "}
                        </span>
                      )}
                      {patientInstructions.length > 0 && notes.length > 0 && (
                        <span className="mx-2 text-gray-300">|</span>
                      )}
                      {notes.length > 0 && (
                        <span>
                          <span>{t("note")}:</span>{" "}
                          <span className="font-semibold text-gray-600">
                            {notes.join("; ")}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
