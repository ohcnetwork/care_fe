import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { navigate } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

export const FormDialog = ({
  subjectType,
  trigger,
}: {
  subjectType: string;
  trigger?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  const { data: questionnaires, isLoading } = useQuery({
    queryKey: ["questionnaires", search, subjectType],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        limit: 15,
        title: search,
        status: "active",
        subject_type: subjectType,
      },
    }),
  });

  // Fetch favorites - use main list endpoint with favorite_list query param
  const { data: favoritesResponse } = useQuery({
    queryKey: ["questionnaire-favorites", facilityId],
    queryFn: query(questionnaireApi.list, {
      queryParams: {
        favorite_list: "favorites_form",
        silent: true,
        status: "active",
        limit: careConfig.maxFormDialogFavorites,
      },
    }),
  });

  const favorites = useMemo(() => {
    if (!favoritesResponse?.results) return [];
    return favoritesResponse.results;
  }, [favoritesResponse]);

  const addFavoriteMutation = useMutation({
    mutationFn: (id: string) =>
      mutate(questionnaireApi.addFavorite, {
        pathParams: { id },
      })({ favorite_list: "favorites_form" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaire-favorites", facilityId],
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id: string) =>
      mutate(questionnaireApi.removeFavorite, {
        pathParams: { id },
      })({ favorite_list: "favorites_form" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["questionnaire-favorites", facilityId],
      });
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isFavorited = favorites.some((f) => f.id === id);
    if (isFavorited) {
      removeFavoriteMutation.mutate(id);
    } else {
      if (favorites.length >= careConfig.maxFormDialogFavorites) {
        toast.error(
          t("max_favorites_reached", {
            count: careConfig.maxFormDialogFavorites,
          }),
        );
        return;
      }
      addFavoriteMutation.mutate(id);
    }
  };

  const allQuestionnaires = questionnaires?.results ?? [];

  const questionnaireIds = new Set([...allQuestionnaires.map((q) => q.id)]);

  const questionnaireList = [...questionnaireIds].map((id) =>
    allQuestionnaires.find((q) => q.id === id)!,
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSearch("");
    }
    setOpen(open);
  };

  return (
    <>
      <div className="flex" onClick={() => handleOpenChange(true)}>
        {trigger}
      </div>
      <CommandDialog
        className="md:max-w-2xl"
        open={open}
        onOpenChange={handleOpenChange}
      >
        <div className="border-b border-gray-100 shadow-xs">
          <CommandInput
            placeholder={t("search_forms")}
            className="border-none focus:ring-0"
            value={search}
            onValueChange={setSearch}
          />
        </div>
        <CommandList className="max-h-[80vh] w-full">
          {isLoading ? (
            <CardListSkeleton count={10} />
          ) : questionnaireList.length === 0 ? (
            <CommandEmpty>{t("no_results")}</CommandEmpty>
          ) : (
            questionnaireList.map((questionnaire) => (
              <div key={questionnaire.id}>
                <CommandGroup className="px-2">
                  <CommandItem
                    key={questionnaire.slug}
                    value={`${questionnaire.slug} - ${questionnaire.title}`}
                    className="rounded-md cursor-pointer hover:bg-gray-100 flex justify-between aria-selected:bg-gray-100"
                    onSelect={() => {
                      navigate(
                        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaire.id}`,
                      );
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1">{questionnaire.title}</span>
                    <Button
                      onClick={(e) => handleToggleFavorite(e, questionnaire.id)}
                      aria-label={
                        favorites.some((f) => f.id === questionnaire.id)
                          ? t("remove_from_favorites")
                          : t("add_to_favorites")
                      }
                      variant="ghost"
                      size="icon"
                    >
                      <Star
                        className={cn(
                          "size-4",
                          favorites.some((f) => f.id === questionnaire.id) &&
                            "fill-current",
                        )}
                      />
                    </Button>
                  </CommandItem>
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
