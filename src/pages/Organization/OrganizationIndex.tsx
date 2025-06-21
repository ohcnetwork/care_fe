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

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  type Organization,
  getOrgLabel,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

export default function OrganizationIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["organization", "mine"],
    queryFn: query(organizationApi.listMine),
  });

  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Page title={t("organizations")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <CardGridSkeleton count={6} />
        </div>
      </Page>
    );
  }

  if (!data?.results?.length) {
    return (
      <Page title={t("organizations")}>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              No Organizations Found
            </CardTitle>
            <CardDescription className="text-center">
              You don't have access to any organizations yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-6 mb-4">
              <CareIcon icon="d-hospital" className="size-12 text-primary" />
            </div>
            <p className="text-center text-sm text-gray-500 max-w-sm mb-4">
              Organizations help you manage facilities, users, and resources
              efficiently. Contact your administrator to get access.
            </p>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page title={t("organizations")}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 mt-4">
        {data.results.map((org: Organization) => (
          <Card key={org.id} className="relative group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  {org.name}
                </CardTitle>
                <CardDescription>
                  {getOrgLabel(org.org_type, org.metadata)}
                </CardDescription>
              </div>
            </CardHeader>

            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link
                  href={`/organization/${org.id}`}
                  className="flex items-center justify-center gap-2"
                >
                  {t("view_details")}
                  <CareIcon icon="l-arrow-right" className="size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Page>
  );
}
