import { useTranslation } from "react-i18next";
import RecordMeta from "../../../../CAREUI/display/RecordMeta";
import CareIcon from "../../../../CAREUI/icons/CareIcon";
import { DailyRoundsModel } from "../../../Patient/models";
import LogUpdateCardAttribute from "./LogUpdateCardAttribute";

// TODO: remove this method once events module is ready
const getDeepDiff = <T extends object>(a: any, b?: any): Partial<T> => {
  if (!b) {
    return a;
  }

  const diff: any = {};

  Object.keys(a).forEach((key) => {
    if (a[key] !== b[key]) {
      if (typeof a[key] === "object" && typeof b[key] === "object") {
        const deepDiff = getDeepDiff(a[key], b[key]);
        if (Object.keys(deepDiff).length > 0) {
          diff[key] = deepDiff;
        }
      } else {
        diff[key] = a[key];
      }
    }
  });

  return diff;
};

interface Props {
  round: DailyRoundsModel;
  previousRound?: DailyRoundsModel;
}

const extractVirtualNursingAssistantFields = (round?: DailyRoundsModel) => {
  if (!round) return;
  const {
    temperature,
    temperature_measured_at,
    bp,
    resp,
    spo2,
    ventilator_spo2,
    pulse,
  } = round;

  return {
    temperature,
    temperature_measured_at,
    bp,
    resp,
    spo2,
    ventilator_spo2,
    pulse,
  };
};

const VirtualNursingAssistantLogUpdateCard = (props: Props) => {
  const { t } = useTranslation();
  const diff: Partial<ReturnType<typeof extractVirtualNursingAssistantFields>> =
    getDeepDiff(
      extractVirtualNursingAssistantFields(props.round),
      extractVirtualNursingAssistantFields(props.previousRound)
    );

  const diffKeys = Object.keys(diff);

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-green-300 bg-white p-4 shadow shadow-primary-500/20">
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-min items-center gap-2 rounded-full border bg-green-50 text-primary-400">
          <div className="rounded-full bg-green-100 px-1.5 py-0.5">
            <CareIcon className="care-l-robot text-lg" />
          </div>
          <span className="whitespace-nowrap pr-3 text-sm font-semibold tracking-wider">
            {t("virtual_nursing_assistant")}
          </span>
        </div>
        <span className="flex gap-1 text-xs text-gray-700">
          {t("created")} <RecordMeta time={props.round.created_date} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {diffKeys.length > 0 ? (
          Object.keys(diff).map((key) => (
            <LogUpdateCardAttribute
              key={key}
              attributeKey={key as keyof DailyRoundsModel}
              attributeValue={(diff as any)[key]}
            />
          ))
        ) : (
          <span className="text-sm italic text-gray-600">
            {t("no_log_update_delta")}
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualNursingAssistantLogUpdateCard;
