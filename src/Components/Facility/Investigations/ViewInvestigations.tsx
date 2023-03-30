import { navigate } from "raviger";
import ReportTable from "./Reports/ReportTable";
import loadable from "@loadable/component";
import { formatDate } from "../../../Utils/utils";
import { InvestigationSessionType } from "./investigationsTab";
const Loading = loadable(() => import("../../Common/Loading"));

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
    <div className="max-w-7xl mx-auto">
      {isLoading ? (
        <Loading />
      ) : (
        <div className="mt-4 space-y-2 ">
          {investigations.length > 0 && (
            <div>
              <h4 className="text-gray-700 -mb-14">Summary</h4>
              <ReportTable
                investigationData={investigations}
                hidePrint={true}
              />
            </div>
          )}
          {investigationSessions.length === 0 && (
            <div className="text-lg h-full text-center mt-5 text-gray-500 text-semibold bg-white py-4 rounded-lg shadow">
              No Investigation Reports Found
            </div>
          )}
          {investigationSessions.map((investigationSession) => {
            return (
              <div
                key={investigationSession.session_external_id}
                className="flex justify-between items-center bg-white hover:bg-gray-200 cursor-pointer p-4 border rounded-lg shadow"
              >
                <div>
                  {formatDate(investigationSession.session_created_date)}
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
