import { result } from "lodash";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

const DataTable = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 my-4">
        <div className="flex flex-col justify-between w-1/4">
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Time
          </div>
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Left
          </div>
          <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
            Right
          </div>
        </div>
        <div
          style={{ direction: "rtl" }}
          className="flex flex-row overflow-x-auto"
        >
          {data.map((x: any) => {
            if (x.date || x.left) {
              return (
                <div className="flex flex-col w-1/6 min-w-max-content divide-x divide-cool-gray-200">
                  <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                    {x.date}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                    {x.left}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                    {x.right}
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

const DataDescription = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="p-4 bg-white border rounded-lg shadow">
        {data.map((x: any) => {
          if (x.left_description || x.right_description) {
            <div>
              <div className="text-sm font-semibold">{`- ${x.date}`}</div>
              <div className="text-cool-gray-800 pl-2">{`Left: ${x.left_description}`}</div>
              <div className="text-cool-gray-800 pl-2">{`Left: ${x.left_description}`}</div>
            </div>;
          }
        })}
      </div>
    </div>
  );
};

export const NeurologicalTable = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});

  const REACTION_OPTIONS = [
    { id: 0, label: "U", value: "Unknown" },
    { id: 5, label: "B", value: "Brisk" },
    { id: 10, label: "S", value: "Sluggish" },
    { id: 15, label: "F", value: "Fixed" },
    { id: 20, label: "C", value: "Cannot Be Assessed" },
  ];

  const LIMP_OPTIONS = [
    { id: 0, label: "U", value: "Unknown" },
    { id: 5, label: "S", value: "Strong" },
    { id: 10, label: "M", value: "Moderate" },
    { id: 15, label: "W", value: "Weak" },
    { id: 20, label: "F", value: "Flexion" },
    { id: 25, label: "E", value: "Extension" },
    { id: 30, label: "N", value: "None" },
  ];

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: [
              "consciousness_level",
              "consciousness_level_detail",
              "left_pupil_size",
              "left_pupil_size_detail",
              "right_pupil_size",
              "right_pupil_size_detail",
              "left_pupil_light_reaction",
              "left_pupil_light_reaction_detail",
              "right_pupil_light_reaction",
              "right_pupil_light_reaction_detail",
              "limb_response_upper_extremity_right",
              "limb_response_upper_extremity_left",
              "limb_response_lower_extremity_left",
              "limb_response_lower_extremity_right",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect((status: statusType) => {
    fetchDailyRounds(status);
  }, []);
  console.log(results);

  const locData: any = [];
  const sizeData: any = [];
  const reactionData: any = [];
  const upperLimbData: any = [];
  const lowerLimbData: any = [];
  Object.entries(results).map((x: any) => {
    locData.push({
      date: moment(x[0]).format("LLL"),
      loc: x[1].consciousness_level,
    });

    sizeData.push({
      date: moment(x[0]).format("LLL"),
      left: x[1].left_pupil_size || "--",
      right: x[1].right_pupil_size || "--",
      left_description: x[1].left_pupil_size_detail,
      right_description: x[1].right_pupil_size_detail,
    });
    reactionData.push({
      date: moment(x[0]).format("LLL"),
      left:
        REACTION_OPTIONS.find(
          (item) => item.id === x[1].left_pupil_light_reaction
        )?.value || "--",
      right:
        REACTION_OPTIONS.find(
          (item) => item.id === x[1].right_pupil_light_reaction
        )?.value || "--",
      left_description: x[1].left_pupil_light_reaction_detail,
      right_description: x[1].right_pupil_light_reaction_detail,
    });
    upperLimbData.push({
      date: moment(x[0]).format("LLL"),
      left:
        LIMP_OPTIONS.find(
          (item) => item.id === x[1].limb_response_upper_extremity_left
        )?.value || "--",
      right:
        LIMP_OPTIONS.find(
          (item) => item.id === x[1].limb_response_upper_extremity_right
        )?.value || "--",
    });
    lowerLimbData.push({
      date: moment(x[0]).format("LLL"),
      left:
        LIMP_OPTIONS.find(
          (item) => item.id === x[1].limb_response_lower_extremity_left
        )?.value || "--",
      right:
        LIMP_OPTIONS.find(
          (item) => item.id === x[1].limb_response_lower_extremity_right
        )?.value || "--",
    });
  });

  return (
    <div className="mt-4">
      <div>
        <div className="text-xl font-semibold">Level Of Consciousness</div>
        <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 my-4">
          <div
            style={{ direction: "rtl" }}
            className="flex flex-row overflow-x-auto"
          >
            {locData.map((x: any) => (
              <div className="flex flex-col  w-1/6 min-w-max-content  divide-x divide-cool-gray-200">
                <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                  {x.date}
                </div>
                <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                  {x.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DataTable title={"Pupil Size"} data={sizeData} />
      <DataDescription title={"Pupil Size Description"} data={sizeData} />
      <DataTable title={"Pupil Reaction"} data={reactionData} />
      <DataDescription
        title={"Pupil Reaction Description"}
        data={reactionData}
      />
      <DataTable title={"Upper Extremity"} data={upperLimbData} />
      <DataTable title={"Lower Extremity"} data={lowerLimbData} />
    </div>
  );
};
