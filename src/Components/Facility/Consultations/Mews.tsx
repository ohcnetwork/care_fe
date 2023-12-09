import { DailyRoundsModel } from "../../Patient/models";
import RecordMeta from "../../../CAREUI/display/RecordMeta";

const respRange = [
  [-Infinity, 7, 2],
  [8, 8, 1],
  [9, 17, 0],
  [18, 20, 1],
  [21, 29, 2],
  [30, Infinity, 3],
];

const heartRateRange = [
  [-Infinity, 39, 2],
  [40, 50, 1],
  [51, 100, 0],
  [101, 110, 1],
  [111, 129, 2],
  [130, Infinity, 3],
];

const systolicBloodPressureRange = [
  [-Infinity, 70, 3],
  [71, 80, 2],
  [81, 100, 1],
  [101, 159, 0],
  [160, 199, 1],
  [200, 220, 2],
  [221, Infinity, 3],
];

const temperatureRange = [
  [-Infinity, 94.9, 2],
  [95, 96.8, 1],
  [96.9, 100.4, 0],
  [100.5, 101.3, 1],
  [101.4, Infinity, 2],
];

const consciousnessCalculator = (value: string | undefined) => {
  switch (value) {
    case "ALERT":
      return 0;
    case "RESPONDS_TO_VOICE":
    case "AGITATED_OR_CONFUSED":
      return 1;
    case "RESPONDS_TO_PAIN":
    case "ONSET_OF_AGITATION_AND_CONFUSION":
      return 2;
    case "UNRESPONSIVE":
      return 3;
    default:
      return undefined;
  }
};

const mewsColorRange = [
  [0, 2, "bg-primary-500"],
  [3, 3, "bg-yellow-300"],
  [4, 5, "bg-warning-500"],
  [6, Infinity, "bg-danger-500"],
];

const getIndividualScore = (value: number | undefined, ranges: any[][]) => {
  if (value === undefined || value === null) return undefined;
  for (const [min, max, score] of ranges) {
    if (value >= min && value <= max) {
      return score;
    }
  }
};

export const Mews = (props: { lastDailyRound: DailyRoundsModel }) => {
  const mewsCard = (isMissing: boolean, data: string[] | number) => {
    if (isMissing) {
      return (
        <>
          <div className="tooltip mt-2 text-gray-800">
            <p className="my-auto text-center text-2xl font-bold">N/A</p>
            <div className="tooltip-text tooltip-left translate-x-1/2 translate-y-1/4 text-xs font-medium">
              <p>Missing : </p>
              <div className="flex flex-col items-center justify-center">
                {typeof data !== "number" &&
                  data.map((x, id) => <span key={id}>{x}</span>)}
              </div>
            </div>
          </div>
          <div>
            <RecordMeta
              time={props.lastDailyRound.modified_date}
              prefix={"Updated"}
              className="mx-auto mt-2 w-10/12 text-xs font-medium text-gray-800"
              inlineClassName="flex flex-wrap items-center justify-center"
            />
            <div className="mt-1 flex h-2 w-full flex-col items-center justify-center rounded-b-lg bg-gray-500"></div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="tooltip mt-2">
            <p className="my-auto text-center text-2xl font-bold">{data}</p>
            <div className="tooltip-text tooltip-left translate-x-1/2 translate-y-1/4 text-xs font-medium">
              <p>Resp Rate : {props.lastDailyRound.resp}</p>
              <p>Pulse : {props.lastDailyRound.pulse}</p>
              <p>Sys BP : {props.lastDailyRound.bp?.systolic}</p>
              <p>Temp : {props.lastDailyRound.temperature}</p>
              <p>Conscious : </p>
              <p>
                {props.lastDailyRound.consciousness_level
                  ?.split("_")
                  .map((x) => x[0] + x.slice(1).toLowerCase())
                  .join(" ")}
              </p>
            </div>
          </div>
          <div>
            <RecordMeta
              time={props.lastDailyRound.modified_date}
              prefix={"Updated"}
              className="mx-auto mt-2 w-10/12 text-xs font-medium text-gray-800"
              inlineClassName="flex flex-wrap items-center justify-center"
            />
            <div
              className={`mt-1 flex h-2 w-full flex-col items-center justify-center rounded-b-lg ${getIndividualScore(
                Number(data),
                mewsColorRange
              )}`}
            ></div>
          </div>
        </>
      );
    }
  };

  const mewsScore = () => {
    const lastDailyRound = props.lastDailyRound;

    const score = {
      resp: getIndividualScore(lastDailyRound?.resp, respRange),
      heartRate: getIndividualScore(lastDailyRound?.pulse, heartRateRange),
      systolicBloodPressure: getIndividualScore(
        lastDailyRound?.bp?.systolic,
        systolicBloodPressureRange
      ),
      temperature: getIndividualScore(
        Number(lastDailyRound?.temperature),
        temperatureRange
      ),
      consciousnessLevel: consciousnessCalculator(
        lastDailyRound?.consciousness_level
      ),
    };

    if (
      score.resp === undefined ||
      score.heartRate === undefined ||
      score.systolicBloodPressure === undefined ||
      score.temperature === undefined ||
      score.consciousnessLevel === undefined
    ) {
      return mewsCard(
        true,
        [
          score.resp === undefined ? "Respiratory rate" : "",
          score.heartRate === undefined ? "Heart rate" : "",
          score.systolicBloodPressure === undefined ? "Systolic BP" : "",
          score.temperature === undefined ? "Temperature" : "",
          score.consciousnessLevel === undefined ? "Consciousness" : "",
        ].filter((x) => x !== "")
      );
    }

    const totalScore =
      score.resp +
      score.heartRate +
      score.systolicBloodPressure +
      score.temperature +
      score.consciousnessLevel;

    return mewsCard(false, totalScore);
  };

  return (
    <div className="flex h-fit flex-col justify-start rounded-lg border border-black">
      <p className="pt-1 text-center font-bold text-gray-900">Mews Score</p>
      {mewsScore()}
    </div>
  );
};
