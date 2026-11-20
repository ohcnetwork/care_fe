import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";
import { ReportType } from "@/types/emr/report/report";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/report/template/$templateSlug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId, templateSlug } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/report/template/$templateSlug",
  });
  return (
    <ReportViewer
      associatingId={accountId}
      templateSlug={templateSlug}
      reportType={ReportType.ACCOUNT_REPORT}
    />
  );
}
