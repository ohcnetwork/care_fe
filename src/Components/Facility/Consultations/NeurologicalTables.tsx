import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import {
  PAGINATION_LIMIT,
  EYE_OPEN_SCALE,
  VERBAL_RESPONSE_SCALE,
  MOTOR_RESPONSE_SCALE,
} from "../../../Common/constants";
import { formatDateTime } from "../../../Utils/utils";

const DataTable = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="w-max-content mb-4 flex max-w-full flex-row divide-y divide-gray-200 overflow-hidden shadow sm:rounded-lg">
        <div className="flex flex-col justify-between">
          <div className="bg-gray-50 px-2 py-6 text-center text-xs font-medium uppercase leading-4 tracking-wider text-gray-700">
            Time
          </div>
          <div className="bg-gray-50 px-2 py-5 text-center text-xs font-medium uppercase leading-4 tracking-wider text-gray-700">
            Left
          </div>
          <div className="bg-gray-50 px-2 py-5 text-center text-xs font-medium uppercase leading-4 tracking-wider text-gray-700">
            Right
          </div>
        </div>
        <div
          style={{ direction: "rtl" }}
          className="flex flex-row overflow-x-auto"
        >
          {data.map((x: any, i: any) => {
            return (
              <div
                key={`${title}_${i}`}
                className="flex flex-col divide-x divide-gray-200"
              >
                <div className="w-20 bg-gray-50 px-2 py-3 text-center text-xs font-medium leading-4 text-gray-900">
                  {x.date}
                </div>
                <div className="whitespace-nowrap bg-white px-2 py-4 text-center text-sm leading-5 text-gray-900">
                  {x.left}
                </div>
                <div className="whitespace-nowrap bg-white px-2 py-4 text-center text-sm leading-5 text-gray-900">
                  {x.right}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DataDescription = (props: any) => {
  const { title, data } = props;
  console.log("Data Description", title, data);

  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="rounded-lg border bg-white p-4 shadow">
        {data.length ? (
          data.map((x: any, i: any) => (
            <div key={`${title}_${i}`} className="mb-2">
              <div className="text-sm font-bold text-gray-800">{`- ${x.date}`}</div>
              <div className="pl-2 text-gray-800">
                <span className="font-semibold">Left: </span>
                {x.left}
              </div>
              <div className="pl-2 text-gray-800">
                <span className="font-semibold">Right: </span>
                {x.right}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm font-semibold text-gray-700">
            No Data Available!
          </div>
        )}
      </div>
    </div>
  );
};

export const NeurologicalTable = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const LOC_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Alert" },
    { id: 10, value: "Drowsy" },
    { id: 15, value: "Stuporous" },
    { id: 20, value: "Comatose" },
    { id: 25, value: "Cannot Be Assessed" },
  ];

  const REACTION_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Brisk" },
    { id: 10, value: "Sluggish" },
    { id: 15, value: "Fixed" },
    { id: 20, value: "Cannot Be Assessed" },
  ];

  const LIMP_OPTIONS = [
    { id: 0, value: "Unknown" },
    { id: 5, value: "Strong" },
    { id: 10, value: "Moderate" },
    { id: 15, value: "Weak" },
    { id: 20, value: "Flexion" },
    { id: 25, value: "Extension" },
    { id: 30, value: "None" },
  ];

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
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
              "glasgow_eye_open",
              "glasgow_verbal_response",
              "glasgow_motor_response",
              "glasgow_total_calculated",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data && res.data.results) {
          setResults(res.data.results);
          setTotalCount(res.data.count);
        }
      }
    },
    [consultationId, dispatch, currentPage]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [currentPage]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  const locData: any = [];
  const locDescription: any = [];
  const sizeData: any = [];
  const sizeDescription: any = [];
  const reactionData: any = [];
  const reactionDescription: any = [];
  const upperLimbData: any = [];
  const lowerLimbData: any = [];
  const glasgowData: any = [];
  Object.entries(results).map((x: any) => {
    const value: any = x[1];
    if (x[1].consciousness_level) {
      locData.push({
        date: formatDateTime(x[0]),
        loc:
          LOC_OPTIONS.find((item) => item.id === x[1].consciousness_level)
            ?.value || "--",
      });
    }

    if (
      value.glasgow_eye_open ||
      value.glasgow_verbal_response ||
      value.glasgow_motor_response
    ) {
      glasgowData.push({
        date: formatDateTime(x[0]),
        eye: value.glasgow_eye_open || "-",
        verbal: value.glasgow_verbal_response || "-",
        motor: value.glasgow_motor_response || "-",
        total: value.glasgow_total_calculated || "-",
      });
    }

    if (x[1].consciousness_level_detail) {
      locDescription.push({
        date: formatDateTime(x[0]),
        loc: x[1].consciousness_level_detail,
      });
    }

    if (x[1].left_pupil_size || x[1].right_pupil_size) {
      sizeData.push({
        date: formatDateTime(x[0]),
        left: x[1].left_pupil_size || "-",
        right: x[1].right_pupil_size || "-",
      });
    }

    if (x[1].left_pupil_size_detail || x[1].right_pupil_size_detail) {
      sizeDescription.push({
        date: formatDateTime(x[0]),
        left: x[1].left_pupil_size_detail || "-",
        right: x[1].right_pupil_size_detail || "-",
      });
    }

    if (x[1].left_pupil_light_reaction || x[1].right_pupil_light_reaction) {
      reactionData.push({
        date: formatDateTime(x[0]),
        left:
          REACTION_OPTIONS.find(
            (item) => item.id === x[1].left_pupil_light_reaction
          )?.value || "--",
        right:
          REACTION_OPTIONS.find(
            (item) => item.id === x[1].right_pupil_light_reaction
          )?.value || "--",
      });
    }

    if (
      x[1].left_pupil_light_reaction_detail ||
      x[1].right_pupil_light_reaction_detail
    ) {
      reactionDescription.push({
        date: formatDateTime(x[0]),
        left: x[1].left_pupil_light_reaction_detail || "-",
        right: x[1].right_pupil_light_reaction_detail || "-",
      });
    }
    if (
      x[1].limb_response_upper_extremity_left ||
      x[1].limb_response_upper_extremity_right
    ) {
      upperLimbData.push({
        date: formatDateTime(x[0]),
        left:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_upper_extremity_left
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_upper_extremity_right
          )?.value || "--",
      });
    }

    if (
      x[1].limb_response_lower_extremity_left ||
      x[1].limb_response_lower_extremity_right
    ) {
      lowerLimbData.push({
        date: formatDateTime(x[0]),
        left:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_lower_extremity_left
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_lower_extremity_right
          )?.value || "--",
      });
    }
  });

  console.log("locDes", locDescription);

  return (
    <div className="mt-2">
      <div className="mb-6">
        <div className="text-xl font-semibold">Level Of Consciousness</div>
        <div className="w-max-content my-4 flex max-w-full flex-row divide-y divide-gray-200 overflow-hidden shadow sm:rounded-lg">
          <div
            style={{ direction: "rtl" }}
            className="flex flex-row overflow-x-auto"
          >
            {locData.map((x: any, i: any) => (
              <div
                key={`loc_${i}`}
                className="min-w-max-content flex  flex-col  divide-x divide-gray-200"
              >
                <div className="border-r bg-gray-50 px-2 py-3 text-center text-xs font-medium leading-4 text-gray-700">
                  {x.date}
                </div>
                <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-gray-700">
                  {x.loc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xl font-semibold">
            Level Of Consciousness Description
          </div>
          <div className="rounded-lg border bg-white p-4 shadow">
            {locDescription.length ? (
              locDescription.map((x: any, i: any) => (
                <div key={`loc_desc_${i}`} className="mb-2">
                  <div className="text-sm font-semibold">{`- ${x.date}`}</div>
                  <div className="pl-2 text-gray-800">{x.loc}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm font-semibold text-gray-800">
                No Data Available!
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-6">
        <DataTable title={"Pupil Size"} data={sizeData} />
        <DataDescription
          title={"Pupil Size Description"}
          data={sizeDescription}
        />
      </div>
      <div className="mb-6">
        <DataTable title={"Pupil Reaction"} data={reactionData} />
        <DataDescription
          title={"Pupil Reaction Description"}
          data={reactionDescription}
        />
      </div>
      <div className="mb-6">
        <DataTable title={"Upper Extremity"} data={upperLimbData} />
        <DataTable title={"Lower Extremity"} data={lowerLimbData} />
      </div>

      <div className="mt-4">
        <div className="text-xl font-semibold">Glasgow Coma Scale</div>
        <div className="mb-6 mt-2">
          <div className="w-max-content mb-4 flex max-w-full flex-row divide-y divide-gray-200 overflow-hidden shadow sm:rounded-lg">
            <div className="flex flex-col ">
              <div className="bg-gray-50 px-2 py-7 text-center text-sm font-medium uppercase leading-4 tracking-wider text-gray-700">
                Time
              </div>
              <div className="bg-gray-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-gray-700">
                Eye
              </div>
              <div className="bg-gray-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-gray-700">
                Verbal
              </div>
              <div className="bg-gray-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-gray-700">
                Motor
              </div>
              <div className="bg-gray-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-gray-700">
                Total
              </div>
            </div>
            <div
              style={{ direction: "rtl" }}
              className="flex flex-row overflow-x-auto"
            >
              {glasgowData.map((x: any, i: any) => {
                return (
                  <div
                    key={`glascow_${i}`}
                    className="flex flex-col divide-x divide-gray-200"
                  >
                    <div className="w-20 bg-gray-50 px-2 py-3 text-center text-xs font-medium leading-4 text-gray-800">
                      {x.date}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-gray-800">
                      {x.eye}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-gray-800">
                      {x.verbal}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-gray-800">
                      {x.motor}
                    </div>
                    <div className="whitespace-nowrap border-t-2 border-gray-500 bg-white px-6 py-4 text-center text-sm font-semibold leading-5 text-gray-800">
                      {x.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="my-2 text-xl font-semibold">Scale Description</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-white px-4 py-2 shadow">
              <div className="mb-2 text-xl font-semibold">Eye Open</div>
              <div>
                {EYE_OPEN_SCALE.map((x: any) => (
                  <div
                    key={`eye_${x.value}`}
                    className="pl-2 leading-relaxed text-gray-800"
                  >
                    <span className="text-sm font-semibold">{x.value}</span> -{" "}
                    {x.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-white px-4 py-2 shadow">
              <div className="mb-2 text-xl font-semibold">Verbal Response</div>
              <div>
                {VERBAL_RESPONSE_SCALE.map((x: any) => (
                  <div
                    key={`verbal_${x.value}`}
                    className="pl-2 leading-relaxed text-gray-800"
                  >
                    <span className="text-sm font-semibold">{x.value}</span> -{" "}
                    {x.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-white px-4 py-2 shadow">
              <div className="mb-2 text-xl font-semibold">Motor Response</div>
              <div>
                {MOTOR_RESPONSE_SCALE.map((x: any) => (
                  <div
                    key={`motor_${x.value}`}
                    className="pl-2 leading-relaxed text-gray-800"
                  >
                    <span className="text-sm font-semibold">{x.value}</span> -{" "}
                    {x.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {totalCount > PAGINATION_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={PAGINATION_LIMIT}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
