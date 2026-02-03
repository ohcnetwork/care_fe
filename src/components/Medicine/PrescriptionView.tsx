import { useQueries, useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Link } from "raviger";
import * as React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import Loading from "@/components/Common/Loading";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Markdown } from "@/components/ui/markdown";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface PrescriptionViewProps {
  patientId: string;
  prescriptionId?: string;
  canWrite?: boolean;
  facilityId?: string;
  encounterId?: string;
}

export default function PrescriptionView({
  patientId,
  prescriptionId,
  canWrite = false,
  facilityId,
  encounterId,
}: PrescriptionViewProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: prescription, isLoading: prescriptionLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!patientId && !!prescriptionId,
  });

  const { data: prescriptionList, isLoading: listLoading } = useQuery({
    queryKey: ["prescription_list", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId, facility: facilityId },
    }),
    enabled: !!patientId && !!encounterId && !!facilityId && !prescriptionId,
  });

  const prescriptionQueries = useQueries({
    queries: (prescriptionList?.results || []).map((pres) => ({
      queryKey: ["prescription", patientId, pres.id],
      queryFn: query(prescriptionApi.get, {
        pathParams: { patientId, id: pres.id! },
        queryParams: { facility: facilityId },
      }),
    })),
  });

  const allPrescriptionsLoading = prescriptionQueries.some((q) => q.isLoading);

  if (prescriptionLoading || listLoading || allPrescriptionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  const prescriptions = prescriptionId
    ? prescription
      ? [prescription]
      : []
    : prescriptionQueries
        .map((q) => q.data)
        .filter((p): p is PrescriptionRead => !!p);

  const allMedications = prescriptions.flatMap((p) => p.medications || []);

  const hasMedications = allMedications.length > 0;

  const filteredMedications = allMedications.filter((medication) =>
    displayMedicationName(medication)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-between px-2 my-2 w-full">
        <div className="hidden lg:block">
          <h3 className="font-semibold text-lg">
            {prescription && prescriptionId
              ? formatDateTime(prescription.created_date, "DD/MM/YYYY hh:mm A")
              : t("all_prescriptions")}
          </h3>
          <p className="text-sm text-gray-500">
            {prescription && prescriptionId
              ? `${t("prescribed_by")}: ${formatName(prescription.prescribed_by)}`
              : t("medications_from_all_prescriptions")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canWrite && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-gray-950 hover:text-gray-700 h-9"
            >
              <Link
                href={
                  prescriptionId
                    ? `questionnaire/medication_request?prescription=${prescriptionId}`
                    : `questionnaire/medication_request`
                }
              >
                {prescriptionId ? (
                  <>
                    <PencilIcon className="mr-2 size-4" />
                    {t("edit")}
                  </>
                ) : (
                  <>
                    <PlusIcon className="mr-2 size-4" />
                    {t("create")}
                  </>
                )}
              </Link>
            </Button>
          )}
          {!!facilityId && prescription && prescriptionId && (
            <Button
              variant="outline"
              disabled={!hasMedications}
              size="sm"
              className="text-gray-950 hover:text-gray-700 h-9"
            >
              <Link href={`../../prescription/${prescriptionId}/print`}>
                <CareIcon icon="l-print" className="mr-2" />
                {t("print")}
              </Link>
            </Button>
          )}
          {!!facilityId && (
            <Button
              variant="outline"
              disabled={!hasMedications}
              size="sm"
              className="text-gray-950 hover:text-gray-700 h-9"
            >
              <Link href={`../${encounterId}/prescriptions/print`}>
                <CareIcon icon="l-print" className="mr-2" />
                {t("print_all_prescriptions")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <CareIcon
              icon="l-search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
            />
            <Input
              placeholder={t("search_medications")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-gray-500 hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <CareIcon icon="l-times" className="text-lg" />
            </Button>
          )}
        </div>
        {prescription?.note && (
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-1">{t("note")}</p>
            <Markdown
              content={prescription?.note}
              prose={false}
              className="text-sm"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          {hasMedications ? (
            <MedicationsTable
              medications={filteredMedications}
              showActiveOnly={false}
            />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 text-gray-500">
              {t("no_medications_found_for_this_encounter")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
