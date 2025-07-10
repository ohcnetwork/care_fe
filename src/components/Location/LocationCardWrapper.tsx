import { ChevronLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

import { LocationHistory } from "@/types/emr/encounter/encounter";
import { LocationAssociationStatus } from "@/types/location/association";

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
  locationHistory: LocationHistory;
  status: LocationAssociationStatus;
  children?: React.ReactNode;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  handleCancelEdit: () => void;
  handleConfirmEdit: (location: LocationHistory) => void;
  isPending: boolean;
  showBackButton?: boolean;
  title?: string;
}

export function LocationCardWrapper({
  locationHistory,
  status,
  children,
  editingState,
  setEditingState,
  handleCancelEdit,
  handleConfirmEdit,
  isPending,
  showBackButton,
  title,
}: LocationCardWrapperProps) {
  const { t } = useTranslation();
  const isEditing = editingState.locationId === locationHistory.id;
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
    handleConfirmEdit(locationHistory);
  };

  return (
    <div className="space-y-4">
      {showBackButton && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
            <ChevronLeft className="size-4" />
          </Button>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg bg-gray-50 px-2 py-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-600">
            {status === "active"
              ? t("current_location")
              : t("planned_location")}
          </h3>
        </div>
        <LocationCard locationHistory={locationHistory} status={status} />

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
                    value={editingState.timeConfig.start?.toISOString()}
                    onDateChange={(newISO) =>
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
                data-cy="location-card-wrapper-save-button"
                variant="primary"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isCompletingStay ? t("complete") : t("save")}
              </Button>
            </div>
          </div>
        ) : (
          children && <div className="mt-2">{children}</div>
        )}
      </div>
    </div>
  );
}
