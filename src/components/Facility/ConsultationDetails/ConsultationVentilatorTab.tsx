import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import { VentilatorPlot } from "@/components/Facility/Consultations/VentilatorPlot";
import VentilatorTable from "@/components/Facility/Consultations/VentilatorTable";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export const ConsultationVentilatorTab = (props: ConsultationTabProps) => {
  const { consultationId } = props;
  const { qParams, Pagination, resultsPerPage } = useFilters({ limit: 36 });

  const { loading: isLoading, data } = useQuery(routes.getDailyReports, {
    pathParams: { consultationId },
    query: {
      limit: resultsPerPage,
      offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <PageTitle
        title="Respiratory Support"
        hideBack={true}
        breadcrumbs={false}
      />
      <VentilatorTable dailyRoundsList={data?.results} />
      <VentilatorPlot dailyRoundsList={data?.results} />
      {Boolean(data?.count && data.count > 0) && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination totalCount={data?.count ?? 0} />
        </div>
      )}
    </div>
  );
};
