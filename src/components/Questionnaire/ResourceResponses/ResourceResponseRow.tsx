import { ChevronRight, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";
import type { ResourceQuestionnaireResponse } from "@/types/questionnaire/resourceQuestionnaireResponseApi";
import { formatDateTime, formatName } from "@/Utils/utils";

import { getResponsePreview } from "./response";

interface ResourceResponseRowProps {
  response: ResourceQuestionnaireResponse;
  selected: boolean;
  disabled: boolean;
  onSelect: (responseId: string) => void;
}

export function ResourceResponseRow({
  response,
  selected,
  disabled,
  onSelect,
}: ResourceResponseRowProps) {
  const { t } = useTranslation();
  const author = formatName(response.created_by);
  const preview = getResponsePreview(response, t);
  const enteredInError =
    response.status === QuestionnaireResponseStatus.EnteredInError;
  const statusBadge = (
    <Badge
      size="xs"
      variant={enteredInError ? "destructive" : "green"}
      className={cn(
        "h-5 rounded-sm px-2 py-0",
        enteredInError ? "border-red-500/45" : "border-green-500/40",
      )}
    >
      {t(response.status)}
    </Badge>
  );
  return (
    <TableRow
      data-response-id={response.id}
      data-state={selected ? "selected" : undefined}
      className="group cursor-pointer border-neutral-200 hover:bg-neutral-100/50 focus-within:bg-neutral-100/50 data-[state=selected]:bg-neutral-100"
      onClick={() => {
        if (!disabled) onSelect(response.id);
      }}
    >
      <TableCell className="max-w-sm whitespace-normal px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="hidden size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-500 sm:flex">
            <FileText className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p
              id={`response-title-${response.id}`}
              className="break-words font-medium leading-snug text-neutral-950"
            >
              {response.questionnaire.title}
            </p>
            {preview && (
              <p className="line-clamp-1 break-all text-xs leading-relaxed text-neutral-500">
                {preview}
              </p>
            )}
            <p className="text-xs text-neutral-500 lg:hidden">{author}</p>
            <div className="flex flex-wrap items-center gap-2 md:hidden">
              <span className="text-xs text-neutral-500">
                {response.created_date
                  ? formatDateTime(response.created_date, "DD MMM YYYY, h:mm A")
                  : t("unknown")}
              </span>
              {statusBadge}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2.5">
          <Avatar name={author} className="size-7 shrink-0 rounded-full" />
          <span className="max-w-40 truncate text-neutral-700" title={author}>
            {author}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="text-neutral-700">
          {response.created_date
            ? formatDateTime(response.created_date, "DD MMM YYYY")
            : t("unknown")}
        </p>
        {response.created_date && (
          <p className="mt-1 text-xs text-neutral-500">
            {formatDateTime(response.created_date, "h:mm A")}
          </p>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">{statusBadge}</TableCell>
      <TableCell className="px-3 text-right sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-12 gap-1 text-sm text-neutral-950 underline underline-offset-4 hover:bg-neutral-200/75 hover:text-neutral-950 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
          disabled={disabled}
          aria-describedby={`response-title-${response.id}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(response.id);
          }}
        >
          {t("view")}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
