import { formatDateTime } from "@/Utils/utils";
import { DailyRoundsModel } from "../../Patient/models";
import { useTranslation } from "react-i18next";

type VentilatorTableProps = {
  dailyRoundsList?: DailyRoundsModel[];
};
interface VentilatorDailyRounds extends DailyRoundsModel {
  start_date?: string;
  end_date?: string;
}

export default function VentilatorTable(props: VentilatorTableProps) {
  const { t } = useTranslation();
  const { dailyRoundsList } = props;
  let filteredData: VentilatorDailyRounds[] = [];

  const filterAndSortData = (data: DailyRoundsModel[]) => {
    return data
      .sort(function (a, b) {
        const ad = new Date(a.taken_at ?? Date.now());
        const bd = new Date(b.taken_at ?? Date.now());
        return ad > bd ? 1 : -1;
      })
      .map((item, ind) => {
        const newItem: VentilatorDailyRounds = item;
        newItem.start_date = formatDateTime(
          item.taken_at,
          "hh:mm A; DD/MM/YYYY",
        );
        let endDate = "";
        if (ind + 1 < data.length) {
          endDate = data[ind + 1].taken_at ?? endDate;
        }
        newItem.end_date = endDate !== "" ? formatDateTime(endDate) : "";
        return item;
      })
      .filter(
        (round) =>
          round.ventilator_interface !== null &&
          round.ventilator_interface !== "UNKNOWN",
      );
  };

  const VentilatorTableRow = ({
    dailyRound,
  }: {
    dailyRound: VentilatorDailyRounds;
  }) => {
    return (
      <tr className="text-center text-sm">
        <td className="max-w-52 px-2 py-2">{dailyRound.start_date}</td>
        <td className="max-w-52 px-2 py-2">{dailyRound.end_date}</td>
        <td className="max-w-52 px-2 py-2">
          {t(`RESPIRATORY_SUPPORT__${dailyRound?.ventilator_interface}`)}
        </td>
        <td className="max-w-52 px-2 py-2">
          {dailyRound?.ventilator_interface == "INVASIVE" ||
          dailyRound?.ventilator_interface == "NON_INVASIVE"
            ? t(`VENTILATOR_MODE__${dailyRound?.ventilator_mode}`)
            : dailyRound?.ventilator_interface == "OXYGEN_SUPPORT"
              ? t(`OXYGEN_MODALITY__${dailyRound?.ventilator_oxygen_modality}`)
              : null}
        </td>
      </tr>
    );
  };

  const getModeOrModality = (round: DailyRoundsModel) => {
    const ventilatorInterface = round.ventilator_interface;
    const modeOrModality =
      ventilatorInterface == "INVASIVE" || ventilatorInterface == "NON_INVASIVE"
        ? round.ventilator_mode
        : ventilatorInterface == "OXYGEN_SUPPORT"
          ? round.ventilator_oxygen_modality
          : null;
    return modeOrModality;
  };

  const VentilatorTableBody = (dailyRoundsList: DailyRoundsModel[]) => {
    const rows = [];
    for (let index = 0; index < dailyRoundsList.length; index++) {
      const currentRound = dailyRoundsList[index];
      const currentInterfaceOrModality = getModeOrModality(currentRound);
      while (index < dailyRoundsList.length - 1) {
        const nextRound = dailyRoundsList[index + 1];
        const nextInterfaceOrModality = getModeOrModality(nextRound);
        if (
          currentRound.ventilator_interface == nextRound.ventilator_interface &&
          currentInterfaceOrModality == nextInterfaceOrModality
        ) {
          index += 1;
        } else {
          break;
        }
      }

      rows.push(<VentilatorTableRow dailyRound={currentRound} />);
    }
    return rows;
  };

  if (!dailyRoundsList || dailyRoundsList.length == 0) {
    return;
  } else {
    filteredData = filterAndSortData(dailyRoundsList);
  }

  return (
    <div className="my-3 w-full overflow-x-scroll rounded-lg border bg-white px-4 pt-3 shadow">
      <table className="w-full">
        <caption className="mb-2 caption-top text-lg font-bold">
          {t("ventilator_log")}
        </caption>
        <thead className="border-b-2 border-secondary-400 bg-secondary-50">
          <tr className="max-w-52 px-2 py-2 text-start text-sm">
            <th className="max-w-52 p-1">{t("start_datetime")}</th>
            <th className="p-1">{t("end_datetime")}</th>
            <th className="p-1">{t("ventilator_modality")}</th>
            <th className="max-w-32 p-1">
              {`${t("ventilator_mode")} / ${t("ventilator_oxygen_modality")}`}
            </th>
          </tr>
        </thead>
        <tbody>{VentilatorTableBody(filteredData)}</tbody>
      </table>
    </div>
  );
}
