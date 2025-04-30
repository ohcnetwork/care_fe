import { useQuery } from "@tanstack/react-query";
import {
  BeakerIcon,
  CookingPotIcon,
  HeartPulseIcon,
  LeafIcon,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import {
  ALLERGY_CLINICAL_STATUS_STYLES,
  ALLERGY_CRITICALITY_STYLES,
  ALLERGY_VERIFICATION_STATUS_STYLES,
  AllergyCategory,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";
import { Encounter, completedEncounterStatus } from "@/types/emr/encounter";

interface AllergyListProps {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  className?: string;
  readOnly?: boolean;
  encounterStatus?: Encounter["status"];
}

export const CATEGORY_ICONS: Record<AllergyCategory, ReactNode> = {
  food: <CookingPotIcon className="size-4" aria-label="Food allergy" />,
  medication: <BeakerIcon className="size-4" aria-label="Medication allergy" />,
  environment: (
    <LeafIcon className="size-4" aria-label="Environmental allergy" />
  ),
  biologic: <HeartPulseIcon className="size-4" aria-label="Biologic allergy" />,
};

export function AllergyList({
  patientId,
  encounterId,
  className = "",
  readOnly = false,
  encounterStatus,
}: AllergyListProps) {
  const { t } = useTranslation();

  const [showEnteredInError, setShowEnteredInError] = useState(false);

  const { data: allergies, isLoading } = useQuery({
    queryKey: ["allergies", patientId, encounterId, encounterStatus],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId },
      queryParams: {
        encounter: completedEncounterStatus.includes(encounterStatus as string)
          ? encounterId
          : undefined,
      },
    }),
  });

  if (isLoading) {
    return (
      <EncounterAccordionLayout
        title="allergies"
        readOnly={readOnly}
        className={className}
        editLink={!readOnly ? "questionnaire/allergy_intolerance" : undefined}
      >
        <Skeleton className="h-[100px] w-full" />
      </EncounterAccordionLayout>
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
    return null;
  }

  interface AllergyRowProps {
    allergy: AllergyIntolerance;
  }

  function AllergyRow({ allergy }: AllergyRowProps) {
    return (
      <TableRow
        className={`rounded-md overflow-hidden bg-gray-50 ${
          allergy.verification_status === "entered_in_error" ? "opacity-50" : ""
        }`}
      >
        <TableCell className="first:rounded-l-md">
          <div className="flex items-center">
            {CATEGORY_ICONS[allergy.category ?? ""]}
          </div>
        </TableCell>
        <TableCell className="font-medium pl-0 md:whitespace-normal">
          {allergy.code.display}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${
              ALLERGY_CLINICAL_STATUS_STYLES[allergy.clinical_status]
            }`}
          >
            {t(allergy.clinical_status)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap ${
              ALLERGY_CRITICALITY_STYLES[allergy.criticality]
            }`}
          >
            {t(allergy.criticality)}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`whitespace-nowrap capitalize ${
              ALLERGY_VERIFICATION_STATUS_STYLES[allergy.verification_status]
            }`}
          >
            {t(allergy.verification_status)}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-gray-950">
          {allergy.note && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                  >
                    {t("see_note")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {allergy.note}
                  </p>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </TableCell>
        <TableCell className="last:rounded-r-md">
          <div className="flex items-center gap-2">
            <Avatar
              name={allergy.created_by.username}
              className="size-4"
              imageUrl={allergy.created_by.profile_picture_url}
            />
            <span className="text-sm">{formatName(allergy.created_by)}</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <EncounterAccordionLayout
      title="allergies"
      readOnly={readOnly}
      className={className}
      editLink={!readOnly ? "questionnaire/allergy_intolerance" : undefined}
    >
      <Table className="border-separate border-spacing-y-0.5">
        <TableHeader>
          <TableRow className="rounded-md overflow-hidden bg-gray-100">
            <TableHead className="first:rounded-l-md h-auto py-1 pl-1 pr-0 text-gray-600"></TableHead>
            <TableHead className="h-auto py-1 pl-1 pr-2 text-gray-600">
              {t("allergen")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("status")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("criticality")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("verification")}
            </TableHead>
            <TableHead className="h-auto py-1 px-2 text-gray-600">
              {t("notes")}
            </TableHead>
            <TableHead className="last:rounded-r-md h-auto py-1 px-2 text-gray-600">
              {t("logged_by")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Valid entries */}
          {filteredAllergies
            .filter(
              (allergy) => allergy.verification_status !== "entered_in_error",
            )
            .map((allergy) => (
              <AllergyRow key={allergy.id} allergy={allergy} />
            ))}

          {/* Entered in error entries */}
          {showEnteredInError &&
            filteredAllergies
              .filter(
                (allergy) => allergy.verification_status === "entered_in_error",
              )
              .map((allergy) => (
                <AllergyRow key={allergy.id} allergy={allergy} />
              ))}
        </TableBody>
      </Table>
      {hasEnteredInErrorRecords && !showEnteredInError && (
        <>
          <div className="border-b border-dashed border-gray-200 my-2" />
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setShowEnteredInError(true)}
              className="text-xs underline text-gray-950"
            >
              {t("view_all")}
            </Button>
          </div>
        </>
      )}
    </EncounterAccordionLayout>
  );
}
