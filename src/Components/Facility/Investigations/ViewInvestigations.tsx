import { navigate } from "raviger";
import ReportTable from "./Reports/ReportTable";

import { formatDateTime } from "../../../Utils/utils";
import { InvestigationSessionType } from "./investigationsTab";
import { lazy } from "react";
const Loading = lazy(() => import("../../Common/Loading"));

export default function ViewInvestigations(props: {
  isLoading: boolean;
  investigations: any;
  investigationSessions: InvestigationSessionType[];
  facilityId: string;
  patientId: string;
  consultationId: string;
}) {
  const {
    isLoading,
    investigations,
    investigationSessions,
    facilityId,
    patientId,
    consultationId,
  } = props;

  return (
    <div className="mx-auto max-w-7xl">
      {isLoading ? (
        <Loading />
      ) : (
        <div className="mt-4 space-y-2 ">
          {investigations.length > 0 && (
            <div>
              <h4 className="-mb-14 text-gray-700">Summary</h4>
              <ReportTable
                investigationData={investigations}
                hidePrint={true}
              />
            </div>
          )}
          {investigationSessions.length === 0 && (
            <div className="text-semibold mt-5 h-full rounded-lg bg-white py-4 text-center text-lg text-gray-500 shadow">
              No Investigation Reports Found
            </div>
          )}
          {investigationSessions.map((investigationSession) => {
            return (
              <div
                key={investigationSession.session_external_id}
                className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 shadow hover:bg-gray-200"
              >
                <div>
                  {formatDateTime(investigationSession.session_created_date)}
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${investigationSession.session_external_id}`
                    )
                  }
                  className="btn btn-default"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
