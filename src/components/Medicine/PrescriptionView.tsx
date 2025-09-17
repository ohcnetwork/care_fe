import { useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
import { Link } from "raviger";
import * as React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import Loading from "@/components/Common/Loading";
import { MedicationsTable } from "@/components/Medicine/MedicationsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface PrescriptionViewProps {
  patientId: string;
  prescriptionId: string;
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

  const { data: prescription, isLoading } = useQuery({
    queryKey: ["prescription", patientId, prescriptionId],
    queryFn: query(prescriptionApi.get, {
      pathParams: { patientId, id: prescriptionId! },
    }),
    enabled: !!patientId && !!prescriptionId,
  });

  if (!prescription) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-secondary/10 p-3">
          <ReceiptTextIcon className="text-3xl text-gray-500" />
        </div>
        <div className="max-w-[200px] space-y-1">
          <h3 className="font-medium">{t("select_prescription")}</h3>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-2">
        <div>
          <h3 className="font-semibold text-lg">
            {formatDateTime(prescription.created_date, "DD/MM/YYYY hh:mm A")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("prescribed_by")}: {formatName(prescription.prescribed_by)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-gray-950 hover:text-gray-700 h-9"
              data-cy="edit-prescription"
            >
              <Link href={`questionnaire/medication_request`}>
                {!prescription.medications?.length ? (
                  <>
                    <PlusIcon className="mr-2 size-4" />
                    {t("add")}
                  </>
                ) : (
                  <>
                    <PencilIcon className="mr-2 size-4" />
                    {t("edit")}
                  </>
                )}
              </Link>
            </Button>
          )}
          {!!facilityId && (
            <Button
              variant="outline"
              disabled={!prescription.medications?.length}
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
              disabled={!prescription.medications?.length}
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
      <div className="flex flex-col gap-4 px-4">
        <div className="flex items-center gap-2">
          <CareIcon icon="l-search" className="text-lg text-gray-500" />
          <Input
            placeholder={t("search_medications")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-hidden placeholder:text-gray-500"
          />
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
        <MedicationsTable
          medications={
            prescription.medications.filter((medication) =>
              (
                medication.medication.display ||
                medication.requested_product?.name ||
                ""
              )
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
            ) || []
          }
          showActiveOnly={false}
        />
      </div>
    </div>
  );
}
