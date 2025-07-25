import { BadgeInfo, ExternalLink, File, X } from "lucide-react";
import { navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";

import { formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

type ColumnConfig<T> = {
  key: string;
  render: (item: T) => React.ReactNode;
  className?: string;
};

interface RowProps<T> {
  item: T;
  patientId: string;
  facilityId?: string;
  columns: ColumnConfig<T>[];
  encounterId: string;
  note?: string;
  createdBy: UserBase;
}

export function GenericRow<T>({
  item,
  patientId,
  facilityId,
  columns,
  encounterId,
  note,
  createdBy,
}: RowProps<T>) {
  const [showNote, setShowNote] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {columns.map((col, index) => (
        <div
          key={col.key}
          className={cn(
            "px-2 py-1 border-t border-b border-gray-200",
            index === 0 && "border-l rounded-l",
            index !== 0 && "border-l",
            index === columns.length - 1 && "border-r",
            col.className,
          )}
        >
          {col.render(item)}
        </div>
      ))}

      <div className="flex items-center justify-center border border-gray-200 border-l-0 rounded-r-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="link"
              className="text-gray-500 hover:text-gray-700"
            >
              <BadgeInfo size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {note && (
              <DropdownMenuItem
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-2 px-3 py-2 font-semibold"
              >
                <File className="size-4" />
                <span>{showNote ? t("hide_note") : t("see_note")}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => {
                navigate(
                  facilityId
                    ? `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`
                    : `/organization/organizationId/patient/${patientId}/encounter/${encounterId}/updates`,
                );
              }}
              className="flex items-center gap-2 px-3 py-2 font-semibold"
            >
              <ExternalLink className="size-4" />
              <span>{t("go_to_encounter")}</span>
            </DropdownMenuItem>

            <div className="my-2 border-t border-dashed border-gray-300" />

            <div className="p-1 text-sm">
              <div className="text-gray-500">{t("reported_by")}:</div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar
                  name={formatName(createdBy)}
                  className="size-6"
                  imageUrl={createdBy.profile_picture_url}
                />
                <span className="font-semibold text-gray-900">
                  {formatName(createdBy)}
                </span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {showNote && note && (
        <div className="col-span-full relative border border-gray-200 p-2 pt-4 bg-gray-50 rounded -mt-2.5 rounded-t-none">
          <div className="font-semibold text-gray-800">{t("note")}:</div>

          <Button
            variant={null}
            className="absolute top-2 right-4 flex items-center gap-1 p-0 text-sm"
            onClick={() => setShowNote(false)}
          >
            <X size={14} />
            <span className="underline">{t("hide_note")}</span>
          </Button>

          <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8 max-w-full break-words mt-2">
            {note}
          </p>
        </div>
      )}
    </>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full rounded-lg bg-muted/50 py-5 flex flex-col items-center justify-center text-center space-y-4 bg-gray-100">
      <div className="bg-white shadow-sm rounded-lg p-4 grid grid-cols-2 gap-2 w-40">
        {/* Left column */}
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />

        {/* Right column */}
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{t(title)}</h3>
        <p className="text-sm text-gray-600">{t(description)}</p>
      </div>
    </div>
  );
}
