import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { PencilIcon } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  facilityId?: string;
  patientId: string;
  encounterId?: string;
}

export function AllergyList({
  facilityId,
  patientId,
  encounterId,
}: AllergyListProps) {
  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: encounterId ? { encounter: encounterId } : undefined,
    }),
  });

  if (isLoading) {
    return (
      <AllergyListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <CardContent>
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </AllergyListLayout>
    );
  }

  const filteredAllergies = allergies?.results?.filter(
    (allergy) =>
      showEnteredInError || allergy.verification_status !== "entered_in_error",
  );

  const hasEnteredInErrorRecords = allergies?.results?.some(
    (allergy) => allergy.verification_status === "entered_in_error",
  );

  if (!filteredAllergies?.length) {
    return (
      <AllergyListLayout
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      >
        <CardContent>
          <p className="text-muted-foreground">{t("no_allergies_recorded")}</p>
        </CardContent>
      </AllergyListLayout>
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
    <AllergyListLayout
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
    >
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
          {filteredAllergies
            .sort((a, _b) => {
              if (a.clinical_status === "inactive") {
                return 1;
              }
              return -1;
            })
            .map((allergy: AllergyIntolerance) => (
              <TableRow
                key={allergy.id}
                className={cn(
                  allergy.verification_status === "entered_in_error" &&
                    "opacity-50 bg-gray-50/50",
                )}
              >
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
                    {t(allergy.category)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`whitespace-nowrap ${getStatusBadgeStyle(
                      allergy.clinical_status,
                    )}`}
                  >
                    {t(allergy.clinical_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {t(allergy.criticality)}
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
      {hasEnteredInErrorRecords && !showEnteredInError && (
        <div className="ml-1 flex justify-start">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowEnteredInError(true)}
            className="text-xs underline text-gray-500"
          >
            {t("view_all")}
          </Button>
        </div>
      )}
    </AllergyListLayout>
  );
}

const AllergyListLayout = ({
  facilityId,
  patientId,
  encounterId,
  children,
}: {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  children: ReactNode;
}) => {
  return (
    <Card>
      <CardHeader className="px-4 py-0 pt-4 flex justify-between flex-row">
        <CardTitle>{t("allergies")}</CardTitle>
        {facilityId && encounterId && (
          <Link
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/allergy_intolerance`}
            className="flex items-center gap-1 text-sm hover:text-gray-500"
          >
            <PencilIcon size={12} />
            {t("edit")}
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
