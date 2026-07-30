import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { PatientAppShell } from "@/components/Patient/PatientAppShell";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";
import { PRESCRIPTION_STATUS_STYLES } from "@/types/emr/prescription/prescription";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className="text-[13px] font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function PrescriptionDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { tokenData } = usePatientContext();

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["portal-prescription", id],
    queryFn: query(patientPortalApi.getPrescription, {
      pathParams: { id },
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  return (
    <PatientAppShell
      title={t("prescription")}
      backTo="/patient/records?tab=prescriptions"
      hideTabs
    >
      <div className="flex flex-col gap-3 p-4">
        {isLoading || !prescription ? (
          <>
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-bold text-gray-900">
                  {formatName(prescription.prescribed_by)}
                </span>
                <Badge
                  variant={PRESCRIPTION_STATUS_STYLES[prescription.status]}
                >
                  {t(prescription.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2.5 border-t border-gray-100 pt-2.5">
                <MetaField
                  label={t("prescribed_on")}
                  value={dayjs(prescription.created_date).format("DD MMM YYYY")}
                />
                {prescription.encounter?.facility?.name && (
                  <MetaField
                    label={t("facility")}
                    value={prescription.encounter.facility.name}
                  />
                )}
                {prescription.encounter?.patient?.name && (
                  <MetaField
                    label={t("patient")}
                    value={prescription.encounter.patient.name}
                  />
                )}
                {prescription.name && (
                  <MetaField label={t("name")} value={prescription.name} />
                )}
              </div>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {t("medications")} · {prescription.medications?.length ?? 0}
            </span>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-2">
              <MedicationsTable
                medications={prescription.medications ?? []}
                showActiveOnly={false}
              />
            </div>

            {prescription.note && (
              <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <span className="text-[13px] font-bold text-gray-900">
                  {t("patient_records__doctors_advice")}
                </span>
                <span className="text-[12.5px] leading-relaxed text-gray-600">
                  {prescription.note}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
