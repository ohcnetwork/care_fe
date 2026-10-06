import { CheckCheck, Eye, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { round } from "@/Utils/decimal";

import { formatQuantity } from "./specimenQuantity";

interface SpecimenCollectionInstructionsProps {
  requirement: SpecimenDefinitionRead;
  hasCollected: boolean;
}

export function SpecimenCollectionInstructions({
  requirement,
  hasCollected,
}: SpecimenCollectionInstructionsProps) {
  const { t } = useTranslation();
  const container = requirement.type_tested?.container;
  return (
    <AccordionItem value="instructions" className="border-none">
      <AccordionTrigger
        className={cn(
          "px-4 py-2 text-sm hover:bg-gray-50/50 data-[state=closed]:bg-white data-[state=open]:bg-gray-50 data-[state=open]:rounded-b-none",
        )}
      >
        <div className="flex items-center gap-2 flex-1 mr-4">
          <FileText className="size-4 text-gray-500" />
          <span className="font-medium flex items-center gap-2 underline">
            {t("specimen_collection_instructions")}
            {hasCollected ? (
              <CheckCheck className="size-4 text-blue-500" />
            ) : (
              <Eye className="size-4 text-gray-500" />
            )}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50 rounded-b-lg">
        <div className="space-y-1">
          <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
            {t("specimen_collection")}
          </p>
          <Card className="rounded-xl overflow-clip">
            <Table>
              <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                <TableRow>
                  <TableHead className="w-[150px] text-gray-700 ">
                    {t("field")}
                  </TableHead>
                  <TableHead className="text-gray-700">
                    {t("details")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead className="w-[150px] text-gray-700">
                    {t("required_type")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {requirement.type_collected?.display ?? t("na")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("required_method")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {requirement.collection?.display ?? t("na")}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("patient_prep")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold break-words whitespace-pre-wrap">
                    {requirement.patient_preparation &&
                    requirement.patient_preparation.length > 0
                      ? requirement.patient_preparation
                          .map((p) => p.display)
                          .join(", ")
                      : t("na")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
        {container && (
          <div className="space-y-1">
            <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
              {t("required_container")}
            </p>
            <Card className="rounded-xl overflow-clip">
              <Table>
                <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                  <TableRow>
                    <TableHead className="w-[150px] text-gray-700 ">
                      {t("field")}
                    </TableHead>
                    <TableHead className="text-gray-700">
                      {t("details")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableHead className="w-[150px] text-gray-700">
                      {t("container")}
                    </TableHead>
                    <TableCell className="text-gray-950 font-semibold">
                      {container.cap?.display ?? t("na")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-gray-700">
                      {t("capacity")}
                    </TableHead>
                    <TableCell className="text-gray-950 font-semibold">
                      {container.capacity
                        ? formatQuantity({
                            quantity: container.capacity,
                          })
                        : t("na")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-gray-700">
                      {t("min_volume")}
                    </TableHead>
                    <TableCell className="text-gray-950 font-semibold">
                      {container.minimum_volume
                        ? formatQuantity(container.minimum_volume)
                        : t("na")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-gray-700">
                      {t("preparation")}
                    </TableHead>
                    <TableCell className="text-gray-950 font-semibold">
                      {container.preparation ?? t("na")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
        <div className="space-y-1">
          <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
            {t("required_processing_storage")}
          </p>
          <Card className="rounded-xl overflow-clip border">
            <Table>
              <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                <TableRow>
                  <TableHead className="w-[150px] text-gray-700">
                    {t("field")}
                  </TableHead>
                  <TableHead className="text-gray-700">
                    {t("details")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableHead className="w-[150px] text-gray-700">
                    {t("retention")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {requirement.type_tested?.retention_time
                      ? `${round(requirement.type_tested.retention_time.value)} ${requirement.type_tested.retention_time.unit.display}`
                      : t("na")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
