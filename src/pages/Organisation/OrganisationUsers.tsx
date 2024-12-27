import { useQuery } from "@tanstack/react-query";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { OrganizationUserRole } from "@/types/organisation/organisation";

import AddUserSheet from "./components/AddUserSheet";
import EditUserRoleSheet from "./components/EditUserRoleSheet";
import OrganisationLayout from "./components/OrganisationLayout";

interface Props {
  id: string;
}

export default function OrganisationUsers({ id }: Props) {
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["organizationUsers", id],
    queryFn: query(routes.organisation.listUsers, {
      pathParams: { id },
    }),
    enabled: !!id,
  });

  if (!id) {
    return null;
  }

  if (isLoadingUsers) {
    return (
      <OrganisationLayout id={id}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </OrganisationLayout>
    );
  }

  return (
    <OrganisationLayout id={id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Users</h2>
          <AddUserSheet organizationId={id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users?.results?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                No users found.
              </CardContent>
            </Card>
          ) : (
            users?.results?.map((userRole: OrganizationUserRole) => (
              <Card key={userRole.id} className="h-full">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex flex-col gap-4 sm:flex-row w-full">
                        <div className="flex flex-col items-center gap-4 min-[400px]:flex-row sm:items-start">
                          <Avatar
                            name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                            className="h-16 w-16 text-2xl"
                          />
                        </div>
                        <div className="flex flex-col w-full">
                          <div>
                            <div className="flex flex-row justify-between gap-x-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-x-3">
                                  <h1 className="text-base font-bold">
                                    {userRole.user.first_name}{" "}
                                    {userRole.user.last_name}
                                  </h1>
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100"
                                  >
                                    <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500 mr-2" />
                                    <span className="text-xs text-green-700">
                                      online
                                    </span>
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {userRole.user.username}
                                </span>
                              </div>
                              <div>
                                <EditUserRoleSheet
                                  organizationId={id}
                                  userRole={userRole}
                                  trigger={
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                    >
                                      <CareIcon
                                        icon="l-arrow-up-right"
                                        className="h-4 w-4"
                                      />
                                      <span>More details</span>
                                    </Button>
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                            <div className="text-sm">
                              <div className="text-gray-500">Role</div>
                              <div className="font-medium">
                                {userRole.role.name}
                              </div>
                            </div>
                            <div className="text-sm">
                              <div className="text-gray-500">Email</div>
                              <div className="font-medium">
                                {userRole.user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </OrganisationLayout>
  );
}
