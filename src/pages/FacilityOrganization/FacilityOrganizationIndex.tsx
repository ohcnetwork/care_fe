import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";

import CreateFacilityOrganizationSheet from "./components/CreateFacilityOrganizationSheet";

export default function FacilityOrganizationIndex({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["facilityOrganization", "list", facilityId],
    queryFn: query(routes.facilityOrganization.list, {
      pathParams: { facilityId },
    }),
    enabled: !!facilityId,
  });

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-48 self-end" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="relative space-y-4">
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data?.results?.length) {
    return (
      <Page title={t("organizations")}>
        <div className="flex justify-center md:justify-end mt-2 mb-4">
          <CreateFacilityOrganizationSheet facilityId={facilityId} />
        </div>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              {t("organization_not_found")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("organization_forbidden")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <CareIcon icon="d-hospital" className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-sm text-muted-foreground max-w-sm mb-4">
              {t("organization_access_help")}
            </p>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page title={t("facility_organizations")} hideBack={true}>
      <div className="flex justify-center md:justify-end mt-2 mb-4">
        <CreateFacilityOrganizationSheet facilityId={facilityId} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {data.results.map((org: FacilityOrganization) => (
          <Card key={org.id} className="relative group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  {org.name}
                </CardTitle>
                <CardDescription>{org.org_type}</CardDescription>
              </div>
            </CardHeader>

            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link
                  href={`/facility/${facilityId}/organization/${org.id}`}
                  className="flex items-center justify-center gap-2"
                >
                  {t("view_details")}
                  <CareIcon icon="l-arrow-right" className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Page>
  );
}
