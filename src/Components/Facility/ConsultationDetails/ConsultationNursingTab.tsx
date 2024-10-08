import { lazy, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import {
  RoutineAnalysisRes,
  RoutineFields,
  NursingPlotFields,
} from "../models";
import Loading from "../../Common/Loading";
import Pagination from "../../Common/Pagination";
import {
  PAGINATION_LIMIT,
  NURSING_CARE_PROCEDURES,
} from "../../../Common/constants";
import LogUpdateAnalayseTable from "../Consultations/components/SharedTable";
import { formatDateTime } from "../../../Utils/utils";

import PageTitle from "@/Components/Common/PageTitle";

const REVERSE_CHOICES = {
  appetite: {
    1: "INCREASED",
    2: "SATISFACTORY",
    3: "REDUCED",
    4: "NO_TASTE_FOR_FOOD",
    5: "CANNOT_BE_ASSESSED",
  },
  bladder_drainage: {
    1: "NORMAL",
    2: "CONDOM_CATHETER",
    3: "DIAPER",
    4: "INTERMITTENT_CATHETER",
    5: "CONTINUOUS_INDWELLING_CATHETER",
    6: "CONTINUOUS_SUPRAPUBIC_CATHETER",
    7: "UROSTOMY",
  },
  bladder_issue: {
    0: "NO_ISSUES",
    1: "INCONTINENCE",
    2: "RETENTION",
    3: "HESITANCY",
  },
  bowel_issue: {
    0: "NO_DIFFICULTY",
    1: "CONSTIPATION",
    2: "DIARRHOEA",
  },
  nutrition_route: {
    1: "ORAL",
    2: "RYLES_TUBE",
    3: "GASTROSTOMY_OR_JEJUNOSTOMY",
    4: "PEG",
    5: "PARENTERAL_TUBING_FLUID",
    6: "PARENTERAL_TUBING_TPN",
  },
  oral_issue: {
    0: "NO_ISSUE",
    1: "DYSPHAGIA",
    2: "ODYNOPHAGIA",
  },
  is_experiencing_dysuria: {
    true: "yes",
    false: "no",
  },
  urination_frequency: {
    1: "NORMAL",
    2: "DECREASED",
    3: "INCREASED",
  },
  sleep: {
    1: "EXCESSIVE",
    2: "SATISFACTORY",
    3: "UNSATISFACTORY",
    4: "NO_SLEEP",
  },
} as const;

const ROUTINE_ROWS = [
  { field: "sleep" } as const,
  { field: "bowel_issue" } as const,
  { title: "Bladder" } as const,
  { subField: true, field: "bladder_drainage" } as const,
  { subField: true, field: "bladder_issue" } as const,
  { subField: true, field: "is_experiencing_dysuria" } as const,
  { subField: true, field: "urination_frequency" } as const,
  { title: "Nutrition" } as const,
  { subField: true, field: "nutrition_route" } as const,
  { subField: true, field: "oral_issue" } as const,
  { subField: true, field: "appetite" } as const,
];

const NursingPlot = ({ consultationId }: any) => {
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
        pathParams: { consultationId },
      });
      if (res && res.ok && data) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

  const handlePagination = (page: number) => setCurrentPage(page);

  const data = Object.entries(results).map((key: any) => ({
    date: formatDateTime(key[0]),
    nursing: key[1]["nursing"],
  }));

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
    return emptyFieldCount === NURSING_CARE_PROCEDURES.length;
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
      <div>
        {areFieldsEmpty() ? (
          <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
            <div className="flex items-center justify-center text-2xl font-bold text-secondary-500">
              {t("no_data_found")}
            </div>
          </div>
        ) : (
          <LogUpdateAnalayseTable data={mappedData} rows={rows} />
        )}
      </div>

      {totalCount > PAGINATION_LIMIT && !areFieldsEmpty() && (
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

const RoutineSection = ({ consultationId }: any) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>();
  const [results, setResults] = useState<Record<string, RoutineAnalysisRes>>();

  useEffect(() => {
    const getData = async () => {
      const { data } = await request(routes.dailyRoundsAnalyse, {
        body: { fields: RoutineFields, page },
        pathParams: { consultationId },
      });
      if (!data) {
        return;
      }
      setTotalCount(data.count);
      setResults(
        Object.fromEntries(
          Object.entries(data.results).filter(([_, value]) =>
            Object.entries(value).some(([k, v]) => k !== "id" && v != null),
          ),
        ) as typeof results,
      );
    };

    getData();
  }, [page, consultationId]);

  if (results == null) {
    return <Loading />;
  }

  if (Object.keys(results).length === 0) {
    return (
      <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
        <div className="flex items-center justify-center text-2xl font-bold text-secondary-500">
          {t("no_data_found")}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 pt-4">
      <LogUpdateAnalayseTable
        data={results}
        rows={ROUTINE_ROWS}
        choices={REVERSE_CHOICES}
      />

      {totalCount != null && totalCount > PAGINATION_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={page}
            defaultPerPage={PAGINATION_LIMIT}
            data={{ totalCount }}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default function ConsultationNursingTab({ consultationId }: any) {
  const { t } = useTranslation();
  return (
    <div>
      <PageTitle
        title={t("nursing_information")}
        hideBack
        breadcrumbs={false}
      />
      <div>
        <h4>{t("routine")}</h4>
        <RoutineSection consultationId={consultationId} />
      </div>
      <div>
        <h4>{t("nursing_care")}</h4>
        <NursingPlot consultationId={consultationId} />
      </div>
    </div>
  );
}
