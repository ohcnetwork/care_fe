import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { PatientProps } from "@/components/Patient/PatientDetailsTab";
import { formatFilter } from "@/components/Resource/ResourceCommons";
import ShiftingTable from "@/components/Shifting/ShiftingTable";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

const ShiftingHistory = (props: PatientProps) => {
  const { facilityId, id } = props;
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    cacheBlacklist: ["patient_name"],
  });

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
        <Button
          className=""
          size="default"
          onClick={() =>
            navigate(`/facility/${facilityId}/patient/${id}/shift/new`)
          }
        >
          <span className="flex w-full items-center justify-start gap-2">
            <CareIcon icon="l-ambulance" className="text-xl" />
            {t("shift")}
          </span>
        </Button>
      </div>
      <ShiftingTable hidePatient data={shiftData?.results} loading={loading} />
      <div>
        <Pagination totalCount={shiftData?.count || 0} />
      </div>{" "}
    </section>
  );
};

export default ShiftingHistory;
