import { format } from "date-fns";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Avatar } from "@/components/Common/Avatar";

import {
  SPECIMEN_DISCARD_REASONS,
  SPECIMEN_STATUS_COLORS,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import { formatName } from "@/Utils/utils";

interface CollectedSpecimenHeaderProps {
  collectedSpecimen: SpecimenRead;
  isOpen: boolean;
  disableEdit: boolean;
  isDiscarding: boolean;
  onDiscard: (status: SpecimenStatus) => void;
}

export function CollectedSpecimenHeader({
  collectedSpecimen,
  isOpen,
  disableEdit,
  isDiscarding,
  onDiscard,
}: CollectedSpecimenHeaderProps) {
  const { t } = useTranslation();
  const [selectedDiscardReason, setSelectedDiscardReason] =
    useState<SpecimenStatus | null>(null);
  return (
    <div className="flex justify-between items-start overflow-x-auto">
      <div className="space-y-1.5">
        <span className="text-sm text-gray-600">
          {t("collected_specimen")}:
        </span>
        <CardTitle className="text-base font-semibold">
          {collectedSpecimen.specimen_definition.title}
        </CardTitle>
        {/* Mimic original UI structure */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-700 mt-4">
          {collectedSpecimen.specimen_definition?.type_tested?.container?.cap
            ?.display && (
            <span className="flex flex-col">
              <span className="text-sm text-gray-600 flex items-center">
                {t("container_cap")}:
              </span>
              <span className="text-base capitalize">
                {
                  collectedSpecimen.specimen_definition.type_tested.container
                    .cap.display
                }
              </span>
            </span>
          )}
          {collectedSpecimen.specimen_type?.display && (
            <span className="flex flex-col">
              <span className="text-sm text-gray-600 flex items-center">
                {t("specimen")}:
              </span>
              <span className="text-base font-semibold capitalize">
                {collectedSpecimen.specimen_type.display}
              </span>
            </span>
          )}
          {collectedSpecimen.collection?.collector_object && (
            <span className="flex flex-col">
              <span className="text-sm text-gray-600 flex items-center">
                {t("collected_by")}:
              </span>
              <div className="flex items-center gap-2">
                <Avatar
                  imageUrl={
                    collectedSpecimen.collection.collector_object
                      .profile_picture_url
                  }
                  name={formatName(
                    collectedSpecimen.collection.collector_object,
                    true,
                  )}
                  className="size-5 rounded-full"
                />
                <span className="text-base">
                  {collectedSpecimen.collection.collector_object
                    ? formatName(collectedSpecimen.collection.collector_object)
                    : "--"}
                </span>
              </div>
            </span>
          )}
          {collectedSpecimen.collection?.collected_date_time && (
            <span className="flex flex-col">
              <span className="text-sm text-gray-600">
                {t("collected_at")}:
              </span>
              <time dateTime={collectedSpecimen.collection.collected_date_time}>
                {format(
                  new Date(collectedSpecimen.collection.collected_date_time),
                  "MMM d, yyyy, h:mm a",
                )}
              </time>
            </span>
          )}
        </div>
      </div>

      {/* Status Badge on Right */}
      <div className="flex items-center flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge
            variant={SPECIMEN_STATUS_COLORS[collectedSpecimen.status]}
            className="capitalize font-medium h-fit"
          >
            {collectedSpecimen.status === SpecimenStatus.available && (
              <CheckCircle2 className="size-4 mr-1" />
            )}
            {collectedSpecimen.status?.replace(/_/g, " ") || t("unknown")}
          </Badge>
          {isOpen ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-10 border border-gray-400 bg-white shadow p-4"
            >
              <ChevronsDownUp className="size-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-10 border border-gray-400 bg-white shadow p-4"
            >
              <ChevronsUpDown className="size-5" />
            </Button>
          )}
        </div>
        <div className="flex self-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    disabled={disableEdit}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {t("discard")}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("specimen_discard_dialog_description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <RadioGroup
                    defaultValue=""
                    onValueChange={(value: SpecimenStatus) =>
                      setSelectedDiscardReason(value)
                    }
                    className="space-y-3 justify-center items-center"
                  >
                    {SPECIMEN_DISCARD_REASONS.map((reason) => (
                      <div
                        key={reason.status}
                        className="flex items-start space-x-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50"
                      >
                        <RadioGroupItem
                          value={reason.status}
                          id={reason.status}
                        />
                        <Label
                          htmlFor={reason.status}
                          className="flex flex-col gap-0.5 px-1"
                        >
                          <span className="font-medium text-sm text-gray-950">
                            {reason.label}
                          </span>
                          <span className="text-sm text-gray-500 font-normal">
                            {reason.description}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDiscarding}>
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        selectedDiscardReason &&
                        onDiscard(selectedDiscardReason)
                      }
                      disabled={isDiscarding || !selectedDiscardReason}
                    >
                      {isDiscarding ? t("discarding") : t("discard")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
