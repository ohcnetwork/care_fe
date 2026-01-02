import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Settings } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  EncounterListRead,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import mutate from "@/Utils/request/mutate";

export interface EncounterActionsProps {
  encounter: EncounterRead | EncounterListRead;
}

export function EncounterActions({ encounter }: EncounterActionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const isCompleted = encounter.status === EncounterStatus.COMPLETED;

  const { mutate: restartEncounter, isPending: isRestarting } = useMutation({
    mutationFn: mutate(encounterApi.restart, {
      pathParams: { id: encounter.id },
    }),
    onSuccess: () => {
      toast.success(t("encounter_restarted_successfully"));
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
      navigate(
        `/facility/${encounter.facility.id}/patient/${encounter.patient.id}/encounter/${encounter.id}/updates`,
      );
    },
    onError: () => {
      toast.error(t("failed_to_restart_encounter"));
    },
  });

  const handleRestart = () => {
    restartEncounter({});
  };

  // Only show actions dropdown if there are any actions available
  if (!isCompleted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-gray-500 hover:text-gray-700"
          disabled={isRestarting}
        >
          <Settings className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleRestart}
          disabled={isRestarting}
          className="cursor-pointer"
        >
          <RotateCcw className="mr-2 size-4" />
          {t("restart_encounter")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
