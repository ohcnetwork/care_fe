import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import ReportTable from "@/components/Facility/Investigations/Reports/ReportTable";
import { InvestigationResponse } from "@/components/Facility/Investigations/Reports/types";
import { InvestigationSessionType } from "@/components/Facility/Investigations/investigationsTab";

import { formatDateTime } from "@/Utils/utils";

export default function ViewInvestigations(props: {
  isLoading: boolean;
  investigations: InvestigationResponse;
  investigationSessions: InvestigationSessionType[];
  facilityId: string;
  patientId: string;
  consultationId: string;
}) {
  const { t } = useTranslation();
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
        <div className="min-h-screen">
          <Loading />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {investigations.length > 0 && (
            <div>
              <h4 className="-mb-14 text-secondary-700">{t("summary")}</h4>
              <ReportTable
                investigationData={investigations}
                hidePrint={true}
              />
            </div>
          )}
          {investigationSessions.length === 0 && (
            <div className="text-semibold mt-5 h-full rounded-lg bg-white py-4 text-center text-lg text-secondary-500 shadow">
              {t("no_investigation")}
            </div>
          )}
          {investigationSessions.map((investigationSession) => {
            return (
              <div
                key={investigationSession.session_external_id}
                className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 shadow hover:bg-secondary-200"
              >
                <div>
                  {formatDateTime(investigationSession.session_created_date)}
                </div>
                <div className="flex items-center space-x-2">
                  <ButtonV2
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${investigationSession.session_external_id}`,
                      )
                    }
                    ghost
                    border
                  >
                    {t("view")}
                  </ButtonV2>
                  <ButtonV2
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${investigationSession.session_external_id}/print`,
                      )
                    }
                    ghost
                    border
                  >
                    <CareIcon icon="l-print" className="text-lg" />
                    {t("print")}
                  </ButtonV2>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
