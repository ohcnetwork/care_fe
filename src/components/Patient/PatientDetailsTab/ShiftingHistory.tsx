import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import AuthorizedButton from "@/components/Common/AuthorizedButton";
import { PatientProps } from "@/components/Patient/PatientDetailsTab";
import { ShiftCreate } from "@/components/Patient/ShiftCreate";
import { PatientModel } from "@/components/Patient/models";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ShiftingTable from "@/components/Shifting/ShiftingTable";

import useFilters from "@/hooks/useFilters";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

const ShiftingHistory = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;
  const { t } = useTranslation();
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const { qParams, Pagination, resultsPerPage } = useFilters({
    cacheBlacklist: ["patient_name"],
  });

  const isPatientInactive = (patientData: PatientModel, facilityId: string) => {
    return (
      !patientData.is_active ||
      !(patientData?.last_consultation?.facility === facilityId)
    );
  };

  const { data: shiftData, loading } = useTanStackQueryInstead(
    routes.listShiftRequests,
    {
      query: {
        ...formatFilter({
          ...qParams,
          offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        }),
        patient: id,
      },
      prefetch: !!id,
    },
  );

  const CURRENT_STATUSES = [
    "APPROVED",
    "DESTINATION APPROVED",
    "PATIENT TO BE PICKED UP",
    "TRANSFER IN PROGRESS",
  ];
  const PREVIOUS_STATUSES = ["COMPLETED", "PATIENT EXPIRED", "CANCELLED"];

  const filteredShiftData = shiftData?.results
    ? activeTab === "current"
      ? shiftData.results.filter((shift) =>
          CURRENT_STATUSES.includes(shift.status),
        )
      : shiftData.results.filter((shift) =>
          PREVIOUS_STATUSES.includes(shift.status),
        )
    : [];
  return (
    <section className="mt-4">
      <div className="flex justify-between items-center">
        <div className="flex mb-4 bg-gray-100 text-sm w-fit rounded-lg px-1 py-1">
          <button
            className={`px-3 py-2 ${
              activeTab === "current"
                ? "bg-white rounded-lg font-semibold shadow"
                : ""
            }`}
            onClick={() => setActiveTab("current")}
          >
            {t("current_shifting")}
          </button>
          <button
            className={`px-3 py-2 ${
              activeTab === "previous"
                ? "bg-white rounded-lg font-semibold shadow"
                : ""
            }`}
            onClick={() => setActiveTab("previous")}
          >
            {t("previous_shifting")}
          </button>
        </div>
        <AuthorizedButton
          id="shift_create_button"
          variant="outline_primary"
          disabled={isPatientInactive(patientData, facilityId)}
          size="default"
          onClick={() => setIsSlideOverOpen(true)}
          authorizeFor={NonReadOnlyUsers}
        >
          <span className="flex w-full items-center justify-start gap-2">
            <CareIcon icon="l-ambulance" className="text-xl" />
            {t("shift")}
          </span>
        </AuthorizedButton>
        <ShiftCreate
          facilityId={facilityId}
          patientId={id}
          open={isSlideOverOpen}
          setOpen={setIsSlideOverOpen}
        />
      </div>

      <ShiftingTable hidePatient data={filteredShiftData} loading={loading} />
      <div>
        <Pagination totalCount={filteredShiftData?.length || 0} />
      </div>
    </section>
  );
};

export default ShiftingHistory;
