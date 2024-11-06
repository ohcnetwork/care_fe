import { DailyRoundsModel } from "@/components/Patient/models";

import { formatDateTime, humanizeStrings } from "@/Utils/utils";

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

const getSystolicBPScore = (value?: number | null) => {
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

const getLOCRange = (value?: DailyRoundsModel["consciousness_level"]) => {
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
  if (score === undefined) return "border-secondary-700";
  if (score <= 2) return "border-primary-500";
  if (score <= 3) return "border-yellow-300";
  if (score <= 5) return "border-warning-600";
  return "border-danger-500";
};

export const Mews = ({ dailyRound }: { dailyRound: DailyRoundsModel }) => {
  const mewsCard = (isMissing: boolean, data: string[] | number) => {
    if (isMissing) {
      return (
        <>
          <div className="tooltip flex flex-col items-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2">
              <span className="text-sm font-semibold">-</span>
            </div>
            <span className="mt-1 text-xs font-medium text-secondary-700">
              MEWS
            </span>
            <div className="tooltip-text tooltip-bottom w-48 -translate-x-1/2 translate-y-3 whitespace-pre-wrap text-xs font-medium lg:w-64">
              <span className="font-bold">
                {humanizeStrings(data as string[])}
              </span>{" "}
              data is missing from the last log update.
              <br /> Last Updated: {formatDateTime(dailyRound.modified_date)}
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
                Number(data),
              )}`}
            >
              <span className="text-sm font-semibold">{data}</span>
            </div>
            <span className="mt-1 text-xs font-medium text-secondary-700">
              MEWS
            </span>
            <div className="tooltip-text tooltip-bottom w-48 -translate-x-1/2 translate-y-3 whitespace-pre-wrap text-xs font-medium lg:w-64">
              <p>
                Resp. Rate: <span className="font-bold">{dailyRound.resp}</span>
              </p>
              <p>
                Heart Rate:{" "}
                <span className="font-bold">{dailyRound.pulse}</span>
              </p>
              <p>
                Systolic BP:{" "}
                <span className="font-bold">{dailyRound.bp?.systolic}</span>
              </p>
              <p>
                Temperature:{" "}
                <span className="font-bold">{dailyRound.temperature}</span>
              </p>
              <p>
                Consciousness:{" "}
                <span className="font-bold capitalize">
                  {dailyRound.consciousness_level
                    ?.replaceAll("_", " ")
                    .toLowerCase()}
                </span>
              </p>
              Last Updated: {formatDateTime(dailyRound.modified_date)}
            </div>
          </div>
          <div></div>
        </>
      );
    }
  };

  const scores = {
    "Respiratory rate": getRespScore(dailyRound.resp),
    "Heart rate": getHeartRateScore(dailyRound.pulse),
    "Systolic BP": getSystolicBPScore(dailyRound.bp?.systolic),
    Temperature: getTempRange(
      dailyRound.temperature
        ? parseFloat(`${dailyRound.temperature}`)
        : undefined,
    ),
    "Level of Consciousness": getLOCRange(dailyRound.consciousness_level),
  };

  if (Object.values(scores).some((value) => value === undefined)) {
    return (
      <div>
        {mewsCard(
          true,
          Object.entries(scores)
            .filter(([_, value]) => value === undefined)
            .map(([key]) => key),
        )}
      </div>
    );
  }

  return (
    <div>
      {mewsCard(
        false,
        Object.values(scores as Record<string, number>).reduce((p, v) => p + v),
      )}
    </div>
  );
};
