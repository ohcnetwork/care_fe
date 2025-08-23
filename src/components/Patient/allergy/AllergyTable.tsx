import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";

import { formatName } from "@/Utils/utils";
import {
  ALLERGY_CLINICAL_STATUS_COLORS,
  ALLERGY_CRITICALITY_COLORS,
  ALLERGY_VERIFICATION_STATUS_COLORS,
  AllergyIntolerance,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";

import { CATEGORY_ICONS } from "./list";

interface AllergyTableProps {
  allergies: AllergyIntolerance[];
}

export function AllergyTable({ allergies }: AllergyTableProps) {
  const { t } = useTranslation();

  return (
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
        {allergies.map((allergy) => (
          <TableRow
            key={allergy.id}
            className={`rounded-md overflow-hidden bg-gray-50 ${
              allergy.verification_status === "entered_in_error"
                ? "opacity-50"
                : ""
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
                variant={
                  ALLERGY_CLINICAL_STATUS_COLORS[allergy.clinical_status]
                }
                className="whitespace-nowrap"
              >
                {t(allergy.clinical_status)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={ALLERGY_CRITICALITY_COLORS[allergy.criticality]}
                className="whitespace-nowrap"
              >
                {t(allergy.criticality)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  ALLERGY_VERIFICATION_STATUS_COLORS[
                    allergy.verification_status
                  ]
                }
                className="whitespace-nowrap capitalize"
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
                  name={formatName(allergy.created_by)}
                  className="size-4"
                  imageUrl={allergy.created_by.profile_picture_url}
                />
                <span className="text-sm">
                  {formatName(allergy.created_by)}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
