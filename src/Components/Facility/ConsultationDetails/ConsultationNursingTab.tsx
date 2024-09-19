import { lazy, useEffect, useState } from "react";
import { ConsultationTabProps } from "./index";
import { NursingPlot } from "../Consultations/NursingPlot";
import { useTranslation } from "react-i18next";
import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import { RoutineAnalysisRes, RoutineFields } from "../models";
import Loading from "../../Common/Loading";
import { classNames, formatDate, formatTime } from "../../../Utils/utils";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

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
        <h4>{t("routine")}</h4>
        <RoutineSection {...props} />
      </div>
      <div>
        <h4>{t("nursing_care")}</h4>
        <NursingPlot
          facilityId={props.facilityId}
          patientId={props.patientId}
          consultationId={props.consultationId}
        />
      </div>
    </div>
  );
}

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
      <div className="m-2 w-full overflow-hidden overflow-x-auto rounded-lg border border-black shadow md:w-fit">
        <table className="border-collapse overflow-hidden rounded-lg border bg-secondary-100">
          <thead className="bg-white shadow">
            <tr>
              <th className="w-48 border-b-2 border-r-2 border-black" />
              {Object.keys(results).map((date) => (
                <th
                  key={date}
                  className="border border-b-2 border-secondary-500 border-b-black p-1 text-sm font-semibold"
                >
                  <p>{formatDate(date)}</p>
                  <p>{formatTime(date)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-secondary-200">
            {ROUTINE_ROWS.map((row) => (
              <tr
                key={row.field ?? row.title}
                className={classNames(
                  row.title && "border-t-2 border-t-secondary-600",
                )}
              >
                <td
                  className={classNames(
                    "border border-r-2 border-secondary-500 border-r-black bg-white p-2",
                    row.subField ? "pl-4 font-medium" : "font-bold",
                  )}
                >
                  {row.title ?? t(`LOG_UPDATE_FIELD_LABEL__${row.field!}`)}
                </td>
                {row.field &&
                  Object.values(results).map((obj, idx) => (
                    <td
                      key={`${row.field}-${idx}`}
                      className={classNames(
                        "border border-secondary-500 bg-secondary-100 p-2 text-center font-medium",
                      )}
                    >
                      {(() => {
                        const value = obj[row.field];
                        if (value == null) {
                          return "-";
                        }
                        if (typeof value === "boolean") {
                          return t(value ? "yes" : "no");
                        }
                        const choices = REVERSE_CHOICES[row.field];
                        const choice = `${row.field.toUpperCase()}__${choices[value as keyof typeof choices]}`;
                        return t(choice);
                      })()}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
