import { useTranslation } from "react-i18next";

import LogUpdateCardAttribute from "@/components/Facility/Consultations/DailyRounds/LogUpdateCardAttribute";
import { DailyRoundsModel } from "@/components/Patient/models";

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
  const { temperature, bp, resp, spo2, ventilator_spo2, pulse } = round;

  return {
    temperature,
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
      extractVirtualNursingAssistantFields(props.previousRound),
    );

  const diffKeys = Object.keys(diff);

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-green-300 bg-white p-4 shadow-primary-500/20">
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
          <span className="text-sm italic text-secondary-600">
            {t("no_log_update_delta")}
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualNursingAssistantLogUpdateCard;
