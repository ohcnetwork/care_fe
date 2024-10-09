import { useState } from "react";
import { ConsultationTabProps } from "./index";
import { VentilatorPlot } from "../Consultations/VentilatorPlot";
import VentilatorTable from "../Consultations/VentilatorTable";
import { DailyRoundsModel } from "../../Patient/models";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import { formatDateTime } from "../../../Utils/utils";

import PageTitle from "@/Components/Common/PageTitle";
import Loading from "@/Components/Common/Loading";

export const ConsultationVentilatorTab = (props: ConsultationTabProps) => {
  const { consultationId } = props;
  const [dailyRoundsList, setDailyRoundsList] = useState<DailyRoundsModel[]>();

  const filterAndSortData = (data: DailyRoundsModel[]) => {
    return data
      .filter(
        (round) =>
          round.ventilator_interface !== null &&
          round.ventilator_interface !== "UNKNOWN",
      )
      .map((item) => {
        item.taken_at = formatDateTime(item.taken_at, "hh:mm A; DD/MM/YYYY");
        return item;
      })
      .sort(function (a, b) {
        const ad = new Date(a.taken_at ?? Date.now());
        const bd = new Date(b.taken_at ?? Date.now());
        return ad > bd ? -1 : 1;
      });
  };

  const { loading: isLoading } = useQuery(routes.getDailyReports, {
    pathParams: { consultationId },
    onResponse: ({ data }) => {
      if (data) {
        const filtered = filterAndSortData(data.results);
        setDailyRoundsList(filtered);
      }
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
      <VentilatorTable dailyRoundsList={dailyRoundsList} />
      <VentilatorPlot
        consultationId={props.consultationId}
        dailyRoundsList={dailyRoundsList}
      />
    </div>
  );
};
