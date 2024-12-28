import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { getOrgLevel } from "@/types/organisation/organisation";

import OrganisationLayout from "./components/OrganisationLayout";

interface Props {
  id: string;
}

export default function OrganisationView({ id }: Props) {
  const { data: children, isLoading } = useQuery({
    queryKey: ["organisation", id, "children"],
    queryFn: query(routes.organisation.list, {
      queryParams: { parent: id },
    }),
  });

  return (
    <OrganisationLayout id={id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Organisations</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children?.results?.length ? (
              children.results.map((org) => (
                <Card key={org.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{org.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{org.org_type}</Badge>
                            <Badge variant="outline">
                              {getOrgLevel(org.org_type, org.level_cache)}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="link" asChild>
                          <Link href={`/organisation/${org.id}`}>
                            View Details
                            <CareIcon
                              icon="l-arrow-right"
                              className="h-4 w-4"
                            />
                          </Link>
                        </Button>
                      </div>
                      {org.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  No sub-organisations found.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </OrganisationLayout>
  );
}
