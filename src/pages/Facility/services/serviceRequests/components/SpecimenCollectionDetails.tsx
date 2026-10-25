import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CollectionReadSpec } from "@/types/emr/specimen/specimen";
import { QuantitySpec } from "@/types/emr/specimenDefinition/specimenDefinition";
import { formatDateTime, formatName } from "@/Utils/utils";

function formatQuantity(quantity?: QuantitySpec | null) {
  if (!quantity) return "";
  return `${quantity.value} ${quantity.unit.display || quantity.unit.code}`;
}

/** Collection presentation shared with the native specimen workflow. */
export function SpecimenCollectionDetails({
  collection,
}: {
  collection: CollectionReadSpec;
}) {
  const { t } = useTranslation();
  const fasting = [
    collection.fasting_status_codeable_concept?.display ||
      collection.fasting_status_codeable_concept?.code,
    formatQuantity(collection.fasting_status_duration),
  ]
    .filter(Boolean)
    .join(" · ");
  const fields: [string, string | undefined][] = [
    [
      "collector",
      collection.collector
        ? collection.collector_object
          ? formatName(collection.collector_object)
          : t("unknown")
        : "",
    ],
    [
      "collected_time",
      collection.collected_date_time
        ? formatDateTime(collection.collected_date_time)
        : "",
    ],
    ["body_site", collection.body_site?.display || collection.body_site?.code],
    ["quantity", formatQuantity(collection.quantity)],
    ["method", collection.method?.display || collection.method?.code],
    ["fasting_status", fasting],
  ];
  const rows = fields.filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (!rows.length) return null;
  return (
    <Card className="min-w-0 rounded-xl overflow-hidden border-none shadow-md">
      <Table className="table-fixed">
        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
          <TableRow>
            <TableHead className="w-2/5 text-gray-700 whitespace-normal">
              {t("field")}
            </TableHead>
            <TableHead className="text-gray-700">{t("details")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableHead
                scope="row"
                className="text-gray-700 whitespace-normal break-words"
              >
                {t(label)}
              </TableHead>
              <TableCell className="text-gray-950 font-semibold whitespace-normal break-words">
                {value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
