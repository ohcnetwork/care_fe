import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, ChevronDown } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import patientApi from "@/types/emr/patient/patientApi";
import query from "@/Utils/request/query";

import { PatientHeader } from "@/components/Patient/PatientHeader";
import { Badge } from "@/components/ui/badge";
import { PrescriptionSummary } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import { getTagHierarchyDisplay } from "@/types/emr/tagConfig/tagConfig";
import { PaginatedResponse } from "@/Utils/request/types";
import DispensedMedicationList from "./DispensedMedicationList";

interface Props {
  facilityId: string;
  patientId: string;
  status?: MedicationDispenseStatus;
}

export default function DispensesView({
  facilityId,
  patientId,
  status = MedicationDispenseStatus.completed,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const defaultVisibleStatuses = [
    MedicationDispenseStatus.preparation,
    MedicationDispenseStatus.in_progress,
    MedicationDispenseStatus.completed,
    MedicationDispenseStatus.cancelled,
  ];

  const allStatuses = Object.values(MedicationDispenseStatus);
  const [visibleTabs, setVisibleTabs] = useState<MedicationDispenseStatus[]>(
    defaultVisibleStatuses,
  );
  const [dropdownItems, setDropdownItems] = useState<
    MedicationDispenseStatus[]
  >(allStatuses.filter((status) => !defaultVisibleStatuses.includes(status)));

  const handleDropdownSelect = (value: MedicationDispenseStatus) => {
    const lastVisibleTab = visibleTabs[visibleTabs.length - 1];
    const newVisibleTabs = [...visibleTabs.slice(0, -1), value];
    const newDropdownItems = [
      ...dropdownItems.filter((item) => item !== value),
      lastVisibleTab,
    ];

    setVisibleTabs(newVisibleTabs);
    setDropdownItems(newDropdownItems);
    navigate(
      `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/${value}`,
    );
  };

  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patientId,
  });

  const { data: prescriptionTags } = useQuery({
    queryKey: ["prescriptionQueue", facilityId, patientId],
    queryFn: query(prescriptionApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        patient_external_id: patientId,
      },
    }),
    select: (data: PaginatedResponse<PrescriptionSummary>) =>
      data.results.flatMap((item) => item.tags),
  });

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_dispense/`,
            )
          }
          data-shortcut-id="go-back"
          size="sm"
        >
          <ArrowLeftIcon className="size-4" />
          {t("back_to_dispense_queue")}
        </Button>
      </div>
      {patientData && (
        <Card className="flex gap-4 mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
          {prescriptionTags && prescriptionTags.length > 0 && (
            <div className="flex flex-col gap-1 items-start mt-5">
              <span className="text-xs text-gray-700">
                {t("prescription_tags")}:
              </span>
              <div className="flex flex-wrap items-start gap-2 text-sm whitespace-nowrap">
                {prescriptionTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="capitalize"
                    title={tag.description}
                  >
                    {getTagHierarchyDisplay(tag)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
      <Tabs
        value={status}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_dispense/patient/${patientId}/${value}`,
          )
        }
      >
        <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
          {visibleTabs.map((statusValue) => (
            <TabsTrigger
              key={statusValue}
              value={statusValue}
              className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700  data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
            >
              {t(statusValue)}
            </TabsTrigger>
          ))}
          {dropdownItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gray-500 font-semibold hover:text-gray-900 hover:bg-transparent pb-2.5 px-2.5"
                >
                  {t("more")}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {dropdownItems.map((statusValue) => (
                  <DropdownMenuItem
                    key={statusValue}
                    onClick={() => handleDropdownSelect(statusValue)}
                    className="text-gray-950 font-medium text-sm"
                  >
                    {t(statusValue)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>

        <div>
          {Object.values(MedicationDispenseStatus).map((statusValue) => (
            <TabsContent key={statusValue} value={statusValue} className="p-2">
              <DispensedMedicationList
                facilityId={facilityId}
                patientId={patientId}
                locationId={locationId}
                status={statusValue}
              />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </Page>
  );
}
