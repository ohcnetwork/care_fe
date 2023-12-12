import { DailyRoundsModel } from "../../Patient/models";
import RecordMeta from "../../../CAREUI/display/RecordMeta";
import { classNames } from "../../../Utils/utils";

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
  console.log(value);
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

export const Mews = ({ dailyRound }: { dailyRound: DailyRoundsModel }) => {
  const mewsCard = (isMissing: boolean, data: string[] | number) => {
    if (isMissing) {
      return (
        <>
          <div className="tooltip mt-2 text-gray-800">
            <p className="my-auto text-center text-2xl font-bold">N/A</p>
            <div className="tooltip-text tooltip-bottom w-48 -translate-x-1/2 translate-y-3 whitespace-pre-wrap text-xs font-medium lg:w-64">
              <span className="font-bold">{(data as string[]).join(", ")}</span>{" "}
              data is missing from the last log update.
            </div>
          </div>
          <div>
            <RecordMeta
              time={dailyRound.modified_date}
              prefix={"Updated"}
              className="mx-auto mt-2 w-10/12 text-xs font-medium leading-none text-gray-800"
              inlineClassName="flex flex-wrap items-center justify-center"
            />
            <div className="mt-1 flex h-2 w-full flex-col items-center justify-center rounded-b-lg bg-gray-500"></div>
          </div>
        </>
      );
    } else {
      const value = Number(data);
      return (
        <>
          <div className="tooltip mt-2">
            <p className="my-auto text-center text-2xl font-bold">{data}</p>
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
            </div>
          </div>
          <div>
            <RecordMeta
              time={dailyRound.modified_date}
              prefix={"Updated"}
              className="mx-auto mt-2 w-10/12 text-xs font-medium leading-none text-gray-800"
              inlineClassName="flex flex-wrap items-center justify-center"
            />
            <div
              className={classNames(
                "mt-1 flex h-2 w-full flex-col items-center justify-center rounded-b-lg",
                value <= 2 && "bg-primary-500",
                value <= 3 && "bg-yellow-300",
                value <= 5 && "bg-warning-600",
                value > 6 && "bg-danger-500"
              )}
            ></div>
          </div>
        </>
      );
    }
  };

  const scores = {
    "Respiratory rate": getRespScore(dailyRound.resp),
    "Heart rate": getHeartRateScore(dailyRound.pulse),
    "Systolic BP": getSystolicBPScore(dailyRound.bp?.systolic),
    Temperature: getTempRange(
      dailyRound.temperature ? parseFloat(dailyRound.temperature) : undefined
    ),
    "Level of Consciousness": getLOCRange(dailyRound.consciousness_level),
  };

  if (Object.values(scores).some((value) => value === undefined)) {
    return (
      <div className="flex h-fit flex-col justify-start rounded-lg border border-black">
        <p className="pt-1 text-center font-bold text-gray-900">MEWS Score</p>
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
    <div className="flex h-fit flex-col justify-start rounded-lg border border-black">
      <p className="pt-1 text-center font-bold text-gray-900">MEWS Score</p>
      {mewsCard(
        false,
        Object.values(scores as Record<string, number>).reduce((p, v) => p + v)
      )}
    </div>
  );
};
