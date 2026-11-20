import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import PrintLoading from "@/CAREUI/misc/PrintLoading";
import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  type AdministrationIndex,
  type GroupedMedication,
  buildMedicationAdministrationPrintContent,
} from "@/components/Medicine/MedicationAdministration/medicationAdministrationPrintData";

import useCurrentFacilitySilently from "@/pages/Facility/utils/useCurrentFacility";
import encounterApi from "@/types/emr/encounter/encounterApi";
import medicationAdministrationApi from "@/types/emr/medicationAdministration/medicationAdministrationApi";
import { ACTIVE_MEDICATION_STATUSES } from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import {
  type AdministrableProductType,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import query from "@/Utils/request/query";

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

export const PrintMedicationAdministration = (props: {
  facilityId: string;
  encounterId: string;
  patientId: string;
  productType: AdministrableProductType;
}) => {
  const { facilityId, encounterId, patientId, productType } = props;
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();
  const isMedication = productType === ProductKnowledgeType.medication;

  const { data: encounter } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
  });

  // Fetch all medication requests for this encounter
  const { data: medicationRequests, isLoading: requestsLoading } = useQuery({
    queryKey: [
      "medication_requests_print",
      patientId,
      encounterId,
      productType,
    ],
    queryFn: query.paginated(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        ...(productType === ProductKnowledgeType.medication
          ? { medications_only: true }
          : { product_type: productType }),
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
    const cursor = new Date(start);

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
    const index: AdministrationIndex = {};

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

  if (requestsLoading || adminsLoading) return <PrintLoading />;

  const hasData =
    groupedMedications.regular.length > 0 || groupedMedications.prn.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border-2 border-gray-200 border-dashed p-4 text-gray-500">
        {isMedication
          ? t("no_medications_found_for_this_encounter")
          : t("no_nutritional_products_found_for_this_encounter")}
      </div>
    );
  }

  const printOptions = (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-discontinued"
          checked={showDiscontinued}
          onCheckedChange={(checked) => setShowDiscontinued(checked === true)}
        />
        <Label htmlFor="show-discontinued" className="text-sm cursor-pointer">
          {isMedication
            ? t("show_discontinued_medications")
            : t("show_discontinued_nutritional_products")}
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
  );

  return (
    <TypstPrintPreview
      template="medication-administration"
      title={`${
        isMedication ? t("drug_chart") : t("intake_chart")
      } - ${encounter?.patient.name}`}
      content={
        encounter
          ? buildMedicationAdministrationPrintContent({
              encounter,
              groupedMedications,
              dateRanges,
              adminIndex,
              timeSlots,
              isMedication,
              productType,
              t,
            })
          : undefined
      }
      facility={facility}
      templateSlug={PrintTemplateType.medication_administration}
      landscape
      defaultMargin={6}
      toolbar={printOptions}
    />
  );
};
