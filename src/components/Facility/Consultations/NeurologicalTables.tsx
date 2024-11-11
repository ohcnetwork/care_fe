import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Pagination from "@/components/Common/Pagination";
import { NeurologicalTablesFields } from "@/components/Facility/models";

import {
  CONSCIOUSNESS_LEVEL,
  EYE_OPEN_SCALE,
  LIMB_RESPONSE_OPTIONS,
  MOTOR_RESPONSE_SCALE,
  PAGINATION_LIMIT,
  PUPIL_REACTION_OPTIONS,
  VERBAL_RESPONSE_SCALE,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

const DataTable = (props: any) => {
  const { title, data } = props;
  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="w-max-content mb-4 flex max-w-full flex-row divide-y divide-secondary-200 overflow-hidden shadow sm:rounded-lg">
        <div className="flex flex-col justify-between">
          <div className="bg-secondary-50 px-2 py-6 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-700">
            Time
          </div>
          <div className="bg-secondary-50 px-2 py-5 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-700">
            Left
          </div>
          <div className="bg-secondary-50 px-2 py-5 text-center text-xs font-medium uppercase leading-4 tracking-wider text-secondary-700">
            Right
          </div>
        </div>
        <div className="flex flex-row overflow-x-auto">
          {data.map((x: any, i: any) => {
            return (
              <div
                key={`${title}_${i}`}
                className="flex flex-col justify-between divide-x divide-secondary-200"
              >
                <div className="w-20 bg-secondary-50 px-2 py-4 text-center text-xs font-medium leading-4 text-secondary-900">
                  {x.date}
                </div>
                <div className="whitespace-nowrap bg-white px-2 py-5 text-center text-xs leading-4 text-secondary-900">
                  {x.left}
                </div>
                <div className="whitespace-nowrap bg-white px-2 py-5 text-center text-xs leading-4 text-secondary-900">
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

  return (
    <div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="rounded-lg border bg-white p-4 shadow">
        {data.length ? (
          data.map((x: any, i: any) => (
            <div key={`${title}_${i}`} className="mb-2">
              <div className="text-sm font-bold text-secondary-800">{`- ${x.date}`}</div>
              <div className="pl-2 text-secondary-800">
                <span className="font-semibold">Left: </span>
                {x.left}
              </div>
              <div className="pl-2 text-secondary-800">
                <span className="font-semibold">Right: </span>
                {x.right}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm font-semibold text-secondary-700">
            No Data Available!
          </div>
        )}
      </div>
    </div>
  );
};

export const NeurologicalTable = (props: any) => {
  const { t } = useTranslation();
  const { consultationId } = props;
  // const dispatch: any = useDispatch();
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const REACTION_OPTIONS = PUPIL_REACTION_OPTIONS.map(({ id, value }) => ({
    id,
    value: t(`PUPIL_REACTION__${value}`),
  }));

  const LIMP_OPTIONS = LIMB_RESPONSE_OPTIONS.map(({ id, value }) => ({
    id,
    value: t(`LIMB_RESPONSE__${value}`),
  }));

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: NeurologicalTablesFields },
        pathParams: {
          consultationId,
        },
      });

      if (res && res.ok && data?.results) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };
    fetchDailyRounds(currentPage, consultationId);
  }, [currentPage, consultationId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  const locData: any = [];
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
      const loc = CONSCIOUSNESS_LEVEL.find(
        (item) => item.id === x[1].consciousness_level,
      );
      locData.push({
        date: formatDateTime(x[0]),
        loc: (loc && t(`CONSCIOUSNESS_LEVEL__${loc.value}`)) || "--",
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
            (item) => item.id === x[1].left_pupil_light_reaction,
          )?.value || "--",
        right:
          REACTION_OPTIONS.find(
            (item) => item.id === x[1].right_pupil_light_reaction,
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
            (item) => item.id === x[1].limb_response_upper_extremity_left,
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_upper_extremity_right,
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
            (item) => item.id === x[1].limb_response_lower_extremity_left,
          )?.value || "--",
        right:
          LIMP_OPTIONS.find(
            (item) => item.id === x[1].limb_response_lower_extremity_right,
          )?.value || "--",
      });
    }
  });

  return (
    <div className="mt-2">
      <div className="mb-6">
        <div className="text-xl font-semibold">Level Of Consciousness</div>
        <div className="w-max-content my-4 flex max-w-full flex-row divide-y divide-secondary-200 overflow-hidden shadow sm:rounded-lg">
          <div className="flex flex-row overflow-x-auto">
            {locData.map((x: any, i: any) => (
              <div
                key={`loc_${i}`}
                className="min-w-max-content flex flex-col divide-x divide-secondary-200 whitespace-nowrap"
              >
                <div className="border-r bg-secondary-50 px-2 py-3 text-center text-xs font-medium leading-4 text-secondary-700">
                  {x.date}
                </div>
                <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-secondary-700">
                  {x.loc}
                </div>
              </div>
            ))}
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
          <div className="w-max-content mb-4 flex max-w-full flex-row divide-y divide-secondary-200 overflow-hidden shadow sm:rounded-lg">
            <div className="flex flex-col">
              <div className="bg-secondary-50 px-2 py-7 text-center text-sm font-medium uppercase leading-4 tracking-wider text-secondary-700">
                Time
              </div>
              <div className="bg-secondary-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-secondary-700">
                Eye
              </div>
              <div className="bg-secondary-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-secondary-700">
                Verbal
              </div>
              <div className="bg-secondary-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-secondary-700">
                Motor
              </div>
              <div className="border-t-2 bg-secondary-50 px-2 py-4 text-center text-sm font-medium uppercase leading-5 tracking-wider text-secondary-700">
                Total
              </div>
            </div>
            <div className="flex flex-row overflow-x-auto">
              {glasgowData.map((x: any, i: any) => {
                return (
                  <div
                    key={`glascow_${i}`}
                    className="flex flex-col divide-x divide-secondary-200"
                  >
                    <div className="w-20 bg-secondary-50 px-2 py-4 text-center text-xs font-medium leading-5 text-secondary-800">
                      {x.date}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-secondary-800">
                      {x.eye}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-secondary-800">
                      {x.verbal}
                    </div>
                    <div className="whitespace-nowrap bg-white px-6 py-4 text-center text-sm leading-5 text-secondary-800">
                      {x.motor}
                    </div>
                    <div className="whitespace-nowrap border-t-2 border-secondary-500 bg-white px-6 py-4 text-center text-sm font-semibold leading-5 text-secondary-800">
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
              <div className="mb-2 text-xl font-semibold">
                Eye Opening Response
              </div>
              <div>
                {EYE_OPEN_SCALE.map((x: any) => (
                  <div
                    key={`eye_${x.value}`}
                    className="pl-2 leading-relaxed text-secondary-800"
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
                    className="pl-2 leading-relaxed text-secondary-800"
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
                    className="pl-2 leading-relaxed text-secondary-800"
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
