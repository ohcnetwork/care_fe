import { useEffect, useState } from "react";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
import {
  NURSING_CARE_PROCEDURES,
  PAGINATION_LIMIT,
} from "../../../Common/constants";
import SharedSectionTable from "./components/SharedTable";
import Pagination from "../../Common/Pagination";
import { formatDateTime } from "../../../Utils/utils";
import { useTranslation } from "react-i18next";
import { NursingPlotFields } from "../models";

export const NursingPlot = ({ consultationId }: any) => {
  const { t } = useTranslation();
  const [results, setResults] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: NursingPlotFields },
        pathParams: {
          consultationId,
        },
      });
      if (res && res.ok && data) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

  const handlePagination = (page: number) => {
    setCurrentPage(page);
  };

  const data = Object.entries(results).map((key: any) => {
    return {
      date: formatDateTime(key[0]),
      nursing: key[1]["nursing"],
    };
  });

  const dataToDisplay = data
    .map((x) =>
      x.nursing.map((f: any) => {
        f["date"] = x.date;
        return f;
      }),
    )
    .reduce((accumulator, value) => accumulator.concat(value), []);

  const filterEmpty = (field: (typeof NURSING_CARE_PROCEDURES)[number]) => {
    const filtered = dataToDisplay.filter((i: any) => i.procedure === field);
    return filtered.length > 0;
  };

  const areFieldsEmpty = () => {
    let emptyFieldCount = 0;
    for (const field of NURSING_CARE_PROCEDURES) {
      if (!filterEmpty(field)) emptyFieldCount++;
    }
    if (emptyFieldCount === NURSING_CARE_PROCEDURES.length) return true;
    else return false;
  };

  const rows = NURSING_CARE_PROCEDURES.filter((f) => filterEmpty(f)).map(
    (procedure) => ({
      field: procedure,
      title: t(`NURSING_CARE_PROCEDURE__${procedure}`),
    }),
  );

  const mappedData = dataToDisplay.reduce(
    (acc: Record<string, any>, item: any) => {
      if (!acc[item.date]) acc[item.date] = {};
      acc[item.date][item.procedure] = item.description;
      return acc;
    },
    {},
  );

  return (
    <div>
      <div className="">
        <div>
          {areFieldsEmpty() && (
            <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
              <div className="flex items-center justify-center text-2xl font-bold text-secondary-500">
                {t("no_data_found")}
              </div>
            </div>
          )}

          {!areFieldsEmpty() && (
            <SharedSectionTable
              data={mappedData}
              rows={rows}
              translateKey="NURSING_CARE_PROCEDURE"
              t={t}
            />
          )}
        </div>
      </div>

      {!areFieldsEmpty() && totalCount > PAGINATION_LIMIT && (
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
