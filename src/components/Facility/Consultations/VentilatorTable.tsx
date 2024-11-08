import { useTranslation } from "react-i18next";

import { compareByDateString, formatDateTime } from "@/Utils/utils";

import { DailyRoundsModel } from "../../Patient/models";

type VentilatorTableProps = {
  dailyRoundsList?: DailyRoundsModel[];
};

export default function VentilatorTable(props: VentilatorTableProps) {
  const { t } = useTranslation();
  const { dailyRoundsList } = props;

  const VentilatorTableRow = ({
    dailyRound,
    start_date,
    end_date,
  }: {
    dailyRound: DailyRoundsModel;
    start_date: string;
    end_date: string;
  }) => {
    const getModeText = () => {
      const {
        ventilator_interface,
        ventilator_mode,
        ventilator_oxygen_modality,
      } = dailyRound;
      switch (ventilator_interface) {
        case "INVASIVE":
        case "NON_INVASIVE":
          return t(`VENTILATOR_MODE__${ventilator_mode}`);
        case "OXYGEN_SUPPORT":
          return t(`OXYGEN_MODALITY__${ventilator_oxygen_modality}`);
        default:
          return null;
      }
    };
    return (
      <tr className="text-center text-sm">
        <td className="max-w-52 px-2 py-2">{start_date}</td>
        <td className="max-w-52 px-2 py-2">{end_date}</td>
        <td className="max-w-52 px-2 py-2">
          {t(`RESPIRATORY_SUPPORT__${dailyRound?.ventilator_interface}`)}
        </td>
        <td className="max-w-52 px-2 py-2">{getModeText()}</td>
      </tr>
    );
  };

  const getModeOrModality = (round: DailyRoundsModel) => {
    const ventilatorInterface = round.ventilator_interface;
    if (!ventilatorInterface) return null;
    switch (ventilatorInterface) {
      case "INVASIVE":
      case "NON_INVASIVE":
        return round.ventilator_mode;
      case "OXYGEN_SUPPORT":
        return round.ventilator_oxygen_modality;
      default:
        return null;
    }
  };

  const VentilatorTableBody = (dailyRoundsList: DailyRoundsModel[]) => {
    const rows = [];
    for (let index = 0; index < dailyRoundsList.length; index++) {
      const currentRound = dailyRoundsList[index];
      const currentInterfaceOrModality = getModeOrModality(currentRound);
      if (!currentInterfaceOrModality) continue;
      while (index < dailyRoundsList.length - 1) {
        const nextRound = dailyRoundsList[index + 1];
        const nextInterfaceOrModality = getModeOrModality(nextRound);
        if (
          nextInterfaceOrModality &&
          currentRound.ventilator_interface == nextRound.ventilator_interface &&
          currentInterfaceOrModality == nextInterfaceOrModality
        ) {
          index += 1;
        } else {
          break;
        }
      }
      const end_date =
        index + 1 < dailyRoundsList.length
          ? formatDateTime(dailyRoundsList[index + 1].taken_at)
          : "";
      const start_date = formatDateTime(currentRound.taken_at);
      rows.push(
        <VentilatorTableRow
          key={`${currentRound.id}`}
          dailyRound={currentRound}
          start_date={start_date}
          end_date={end_date}
        />,
      );
    }
    return rows;
  };

  if (!dailyRoundsList?.length) {
    return;
  }
  const sortedData: DailyRoundsModel[] = dailyRoundsList.sort(
    compareByDateString("taken_at"),
  );

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
        <tbody>{VentilatorTableBody(sortedData)}</tbody>
      </table>
    </div>
  );
}
