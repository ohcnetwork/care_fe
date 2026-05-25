import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";

import { cn } from "@/lib/utils";
import { LocationCard } from "./LocationCard";

interface EditingState {
  locationId: string | null;
  timeConfig: {
    start: Date;
    end?: Date;
    status: LocationAssociationStatus;
  };
}

interface LocationCardWrapperProps {
  location: LocationAssociationRead;
  status: LocationAssociationStatus;
  children?: React.ReactNode;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  handleCancelEdit: () => void;
  handleConfirmEdit: (location: LocationAssociationRead) => void;
  isPending: boolean;
  title?: string;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  onComplete?: (location: LocationAssociationRead) => void;
  readOnly?: boolean;
}

export function LocationCardWrapper({
  location,
  status,
  children,
  editingState,
  setEditingState,
  handleCancelEdit,
  handleConfirmEdit,
  isPending,
  title,
  keepBedActive,
  onKeepBedActiveChange,
  onComplete,
  readOnly = false,
}: LocationCardWrapperProps) {
  const { t } = useTranslation();
  const isEditing = editingState.locationId === location.id;
  const isCompletingStay =
    isEditing && editingState.timeConfig.status === "completed";
  const showEndTimeField =
    status === "planned" || status === "completed" || isCompletingStay;

  useEffect(() => {
    if (isEditing && editingState.timeConfig.status === "active") {
      setEditingState((prev) => ({
        ...prev,
        timeConfig: {
          ...prev.timeConfig,
          end: undefined,
        },
      }));
    }
  }, [isEditing, editingState.timeConfig.status]);

  const validateDates = () => {
    if (!editingState.timeConfig.end) return true;

    if (editingState.timeConfig.end < editingState.timeConfig.start) {
      toast.error(t("end_time_before_start_error"));
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!validateDates()) return;
    handleConfirmEdit(location);
  };

  const getTitle = () => {
    if (title) return title;
    if (status === "active") return t("patient_current_location");
    if (status === "planned") return t("planned_location");
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{getTitle()}</h3>
          <div className="flex items-center gap-2 mb-1">
            {onComplete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onComplete(location)}
              >
                {t("complete_patient_stay")}
              </Button>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex gap-2 border border-gray-200 rounded-lg bg-gray-50 px-2 py-1",
            "flex-col justify-between",
          )}
        >
          <LocationCard
            locationHistory={location}
            status={status}
            keepBedActive={keepBedActive}
            onKeepBedActiveChange={onKeepBedActiveChange}
          />

          {isEditing ? (
            <div className="mt-4 pt-2 space-y-2">
              {isCompletingStay ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("end_time")}</Label>
                    <DateTimeInput
                      value={
                        editingState.timeConfig.end?.toISOString() ??
                        new Date().toISOString()
                      }
                      onDateChange={(newISO) =>
                        setEditingState((prev) => ({
                          ...prev,
                          timeConfig: {
                            ...prev.timeConfig,
                            end: newISO ? new Date(newISO) : undefined,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{t("start_time")}</Label>
                    <DateTimeInput
                      disabled={readOnly}
                      value={editingState.timeConfig.start?.toISOString()}
                      onDateChange={(newISO) =>
                        newISO !== undefined &&
                        setEditingState((prev) => ({
                          ...prev,
                          timeConfig: {
                            ...prev.timeConfig,
                            start: new Date(newISO),
                          },
                        }))
                      }
                    />
                  </div>
                  {showEndTimeField &&
                    editingState.timeConfig.status !== "active" && (
                      <div className="space-y-2">
                        <Label>{t("end_time")}</Label>
                        <DateTimeInput
                          disabled={readOnly}
                          value={editingState.timeConfig.end?.toISOString()}
                          onDateChange={(newISO) =>
                            setEditingState((prev) => ({
                              ...prev,
                              timeConfig: {
                                ...prev.timeConfig,
                                end: newISO ? new Date(newISO) : undefined,
                              },
                            }))
                          }
                        />
                      </div>
                    )}
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {isCompletingStay ? t("complete") : t("save")}
                </Button>
              </div>
            </div>
          ) : children ? (
            <div>{children}</div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
