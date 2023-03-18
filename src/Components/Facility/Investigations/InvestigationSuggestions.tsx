import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { getConsultation } from "../../../Redux/actions";
import { formatDate } from "../../../Utils/utils";
import ButtonV2 from "../../Common/components/ButtonV2";
import { InvestigationType } from "../../Common/prescription-builder/InvestigationBuilder";
import { InvestigationResponse } from "./Reports/types";

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
      <table className="hidden md:table w-full bg-white shadow rounded-xl mt-3">
        <thead className="text-left bg-gray-200">
          <tr>
            <th className="p-4">Investigations</th>
            <th className="p-4">To be conducted</th>
            {logUrl && <th className="p-4">Log Report</th>}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(investigations) ? (
            investigations.map((investigation, index) => {
              /*const relativeFrequencyTime = investigation.frequency && moment()
                .add(
                  moment.duration({
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
              */

              return (
                <tr key={index} className="border-b border-b-gray-200">
                  <td className="p-4">
                    <ul className="list-decimal ml-4">
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
                        //const investigatedDate = investigated && moment(investigated.session_object.session_created_date);

                        return (
                          <li
                            key={index}
                            className={investigated ? "line-through" : ""}
                          >
                            {type}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="text-sm mt-4">
                      <span className="font-bold">Notes:</span>{" "}
                      {investigation.notes || "none"}
                    </div>
                  </td>
                  <td className="p-4">
                    {investigation.repetitive && (
                      <div>after every {investigation.frequency}</div>
                    )}
                    <div>
                      {investigation.repetitive || (
                        <>
                          at{" "}
                          {investigation.time
                            ? moment(investigation.time).format(
                                "hh:mm A on DD/MM/YYYY"
                              )
                            : "--:--"}
                        </>
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
          investigations.map((investigation, index) => (
            <div key={index} className="bg-white shadow rounded-xl p-4">
              <b>Investigations :</b>
              <ul className="list-decimal ml-4">
                {investigation.type?.map((type, index) => (
                  <li key={index}>{type}</li>
                ))}
              </ul>
              <br />
              <b>
                To be conducted&nbsp;
                {investigation.repetitive ? (
                  <>after every {investigation.frequency}</>
                ) : (
                  <>
                    at{" "}
                    {investigation.time
                      ? formatDate(investigation.time)
                      : "--:--"}
                  </>
                )}
              </b>
              <br />
              <br />
              <b>Notes :</b>
              <br />
              {investigation.notes || "none"}
            </div>
          ))
        ) : (
          <div className="bg-white shadow rounded-xl">
            No Investigation Suggestions
          </div>
        )}
      </div>
    </div>
  );
}
