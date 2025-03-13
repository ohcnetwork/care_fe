import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationParent,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface Props {
  id: string;
  children: React.ReactNode;
  facilityId: string;
}

interface NavItem {
  path: string;
  title: string;
  value: string;
}

export default function FacilityOrganizationLayout({
  id,
  facilityId,
  children,
}: Props) {
  const path = usePath() || "";
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    {
      path: `/departments/${id}/users`,
      title: t("users"),
      value: "users",
    },
    {
      path: `/departments/${id}`,
      title: t("departments_or_teams"),
      value: "departments",
    },
  ];

  const currentTab =
    navItems.find((item) => item.path === path)?.value || "users";

  const { data: org, isLoading } = useQuery<FacilityOrganization>({
    queryKey: ["facilityOrganization", id],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: { facilityId, organizationId: id },
    }),
  });

  if (isLoading) {
    return (
      <div className="px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-8/12 self-end" />
        <Skeleton className="h-8 w-full self-end" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (!org) {
    return <div>{t("not_found")}</div>;
  }

  const orgParents: FacilityOrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <>
      {orgParents.length > 0 && (
        <div className="md:px-6 py-2 flex items-center gap-2 mx-auto max-w-4xl">
          <Breadcrumb>
            <BreadcrumbList>
              {orgParents.reverse().map((parent) => (
                <>
                  <BreadcrumbItem key={parent.id}>
                    <BreadcrumbLink
                      asChild
                      className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
                    >
                      <Link href={path.replace(id, parent.id)}>
                        {parent.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem key={`ellipsis-${parent.id}`}>
                    <BreadcrumbSeparator />
                  </BreadcrumbItem>
                </>
              ))}
              <BreadcrumbItem key={org.id}>
                <span className="text-sm font-semibold text-gray-900">
                  {org.name}
                </span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      <Page
        title={org.name}
        componentRight={
          <Badge
            variant="outline"
            className="border border-transparent ml-2 text-indigo-800 bg-indigo-100 px-2 py-1 w-max"
          >
            {t(`facility_organization_type__${org.org_type}`)}
          </Badge>
        }
        className="mx-auto max-w-4xl"
      >
        <div className="mt-2">
          {org.description && (
            <p className="text-sm text-gray-500 break-all whitespace-normal">
              {org.description}
            </p>
          )}
          <Tabs
            defaultValue={currentTab}
            className="w-full mt-2"
            value={currentTab}
          >
            <TabsList className="w-full justify-start border-b border-gray-300 bg-transparent p-0 h-auto rounded-none">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <TabsTrigger
                    value={item.value}
                    className="border-b-2 border-transparent px-2 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                  >
                    {item.title}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4">{children}</div>
      </Page>
    </>
  );
}
