import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { AllergyIntolerance } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";

interface AllergyListProps {
  patientId: string;
  encounterId?: string;
}

export function AllergyList({ patientId, encounterId }: AllergyListProps) {
  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!allergies?.results?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No allergies recorded</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeStyle = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category?.toLowerCase()) {
      case "food":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medication":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "environment":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="p-0">
      <CardHeader className="px-4 py-0 pt-4">
        <CardTitle>{t("allergies")}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("allergen")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("criticality")}</TableHead>
              <TableHead>{t("created_by")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allergies.results.map((allergy: AllergyIntolerance) => (
              <TableRow key={allergy.id}>
                <TableCell className="font-medium">
                  {allergy.code.display}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getCategoryBadgeStyle(
                      allergy.category ?? "",
                    )}`}
                  >
                    {allergy.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getStatusBadgeStyle(
                      allergy.clinical_status,
                    )}`}
                  >
                    {allergy.clinical_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {allergy.criticality}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap flex items-center gap-2">
                  <Avatar
                    name={allergy.created_by.username}
                    className="w-4 h-4"
                    imageUrl={allergy.created_by.profile_picture_url}
                  />
                  <span className="text-sm">{allergy.created_by.username}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
