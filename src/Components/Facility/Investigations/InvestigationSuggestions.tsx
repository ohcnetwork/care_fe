import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { getConsultation } from "../../../Redux/actions";
import ButtonV2 from "../../Common/components/ButtonV2";
import { InvestigationType } from "../../Common/prescription-builder/InvestigationBuilder";
import { InvestigationResponse } from "./Reports/types";
import dayjs from "../../../Utils/dayjs";

export default function ViewInvestigationSuggestions(props: {
  consultationId: any;
  logUrl?: string;
  investigations?: InvestigationResponse;
}) {
  const {
    consultationId,
    logUrl,
    investigations: previousInvestigations,
  } = props;
  const dispatch = useDispatch<any>();

  const [investigations, setInvestigations] = useState<
    InvestigationType[] | null
  >(null);

  useEffect(() => {
    getConsultationData();
  }, [consultationId]);

  const getConsultationData = async () => {
    const res = (await dispatch(getConsultation(consultationId))) as any;
    setInvestigations(res.data.investigation || []);
  };

  return (
    <div className="mt-5">
      <h3>Investigations Suggested</h3>
      <table className="mt-3 hidden w-full rounded-xl bg-white shadow md:table">
        <thead className="bg-gray-200 text-left">
          <tr>
            <th className="p-4">Investigations</th>
            <th className="p-4">To be conducted</th>
            {logUrl && <th className="p-4">Log Report</th>}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(investigations) ? (
            investigations.map((investigation, index) => {
              let nextFurthestInvestigation: any = undefined;

              return (
                <tr key={index} className="border-b border-b-gray-200">
                  <td className="p-4">
                    <ul className="ml-4 list-decimal">
                      {investigation.type?.map((type, index) => {
                        const investigationType = type.includes(" (GROUP)")
                          ? {
                              isGroup: true,
                              name: type.replace(" (GROUP)", ""),
                            }
                          : {
                              isGroup: false,
                              name: type.split(" -- ")[0],
                              groups: type
                                .split(" -- ")[1]
                                .split(",")
                                .map(
                                  (group) => group.split("( ")[1].split(" )")[0]
                                ),
                            };
                        const investigated = previousInvestigations?.find(
                          (previousInvestigation) =>
                            previousInvestigation.investigation_object.name ===
                            investigationType.name
                        );
                        const investigatedDate =
                          investigated &&
                          dayjs(
                            investigated.session_object.session_created_date
                          );
                        const nextInvestigationTime =
                          investigatedDate && investigation.frequency
                            ? investigatedDate.add(
                                dayjs.duration({
                                  hours:
                                    parseInt(
                                      investigation.frequency.split(" ")[0]
                                    ) /
                                    (investigation.frequency
                                      .split(" ")[1]
                                      .includes("hr")
                                      ? 1
                                      : 60),
                                })
                              )
                            : investigation.time
                            ? dayjs(investigation.time)
                            : undefined;

                        if (
                          !nextFurthestInvestigation ||
                          (nextInvestigationTime &&
                            nextFurthestInvestigation.isBefore(
                              nextInvestigationTime
                            ))
                        ) {
                          nextFurthestInvestigation = nextInvestigationTime;
                        }

                        const investigationMissed =
                          nextInvestigationTime &&
                          dayjs().isAfter(nextInvestigationTime);
                        console.log(
                          type,
                          nextFurthestInvestigation,
                          nextInvestigationTime
                        );

                        return (
                          <li
                            key={index}
                            className={`${
                              investigated &&
                              !investigationMissed &&
                              "text-green-500"
                            } ${investigationMissed && "text-red-500"}`}
                          >
                            {type}
                            {investigationMissed && (
                              <div className="tooltip inline-block cursor-pointer text-red-400">
                                <i className="fas fa-triangle-exclamation" />
                                <div className="tooltip-text">
                                  Investigation Missed!
                                </div>
                              </div>
                            )}
                            {investigated && !investigationMissed && (
                              <div className="tooltip inline-block cursor-pointer text-green-400">
                                <i className="fas fa-check" />
                                <div className="tooltip-text">
                                  Investigation Recorded
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-4 text-sm">
                      <span className="font-bold">Notes:</span>{" "}
                      {investigation.notes || "none"}
                    </div>
                  </td>
                  <td className="p-4">
                    {investigation.repetitive && (
                      <div>after every {investigation.frequency}</div>
                    )}
                    <div>
                      {nextFurthestInvestigation ? (
                        <div
                          className={`${
                            nextFurthestInvestigation.isBefore(dayjs())
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {investigation.frequency && "next"} at{" "}
                          {nextFurthestInvestigation.format(
                            "hh:mm A on DD/MM/YYYY"
                          )}
                        </div>
                      ) : (
                        "First investigation not recorded"
                      )}
                    </div>
                  </td>
                  {logUrl && (
                    <td className="p-4">
                      <ButtonV2
                        href={
                          logUrl +
                          "?investigations=" +
                          investigation.type?.join("_-_")
                        }
                      >
                        <CareIcon className="care-l-plus" />
                        <span>Log Report</span>
                      </ButtonV2>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="p-4" colSpan={3}>
                No Investigation Suggestions
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 md:hidden">
        {Array.isArray(investigations) ? (
          investigations.map((investigation, index) => {
            let nextFurthestInvestigation: any = undefined;

            return (
              <div key={index} className="rounded-xl bg-white p-4 shadow">
                <b>Investigations :</b>
                <ul className="ml-4 list-decimal">
                  {investigation.type?.map((type, index) => {
                    const investigationType = type.includes(" (GROUP)")
                      ? {
                          isGroup: true,
                          name: type.replace(" (GROUP)", ""),
                        }
                      : {
                          isGroup: false,
                          name: type.split(" -- ")[0],
                          groups: type
                            .split(" -- ")[1]
                            .split(",")
                            .map(
                              (group) => group.split("( ")[1].split(" )")[0]
                            ),
                        };
                    const investigated = previousInvestigations?.find(
                      (previousInvestigation) =>
                        previousInvestigation.investigation_object.name ===
                        investigationType.name
                    );
                    const investigatedDate =
                      investigated &&
                      dayjs(investigated.session_object.session_created_date);
                    const nextInvestigationTime =
                      investigatedDate && investigation.frequency
                        ? investigatedDate.add(
                            dayjs.duration({
                              hours:
                                parseInt(
                                  investigation.frequency.split(" ")[0]
                                ) /
                                (investigation.frequency
                                  .split(" ")[1]
                                  .includes("hr")
                                  ? 1
                                  : 60),
                            })
                          )
                        : investigation.time
                        ? dayjs(investigation.time)
                        : undefined;

                    if (
                      !nextFurthestInvestigation ||
                      (nextInvestigationTime &&
                        nextFurthestInvestigation.isBefore(
                          nextInvestigationTime
                        ))
                    ) {
                      nextFurthestInvestigation = nextInvestigationTime;
                    }

                    return <li key={index}>{type}</li>;
                  })}
                </ul>
                <br />
                <b>
                  To be conducted&nbsp;
                  {investigation.repetitive && (
                    <>after every {investigation.frequency}</>
                  )}
                  <div>
                    {nextFurthestInvestigation ? (
                      <div
                        className={`${
                          nextFurthestInvestigation.isBefore(dayjs())
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {investigation.frequency && "next"} at{" "}
                        {nextFurthestInvestigation.format(
                          "hh:mm A on DD/MM/YYYY"
                        )}
                      </div>
                    ) : (
                      "First investigation not recorded"
                    )}
                  </div>
                </b>
                <br />
                <br />
                <b>Notes :</b>
                <br />
                {investigation.notes || "none"}
                <br />
                <br />
                {logUrl && (
                  <ButtonV2
                    className="w-full"
                    href={
                      logUrl +
                      "?investigations=" +
                      investigation.type?.join("_-_")
                    }
                  >
                    <CareIcon className="care-l-plus" />
                    <span>Log Report</span>
                  </ButtonV2>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl bg-white shadow">
            No Investigation Suggestions
          </div>
        )}
      </div>
    </div>
  );
}
