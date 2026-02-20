import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import Loading from "@/components/Common/Loading";
import PrintFooter from "@/components/Common/PrintFooter";
import { formatDosage, formatFrequency } from "@/components/Medicine/utils";

import encounterApi from "@/types/emr/encounter/encounterApi";
import { MedicationAdministrationRead } from "@/types/emr/medicationAdministration/medicationAdministration";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import {
  ACTIVE_MEDICATION_STATUSES,
  MedicationRequestRead,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import query from "@/Utils/request/query";
import {
  formatName,
  formatPatientAge,
  getWeeklyIntervalsFromTodayTill,
} from "@/Utils/utils";

// Generate time slots based on count per day
const generateTimeSlots = (count: number) => {
  const hoursPerSlot = 24 / count;
  const slots = [];
  for (let i = 0; i < count; i++) {
    const start = i * hoursPerSlot;
    const end = (i + 1) * hoursPerSlot;
    slots.push({
      label: `${String(start).padStart(2, "0")}:00`,
      start,
      end: end === 24 ? 24 : end,
    });
  }
  return slots;
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
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        limit: 1000,
      },
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
        pageSize: 1000,
      }),
      enabled: !!patientId,
    });

  // Filter state
  const [showDiscontinued, setShowDiscontinued] = useState(false);
  const [slotsPerDay, setSlotsPerDay] = useState(4);

  // Generate time slots based on selection
  const timeSlots = useMemo(
    () => generateTimeSlots(slotsPerDay),
    [slotsPerDay],
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
      const isPRN = med.dosage_instruction[0]?.as_needed_boolean || false;
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

  // Get date range for the chart
  const dateRange = useMemo(() => {
    if (!encounter?.period?.start) return [];
    const intervals = getWeeklyIntervalsFromTodayTill(encounter.period.start);
    if (intervals.length === 0) return [];

    // Get the most recent week
    const latestInterval = intervals[0];
    const dates: Date[] = [];
    const current = new Date(latestInterval.start);
    const end = new Date(latestInterval.end);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates.slice(0, 7); // Max 7 days
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
    >
      {/* Print Options - hidden when printing */}
      <div className="print:hidden mb-4 p-3 bg-gray-50 rounded-lg border flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-discontinued"
            checked={showDiscontinued}
            onCheckedChange={(checked) => setShowDiscontinued(checked === true)}
          />
          <Label htmlFor="show-discontinued" className="text-sm cursor-pointer">
            {t("show_discontinued_medications")}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">{t("time_slots_per_day")}:</Label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {[1, 2, 3, 4].map((num) => (
              <Button
                key={num}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-10 rounded-none border-r last:border-r-0 border-gray-300",
                  slotsPerDay === num
                    ? "bg-primary-100 text-primary-700 font-semibold"
                    : "hover:bg-gray-100",
                )}
                onClick={() => setSlotsPerDay(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-[297mm] mx-auto text-[11px] print:text-[10px]">
        {/* Header */}
        <div className="border-2 border-gray-400 mb-4">
          <div className="flex justify-between items-start p-3 border-b-2 border-gray-400 bg-gray-100">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">
                {t("medication_administration_record")}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {encounter?.facility?.name}
              </p>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Logo"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Patient Info - Simplified */}
          <div className="grid grid-cols-4 divide-x-2 divide-gray-400">
            <div className="p-2 col-span-2">
              <div className="font-bold text-xs text-gray-500 uppercase">
                {t("patient_name")}
              </div>
              <div className="font-bold text-base">
                {encounter?.patient.name}
              </div>
            </div>
            <div className="p-2">
              <div className="font-bold text-xs text-gray-500 uppercase">
                {t("age")} / {t("sex")}
              </div>
              <div className="font-semibold">
                {encounter?.patient &&
                  `${formatPatientAge(encounter.patient, true)}, ${t(`GENDER__${encounter.patient.gender}`)}`}
              </div>
            </div>
            <div className="p-2">
              <div className="font-bold text-xs text-gray-500 uppercase">
                {t("encounter_date")}
              </div>
              <div className="font-semibold">
                {encounter?.period?.start &&
                  format(new Date(encounter.period.start), "dd MMM yyyy")}
              </div>
            </div>
          </div>
        </div>

        {/* Regular Medications Drug Chart */}
        {groupedMedications.regular.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm uppercase tracking-wide mb-2 bg-gray-800 text-white px-2 py-1">
              {t("regular_medications")}
            </h2>
            <DrugChartTable
              groups={groupedMedications.regular}
              dates={dateRange}
              adminIndex={adminIndex}
              timeSlots={timeSlots}
            />
          </div>
        )}

        {/* PRN Medications */}
        {groupedMedications.prn.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm uppercase tracking-wide mb-2 bg-pink-700 text-white px-2 py-1">
              {t("prn_medications")} ({t("as_needed")})
            </h2>
            <DrugChartTable
              groups={groupedMedications.prn}
              dates={dateRange}
              adminIndex={adminIndex}
              timeSlots={timeSlots}
              isPRN
            />
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
  timeSlots: { label: string; start: number; end: number }[];
  isPRN?: boolean;
}) => {
  const { t } = useTranslation();

  // Check if this is the last slot of the day (needs thicker border)
  const isLastSlotOfDay = (slotIndex: number) =>
    slotIndex === timeSlots.length - 1;

  return (
    <div className="border-1 border-gray-400 overflow-hidden">
      <table className="w-full border-collapse text-[10px] table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th
              className="border-r-2 border-b-1 border-gray-400 p-1.5 text-left font-bold w-[160px]"
              rowSpan={2}
            >
              {t("medication")}
            </th>
            {dates.map((date, dateIdx) => (
              <th
                key={date.toISOString()}
                className={cn(
                  "border-b border-gray-400 p-1 text-center font-bold",
                  dateIdx < dates.length - 1
                    ? "border-r-2 border-r-gray-400"
                    : "border-r border-gray-400",
                )}
                colSpan={timeSlots.length}
              >
                <div className="font-bold">{format(date, "EEE")}</div>
                <div className="text-[9px] font-normal">
                  {format(date, "dd/MM")}
                </div>
              </th>
            ))}
          </tr>
          <tr className="bg-gray-50">
            {dates.map((date, dateIdx) =>
              timeSlots.map((slot, slotIdx) => (
                <th
                  key={`${date.toISOString()}-${slot.label}`}
                  className={cn(
                    "border-b border-gray-400 p-0.5 text-center font-normal text-[9px] w-[32px]",
                    isLastSlotOfDay(slotIdx) && dateIdx < dates.length - 1
                      ? "border-r-2 border-r-gray-400"
                      : "border-r border-gray-400",
                  )}
                >
                  {slot.label.slice(0, 2)}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            // Get the latest active request for display
            const latestRequest = group.requests[0];
            const dosage = latestRequest.dosage_instruction[0];
            const doseText = formatDosage(dosage);
            const routeText = dosage?.route?.display;
            const frequencyText = isPRN
              ? t("as_needed")
              : formatFrequency(dosage);

            return (
              <tr key={group.productId} className={cn(isPRN && "bg-pink-50")}>
                <td className="border-r-2 border-b border-gray-400 p-1.5 align-top">
                  <div className="font-bold text-[11px] leading-tight">
                    {group.productName}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-0.5 leading-snug">
                    {[doseText, routeText, frequencyText]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {group.requests.length > 1 && (
                    <div className="text-[8px] text-gray-400 mt-0.5">
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

                    // Show checkmarks for each administration (up to 3, then show count)
                    const cellContent = hasAdmins ? (
                      <div className="flex flex-col items-center justify-center h-full gap-0.5">
                        {admins.length <= 3 ? (
                          // Show individual checkmarks
                          <div className="flex items-center justify-center gap-0.5">
                            {admins.map((admin) => (
                              <span
                                key={admin.id}
                                className="text-green-700 text-[10px] font-bold"
                              >
                                ✓
                              </span>
                            ))}
                          </div>
                        ) : (
                          // Show count with checkmark
                          <div className="flex items-center gap-0.5">
                            <span className="text-green-700 text-[10px] font-bold">
                              ✓
                            </span>
                            <span className="text-[9px] font-semibold text-gray-700">
                              ×{admins.length}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null;

                    return (
                      <td
                        key={`${date.toISOString()}-${slot.label}`}
                        className={cn(
                          "border-b border-gray-400 p-0 text-center align-middle h-8",
                          isLastSlotOfDay(slotIdx) && dateIdx < dates.length - 1
                            ? "border-r-2 border-r-gray-400"
                            : "border-r border-gray-400",
                          hasAdmins && "bg-green-100",
                        )}
                      >
                        {hasAdmins ? (
                          <>
                            {/* Print version - simple content without popover */}
                            <div className="hidden print:flex items-center justify-center w-full h-full">
                              {cellContent}
                            </div>
                            {/* Screen version - with popover for details */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="w-full h-full min-h-[28px] cursor-pointer hover:bg-green-200 transition-colors flex items-center justify-center print:hidden"
                                >
                                  {cellContent}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-64 p-0 print:hidden"
                                side="top"
                              >
                                <div className="bg-gray-50 px-3 py-2 border-b">
                                  <div className="font-semibold text-sm">
                                    {group.productName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {format(date, "EEE, dd MMM")} · {slot.label}
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {admins.map((admin, idx) => (
                                    <div
                                      key={admin.id}
                                      className={cn(
                                        "px-3 py-2 text-sm",
                                        idx !== admins.length - 1 && "border-b",
                                      )}
                                    >
                                      <div className="flex justify-between items-start">
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
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {t("by")} {formatName(admin.created_by)}
                                      </div>
                                      {admin.note && (
                                        <div className="text-xs text-gray-500 mt-1 italic">
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
