import { useTranslation } from "react-i18next";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ResourceQuestionnaireResponse } from "@/types/questionnaire/resourceQuestionnaireResponseApi";

import { ResourceResponseRow } from "./ResourceResponseRow";

interface ResourceResponseTableProps {
  responses: ResourceQuestionnaireResponse[];
  responseId?: string;
  isUpdating: boolean;
  isPlaceholderData: boolean;
  onSelect: (responseId: string) => void;
}

export function ResourceResponseTable({
  responses,
  responseId,
  isUpdating,
  isPlaceholderData,
  onSelect,
}: ResourceResponseTableProps) {
  const { t } = useTranslation();
  return (
    <div
      aria-busy={isUpdating}
      className={cn(isPlaceholderData && "opacity-60")}
    >
      <Table>
        <TableHeader className="bg-neutral-50">
          <TableRow className="border-neutral-200 hover:bg-transparent">
            <TableHead className="h-10 px-4 text-sm font-medium text-neutral-950">
              {t("questionnaire")}
            </TableHead>
            <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 lg:table-cell">
              {t("submitted_by")}
            </TableHead>
            <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 md:table-cell">
              {t("submitted_on")}
            </TableHead>
            <TableHead className="hidden h-10 text-sm font-medium text-neutral-950 md:table-cell">
              {t("status")}
            </TableHead>
            <TableHead className="w-20 px-4 text-right">
              <span className="sr-only">{t("view_response")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((response) => (
            <ResourceResponseRow
              key={response.id}
              response={response}
              selected={response.id === responseId}
              disabled={isPlaceholderData}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
