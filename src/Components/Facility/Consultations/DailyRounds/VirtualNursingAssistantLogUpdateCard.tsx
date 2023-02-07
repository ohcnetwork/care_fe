import RelativeTime from "../../../../CAREUI/display/RelativeTime";
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
  const diff: Partial<DailyRoundsModel> = getDeepDiff(
    extractVirtualNursingAssistantFields(props.round),
    extractVirtualNursingAssistantFields(props.previousRound)
  );

  const diffKeys = Object.keys(diff);

  return (
    <div className="p-4 flex flex-col gap-4 w-full rounded-lg bg-white shadow shadow-primary-500/20 border border-green-300">
      <div className="flex items-center justify-between">
        <div className="rounded-full bg-green-50 border flex gap-2 w-min items-center text-primary-400">
          <div className="px-1.5 py-0.5 rounded-full bg-green-100">
            <CareIcon className="care-l-robot text-lg" />
          </div>
          <span className="text-sm font-semibold tracking-wider whitespace-nowrap pr-3">
            Virtual Nursing Assistant
          </span>
        </div>
        <span className="flex gap-1 text-xs text-gray-700">
          Created <RelativeTime time={props.round.created_date} />
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {diffKeys.length > 0 ? (
          Object.keys(diff).map((key) => (
            <LogUpdateCardAttribute
              key={key}
              attributeKey={key as keyof DailyRoundsModel}
              attributeValue={diff[key as keyof DailyRoundsModel]}
            />
          ))
        ) : (
          <span className="text-sm italic text-gray-600">
            No changes since previous log update
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualNursingAssistantLogUpdateCard;
