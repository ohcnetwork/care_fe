import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { formatName } from "@/Utils/utils";

import { formatQuantity } from "./specimenQuantity";

interface SpecimenCollectionDetailsProps {
  specimen: SpecimenRead;
}

export function SpecimenCollectionDetails({
  specimen,
}: SpecimenCollectionDetailsProps) {
  const { t } = useTranslation();
  return (
    <AccordionItem value="collection-details" className="border-none">
      <AccordionTrigger
        className={cn(
          "px-4 py-2 text-sm hover:bg-gray-50/50 data-[state=closed]:bg-white data-[state=open]:bg-gray-50 data-[state=open]:rounded-b-none",
        )}
      >
        <div className="flex items-center gap-2 flex-1 mr-4">
          <Receipt className="size-4 text-gray-500" />
          <span className="font-medium underline">
            {t("specimen_collection")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="green"> 1/1 {t("collected")}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50 rounded-b-lg">
        <p className="font-semibold text-xs mb-2 flex items-center gap-2">
          {t("collected_specimen_details")}
        </p>
        <Card className="rounded-xl overflow-clip border-none shadow-md">
          <Table>
            <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
              <TableRow>
                <TableHead className="w-[150px] text-gray-700 ">
                  {t("field")}
                </TableHead>
                <TableHead className="text-gray-700">{t("details")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specimen.collection?.collector && (
                <TableRow>
                  <TableHead className="w-[150px] text-gray-700">
                    {t("collector")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {specimen.collection.collector_object
                      ? formatName(specimen.collection.collector_object)
                      : "--"}
                  </TableCell>
                </TableRow>
              )}
              {specimen.collection?.collected_date_time && (
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("collected_time")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {new Date(
                      specimen.collection.collected_date_time,
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              )}
              {specimen.collection?.body_site && (
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("body_site")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {specimen.collection.body_site.display}
                  </TableCell>
                </TableRow>
              )}
              {specimen.collection?.quantity && (
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("quantity")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {formatQuantity({
                      quantity: specimen.collection.quantity,
                    })}
                  </TableCell>
                </TableRow>
              )}
              {specimen.collection?.fasting_status_codeable_concept && (
                <TableRow>
                  <TableHead className="text-gray-700">
                    {t("fasting_status")}
                  </TableHead>
                  <TableCell className="text-gray-950 font-semibold">
                    {
                      specimen.collection.fasting_status_codeable_concept
                        .display
                    }{" "}
                    {specimen.collection.fasting_status_duration &&
                      `(${formatQuantity({ quantity: specimen.collection.fasting_status_duration })})`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
}
