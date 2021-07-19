import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { NURSING_CARE_FIELDS } from "../../../Common/constants";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

export const NursingPlot = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState<any>({});

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: ["nursing"],
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

  const data = Object.entries(results).map((key: any) => {
    return {
      date: moment(key[0]).format("LLL"),
      nursing: key[1]["nursing"],
    };
  });

  let dataToDisplay = data
    .map((x) =>
      x.nursing.map((f: any) => {
        f["date"] = x.date;
        return f;
      })
    )
    .reduce((accumulator, value) => accumulator.concat(value), []);

  return (
    <div className="grid md:grid-cols-full gap-4">
      <div>
        <div className="space-y-2">
          {NURSING_CARE_FIELDS.map((f: any) => (
            <div key={f.desc} className="p-4 bg-white border rounded-lg shadow">
              <div className="text-xl font-semibold">{f.desc}</div>
              <div className="space-y-2">
                {dataToDisplay
                  .filter((i: any) => i.procedure === f.text)
                  .map((care: any, index: number) => (
                    <div key={index}>
                      <div className="text-sm font-semibold">{`- ${care.date}`}</div>
                      <div className="text-cool-gray-800 pl-2">
                        {care.description}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
