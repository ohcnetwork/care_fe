import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";
import { ReportType } from "@/types/emr/report/report";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/report/$reportId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId, reportId } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/report/$reportId",
  });
  return (
    <ReportViewer
      associatingId={accountId}
      reportId={reportId}
      reportType={ReportType.ACCOUNT_REPORT}
    />
  );
}
