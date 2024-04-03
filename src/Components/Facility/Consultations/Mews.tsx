import { formatDateTime } from "../../../Utils/utils";
import { MewsFieldModel } from "../../Patient/models";
// import { mewsFieldsModel } from "../../Patient/models";
const getRespScore = (value?: number) => {
  if (typeof value !== "number") return;

  if (value < 8) return 2;
  if (value <= 8) return 1;
  if (value <= 17) return 0;
  if (value <= 20) return 1;
  if (value <= 29) return 2;
  return 3;
};

const getHeartRateScore = (value?: number) => {
  if (typeof value !== "number") return;

  if (value < 40) return 2;
  if (value <= 50) return 1;
  if (value <= 100) return 0;
  if (value <= 110) return 1;
  if (value <= 129) return 2;
  return 3;
};

const getSystolicBPScore = (value?: number) => {
  if (typeof value !== "number") return;

  if (value <= 70) return 3;
  if (value <= 80) return 2;
  if (value <= 100) return 1;
  if (value <= 159) return 0;
  if (value <= 199) return 1;
  if (value <= 220) return 2;
  return 3;
};

const getTempRange = (value?: number) => {
  if (typeof value !== "number") return;

  if (value < 95) return 2;
  if (value <= 96.8) return 1;
  if (value <= 100.4) return 0;
  if (value <= 101.3) return 1;
  return 2;
};

const getLOCRange = (value: MewsFieldModel["consciousness_level"]) => {
  if (!value) return;

  return {
    UNRESPONSIVE: 3,
    RESPONDS_TO_PAIN: 2,
    RESPONDS_TO_VOICE: 1,
    ALERT: 0,
    AGITATED_OR_CONFUSED: 1,
    ONSET_OF_AGITATION_AND_CONFUSION: 2,
    UNKNOWN: undefined,
  }[value];
};

const getBorderColor = (score: number) => {
  if (score === undefined) return "border-gray-700";
  if (score <= 2) return "border-primary-500";
  if (score <= 3) return "border-yellow-300";
  if (score <= 5) return "border-warning-600";
  return "border-danger-500";
};

export const Mews = ({ mewsField }: { mewsField: MewsFieldModel }) => {
  const mewsCard = (isMissing: boolean, data: string[] | number) => {
    if (isMissing) {
      return (
        <>
          <div className="tooltip flex flex-col items-center">
            <div className="border-grey-400 flex h-7 w-7 items-center justify-center rounded-full border-2">
              <span className="text-sm font-semibold">-</span>
            </div>
            <span className="mt-1 text-xs font-medium text-gray-700">MEWS</span>
            <div className="tooltip-text tooltip-bottom w-48 -translate-x-1/2 translate-y-3 whitespace-pre-wrap text-xs font-medium lg:w-64">
              <span className="font-bold">{(data as string[]).join(", ")}</span>{" "}
              data is missing from the last log update.
              <br />{" "}
              {mewsField.modified_date
                ? `Last Updated: ${formatDateTime(mewsField.modified_date)}`
                : "No log is updated in last 30 min"}
            </div>
          </div>
          <div></div>
        </>
      );
    } else {
      return (
        <>
          <div className="tooltip flex flex-col items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${getBorderColor(
                Number(data)
              )}`}
            >
              <span className="text-sm font-semibold">{data}</span>
            </div>
            <span className="mt-1 text-xs font-medium text-gray-700">MEWS</span>
            <div className="tooltip-text tooltip-bottom w-48 -translate-x-1/2 translate-y-3 whitespace-pre-wrap text-xs font-medium lg:w-64">
              <p>
                Resp. Rate: <span className="font-bold">{mewsField.resp}</span>
              </p>
              <p>
                Heart Rate: <span className="font-bold">{mewsField.pulse}</span>
              </p>
              <p>
                Systolic BP:{" "}
                <span className="font-bold">{mewsField.bp?.systolic}</span>
              </p>
              <p>
                Temperature:{" "}
                <span className="font-bold">{mewsField.temperature}</span>
              </p>
              <p>
                Consciousness:{" "}
                <span className="font-bold capitalize">
                  {mewsField.consciousness_level
                    ?.replaceAll("_", " ")
                    .toLowerCase()}
                </span>
              </p>
              Last Updated: {formatDateTime(mewsField.modified_date)}
            </div>
          </div>
          <div></div>
        </>
      );
    }
  };

  const scores = {
    "Respiratory rate": getRespScore(mewsField.resp),
    "Heart rate": getHeartRateScore(mewsField.pulse),
    "Systolic BP": getSystolicBPScore(mewsField.bp?.systolic),
    Temperature: getTempRange(
      mewsField.temperature ? parseFloat(mewsField.temperature) : undefined
    ),
    "Level of Consciousness": getLOCRange(mewsField.consciousness_level),
  };

  if (Object.values(scores).some((value) => value === undefined)) {
    return (
      <div>
        {mewsCard(
          true,
          Object.entries(scores)
            .filter(([_, value]) => value === undefined)
            .map(([key]) => key)
        )}
      </div>
    );
  }

  return (
    <div>
      {mewsCard(
        false,
        Object.values(scores as Record<string, number>).reduce((p, v) => p + v)
      )}
    </div>
  );
};
