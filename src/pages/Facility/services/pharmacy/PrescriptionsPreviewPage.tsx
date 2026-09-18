import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { useShortcutSubContext } from "@/context/ShortcutContext";
import UnbilledPrescriptionsCard from "@/pages/Facility/services/pharmacy/billMedications/UnbilledPrescriptionsCard";
import PrescriptionsPreviewTable from "@/pages/Facility/services/pharmacy/components/PrescriptionsPreviewTable";
import { MedicationRequestDispenseStatus } from "@/types/emr/medicationRequest/medicationRequest";
import {
  PrescriptionRead,
  PrescriptionStatus,
} from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import query from "@/Utils/request/query";
import { useQueries } from "@tanstack/react-query";
import { ArrowRightIcon, ListPlus } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

interface Props {
  facilityId: string;
  locationId: string;
  patientId: string;
  prescriptionIds: string[];
}

interface QParams {
  search?: string;
  status?: MedicationRequestDispenseStatus | "all";
}

export default function PrescriptionsPreviewPage({
  facilityId,
  patientId,
  prescriptionIds,
}: Props) {
  const { t } = useTranslation();
  useShortcutSubContext("facility:pharmacy");

  const [qParams, setQParams] = useQueryParams<QParams>();

  const { prescriptions, anyEncounter, activePrescriptionIds } = useQueries({
    queries: prescriptionIds.map((prescriptionId) => ({
      queryKey: ["prescription", patientId, prescriptionId],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: prescriptionId },
      }),
    })),
    combine: (results) => {
      return {
        isLoading: results.some((result) => result.isLoading),
        prescriptions: results.map((result) => result.data),
        activePrescriptionIds: results
          .filter((result) => result.data?.status === PrescriptionStatus.active)
          .map((result) => result.data?.id ?? ""),
        anyEncounter: results.find((result) => !!result.data)?.data.encounter,
      };
    },
  });

  if (!anyEncounter) {
    return <Loading />;
  }

  const statusCounts = getDispenseStatusCount(prescriptions);

  return (
    <Page title={t("prescription_preview")} hideTitleOnPage={true}>
      <div className="flex flex-col gap-3">
        <div>
          <h4 className="font-semibold text-xl">{t("prescription_preview")}</h4>
        </div>

        <div className="bg-white rounded-md border border-gray-200 p-4">
          <PatientHeader
            patient={anyEncounter.patient}
            facilityId={facilityId}
          />
        </div>

        <div className="flex justify-between">
          <div className="flex gap-3">
            <div className="w-full lg:w-64">
              <Input
                value={qParams.search || ""}
                onChange={(e) => setQParams({ search: e.target.value })}
                placeholder={t("search_medications")}
              />
            </div>
            <div className="md:flex gap-2">
              <FilterSelect
                value={qParams.status || "all"}
                onValueChange={(value) =>
                  setQParams({
                    status: value as MedicationRequestDispenseStatus | "all",
                  })
                }
                options={[
                  "all",
                  MedicationRequestDispenseStatus.incomplete,
                  MedicationRequestDispenseStatus.partial,
                  MedicationRequestDispenseStatus.complete,
                ]}
                label={t("dispense_status") as string}
                onClear={() => setQParams({ status: "all" })}
              />
            </div>
          </div>
          {activePrescriptionIds.length > 0 && (
            <Button size="lg" asChild>
              <Link
                href={`/medication_requests/patient/${patientId}/bill/prescriptions/${activePrescriptionIds.join(",")}`}
              >
                {t("start_billing")}
                <ShortcutBadge actionId="billing-action" />
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          )}
        </div>

        <UnbilledPrescriptionsCard
          included={prescriptionIds}
          patientId={patientId}
          facilityId={facilityId}
          allButton={({ prescriptionIds }) => (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/medication_requests/patient/${patientId}/prescriptions/${prescriptionIds.join(",")}`}
              >
                <ListPlus className="size-4" />
                {t("show_all")}
              </Link>
            </Button>
          )}
        />

        <div className="flex justify-between">
          <div>
            <span className="font-semibold text-gray-950">
              {t("total_prescriptions_count", { count: prescriptions.length })}
            </span>
            <span className="font-normal text-gray-700">
              {" · "}
              {t("complete_count", { count: statusCounts.complete })}
              {" · "}
              {t("partial_count", {
                count: statusCounts.partial,
              })}
              {" · "}
              {t("incomplete_count", {
                count: statusCounts.incomplete,
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <PrescriptionsPreviewTable
            prescriptions={prescriptions}
            filters={{
              medicationSearch: qParams.search || "",
              medicationDispenseStatus:
                qParams.status === "all" ? null : qParams.status,
            }}
          />
        </div>
      </div>
    </Page>
  );
}

const getDispenseStatusCount = (
  prescriptions: (PrescriptionRead | undefined)[],
) => {
  let complete = 0;
  let partial = 0;
  let incomplete = 0;

  for (const prescription of prescriptions) {
    if (!prescription) {
      continue;
    }

    const medications = prescription.medications.filter(
      ({ status }) => status === "active",
    );

    if (
      medications.every(
        (medication) =>
          medication.dispense_status ===
          MedicationRequestDispenseStatus.complete,
      )
    ) {
      complete++;
      continue;
    }

    if (
      medications.every(
        (medication) =>
          (medication.dispense_status ||
            MedicationRequestDispenseStatus.incomplete) ===
          MedicationRequestDispenseStatus.incomplete,
      )
    ) {
      incomplete++;
      continue;
    }

    partial++;
  }
  return { complete, partial, incomplete };
};
