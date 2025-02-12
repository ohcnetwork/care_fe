import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationParent,
} from "@/types/facilityOrganization/facilityOrganization";

interface Props {
  id: string;
  children: React.ReactNode;
  facilityId: string;
}

interface NavItem {
  path: string;
  title: string;
  icon: IconName;
}

export default function FacilityOrganizationLayout({
  id,
  facilityId,
  children,
}: Props) {
  const path = usePath() || "";

  const navItems: NavItem[] = [
    {
      path: `/departments/${id}`,
      title: "Departments",
      icon: "d-hospital",
    },
    {
      path: `/departments/${id}/users`,
      title: "Users",
      icon: "d-people",
    },
  ];

  const { data: org, isLoading } = useQuery<FacilityOrganization>({
    queryKey: ["facilityOrganization", id],
    queryFn: query(routes.facilityOrganization.get, {
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
  // add loading state
  if (!org) {
    return <div>Not found</div>;
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
    <Page title={`${org.name} `}>
      {/* Navigation */}
      <div className="mt-4">
        <Menubar>
          {navItems.map((item) => (
            <MenubarMenu key={item.path}>
              <MenubarTrigger
                className={`${
                  path === item.path
                    ? "font-medium text-primary-700 bg-gray-100"
                    : "hover:text-primary-500 hover:bg-gray-100 text-gray-700"
                }`}
                asChild
              >
                <Link href={item.path} className="cursor-pointer">
                  <CareIcon icon={item.icon} className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>
      {/* Page Content */}
      <div className="mt-4">{children}</div>
    </Page>
  );
}
