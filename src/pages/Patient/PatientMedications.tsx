import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";
import {
  PRESCRIPTION_STATUS_STYLES,
  PrescritionList,
} from "@/types/emr/prescription/prescription";

function PrescriptionCard({
  prescription,
  token,
}: {
  prescription: PrescritionList;
  token?: string;
}) {
  const { t } = useTranslation();

  const { data: detail, isLoading } = useQuery({
    queryKey: ["portal-prescription", prescription.id],
    queryFn: query(patientPortalApi.getPrescription, {
      pathParams: { id: prescription.id },
      headers: { Authorization: `Bearer ${token}` },
    }),
    enabled: !!token,
  });

  return (
    <Card className="shadow-sm overflow-hidden">
      <Collapsible>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="px-6 pb-3 bg-secondary-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <CardTitle>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {prescription.name || t("prescription")}
                </span>
                <span className="text-xs text-gray-600">
                  {formatDateTime(prescription.created_date)}
                </span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant={PRESCRIPTION_STATUS_STYLES[prescription.status]}>
                {t(prescription.status)}
              </Badge>
              <CareIcon icon="l-angle-down" className="size-4" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-4 px-2 md:px-6 pb-3">
            <div className="flex flex-col md:flex-row md:gap-6 mb-3 px-2">
              <div className="flex flex-col gap-0 items-start">
                <span className="text-xs font-medium">
                  {t("prescribed_by")}:{" "}
                </span>
                <span className="text-sm">
                  {formatName(prescription.prescribed_by)}
                </span>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <MedicationsTable
                medications={detail?.medications ?? []}
                showActiveOnly={false}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function PatientMedications() {
  const { t } = useTranslation();

  const patient = usePatientContext();
  const tokenData = patient?.tokenData;

  if (!tokenData) {
    navigate("/login");
  }

  const { data: prescriptionsData, isLoading } = useQuery({
    queryKey: ["portal-prescriptions", tokenData?.phoneNumber],
    queryFn: query(patientPortalApi.listPrescriptions, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  const prescriptions = prescriptionsData?.results
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
    );

  return (
    <div className="container mx-auto mt-2">
      <div className="flex justify-between w-full">
        <span className="text-xl font-bold">{t("medications")}</span>
      </div>
      <div className="grid gap-4 mt-4">
        {isLoading ? (
          <CardListSkeleton count={4} />
        ) : prescriptions && prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              token={tokenData?.token}
            />
          ))
        ) : (
          <EmptyState
            icon={<CareIcon icon="l-tablets" className="text-primary size-6" />}
            title={t("no_medications_found")}
          />
        )}
      </div>
    </div>
  );
}
