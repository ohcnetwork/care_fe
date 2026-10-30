import {
  CheckIcon,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  return (
    <div className="w-full space-y-3">
      <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <div className="min-w-0 space-y-1">
          <span className="text-sm text-muted-foreground">
            {t("collected_specimen")}:
          </span>
          <CardTitle className="text-base font-semibold">
            {collectedSpecimen.specimen_definition.title}
          </CardTitle>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={SPECIMEN_STATUS_COLORS[collectedSpecimen.status]}
            className="h-fit font-medium capitalize hidden sm:flex"
          >
            {collectedSpecimen.status === SpecimenStatus.available && (
              <CheckIcon className="size-3" />
            )}
            {collectedSpecimen.status === SpecimenStatus.available
              ? t("collected")
              : t(collectedSpecimen.status) || t("unknown")}
          </Badge>

          {isOpen ? (
            <ChevronsDownUp className="size-4 mx-2" />
          ) : (
            <ChevronsUpDown className="size-4 mx-2" />
          )}
        </div>
      </CollapsibleTrigger>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
        {collectedSpecimen.specimen_definition?.type_tested?.container?.cap
          ?.display && (
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center">
              {t("container_cap")}:
            </span>
            <span className="text-base capitalize">
              {
                collectedSpecimen.specimen_definition.type_tested.container.cap
                  .display
              }
            </span>
          </span>
        )}
        {collectedSpecimen.specimen_type?.display && (
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center">
              {t("specimen")}:
            </span>
            <span className="text-base font-semibold capitalize">
              {collectedSpecimen.specimen_type.display}
            </span>
          </span>
        )}
        {collectedSpecimen.collection?.collector_object && (
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground flex items-center">
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
                {formatName(collectedSpecimen.collection.collector_object)}
              </span>
            </div>
          </span>
        )}
        <span className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {t("processing_steps")}:
          </span>
          <Badge
            variant={
              collectedSpecimen.processing.length > 0 ? "green" : "secondary"
            }
            className="w-fit"
          >
            {collectedSpecimen.processing.length} {t("done")}
          </Badge>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              aria-label={t("actions")}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setIsDiscardOpen(true);
              }}
              disabled={disableEdit}
            >
              <Trash2 className="size-4 mr-2" />
              {t("discard")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
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
                  className="flex items-start space-x-2 p-2 rounded-md border border-border hover:bg-soft-background"
                >
                  <RadioGroupItem value={reason.status} id={reason.status} />
                  <Label
                    htmlFor={reason.status}
                    className="flex flex-col gap-0.5 px-1"
                  >
                    <span className="font-medium text-sm text-foreground">
                      {reason.label}
                    </span>
                    <span className="text-sm text-muted-foreground font-normal">
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
                  selectedDiscardReason && onDiscard(selectedDiscardReason)
                }
                disabled={isDiscarding || !selectedDiscardReason}
              >
                {isDiscarding ? t("discarding") : t("discard")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
