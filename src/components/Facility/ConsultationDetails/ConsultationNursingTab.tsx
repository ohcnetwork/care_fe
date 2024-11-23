import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import Pagination from "@/components/Common/Pagination";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";
import LogUpdateAnalyseTable from "@/components/Facility/Consultations/LogUpdateAnalyseTable";
import {
  NursingPlotFields,
  NursingPlotRes,
  RoutineAnalysisRes,
  RoutineFields,
} from "@/components/Facility/models";

import { NURSING_CARE_PROCEDURES, PAGINATION_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

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

const NursingPlot = ({ consultationId }: ConsultationTabProps) => {
  const { t } = useTranslation();
  const [results, setResults] = useState<{ [date: string]: NursingPlotRes }>(
    {},
  );
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
      if (res?.ok && data) {
        setResults(data.results as { [date: string]: NursingPlotRes });
        setTotalCount(data.count);
      }
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

  const handlePagination = (page: number) => setCurrentPage(page);

  let fieldsToDisplay = new Set<string>();

  /**
   * Transforms nursing procedure results into a structured format where dates are mapped to procedures and their descriptions.
   * Groups nursing data by date, collecting unique procedures and their corresponding descriptions.
   */
  const tableData = Object.entries(results).reduce(
    (acc: Record<string, Record<string, string>>, [date, result]) => {
      if ("nursing" in result) {
        result.nursing.forEach((field) => {
          if (field.procedure && !acc[date]) acc[date] = {};
          acc[date][field.procedure] = field.description;
          // Add procedure to the set of procedures to display
          fieldsToDisplay.add(field.procedure);
        });
      }
      return acc;
    },
    {},
  );

  fieldsToDisplay = fieldsToDisplay.intersection(
    new Set(NURSING_CARE_PROCEDURES),
  );

  const rows = Array.from(fieldsToDisplay).map((procedure) => ({
    field: procedure,
    title: t(`NURSING_CARE_PROCEDURE__${procedure}`),
  }));

  return (
    <div>
      <div>
        {fieldsToDisplay.size == 0 ? (
          <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
            <div className="flex items-center justify-center text-2xl font-bold text-secondary-500">
              {t("no_data_found")}
            </div>
          </div>
        ) : (
          <LogUpdateAnalyseTable data={tableData} rows={rows} />
        )}
      </div>

      {totalCount > PAGINATION_LIMIT && fieldsToDisplay.size > 0 && (
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

const RoutineSection = ({ consultationId }: ConsultationTabProps) => {
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
      <LogUpdateAnalyseTable
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

export default function ConsultationNursingTab(props: ConsultationTabProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageTitle
        title={t("nursing_information")}
        hideBack
        breadcrumbs={false}
      />
      <div>
        <h4 aria-label={t("routine")}>{t("routine")}</h4>
        <RoutineSection {...props} />
      </div>
      <div>
        <h4 aria-label={t("nursing_care")}>{t("nursing_care")}</h4>
        <NursingPlot {...props} />
      </div>
    </div>
  );
}
