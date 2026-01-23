import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Link } from "raviger";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

export const FavoriteFormsQuickActions = (
  props: React.ComponentProps<"div">,
) => {
  const {
    selectedEncounterId: encounterId,
    patientId,
    facilityId,
  } = useEncounter();

  const { data: favoritesResponse, isLoading } = useQuery({
    queryKey: ["questionnaire-favorites", facilityId],
    queryFn: query(questionnaireApi.list, {
      queryParams: {
        favorite_list: "favorites_form",
      },
    }),
  });

  const favorites = useMemo(() => {
    if (!favoritesResponse?.results) return [];
    return favoritesResponse.results;
  }, [favoritesResponse]);

  if (isLoading) {
    return (
      <div {...props} className={cn("flex flex-col gap-2", props.className)}>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div {...props} className={cn("flex flex-col ", props.className)}>
      <div className="flex flex-wrap gap-2">
        {favorites.map((form) => (
          <Link
            key={form.id}
            href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${form.slug}`}
            className="inline-flex w-auto items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-gray-700"
          >
            <FileText className="size-3.5 text-gray-500" />
            <span>{form.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
