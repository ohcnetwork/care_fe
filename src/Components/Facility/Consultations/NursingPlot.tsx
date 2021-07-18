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
  const limit = 14;

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            limit,
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
    console.log(key);
    return {
      date: moment(key[0]).format("LLL"),
      nursing: key[1]["nursing"],
    };
  });

  return (
    <div className="grid md:grid-cols-full gap-4">
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        {data.map((x) => (
          <div className="flex border-b-2">
            <div className="p-2">
              {x.date}
              <div>Description</div>
            </div>

            {x.nursing.map((care: any) => (
              <div className="p-2">
                <div className="font-bold">
                  {
                    NURSING_CARE_FIELDS.find(
                      (field) => field.text === care.procedure
                    )?.desc
                  }
                </div>
                <div>{care.description}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
