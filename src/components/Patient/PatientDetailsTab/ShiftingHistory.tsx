import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ShiftingTable from "@/components/Shifting/ShiftingTable";

import useFilters from "@/hooks/useFilters";

import { NonReadOnlyUsers } from "@/Utils/AuthorizeFor";
import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

import { PatientProps } from ".";
import { PatientModel } from "../models";

const ShiftingHistory = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;
  const { t } = useTranslation();
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

  return (
    <section className="mt-4">
      <div className="flex justify-between items-center">
        <h2 className="my-4 ml-0 text-2xl font-semibold leading-tight">
          {t("shifting_history")}
        </h2>
        <ButtonV2
          className=""
          disabled={isPatientInactive(patientData, facilityId)}
          size="default"
          onClick={() =>
            navigate(`/facility/${facilityId}/patient/${id}/shift/new`)
          }
          authorizeFor={NonReadOnlyUsers}
        >
          <span className="flex w-full items-center justify-start gap-2">
            <CareIcon icon="l-ambulance" className="text-xl" />
            {t("shift")}
          </span>
        </ButtonV2>
      </div>
      <ShiftingTable hidePatient data={shiftData?.results} loading={loading} />
      <div>
        <Pagination totalCount={shiftData?.count || 0} />
      </div>{" "}
    </section>
  );
};

export default ShiftingHistory;
