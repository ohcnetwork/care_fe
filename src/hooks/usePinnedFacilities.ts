import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import useUserPreferences from "@/hooks/useUserPreferences";

import { PinnedFacilitiesPreferences } from "@/types/user/userPreferences";

/** Pinned facility ids in pin order, saved to the user's account preferences. */
export function usePinnedFacilityIds() {
  const { t } = useTranslation();
  const { preferences, setPreference, isPending } = useUserPreferences();
  const saved = (
    preferences.pinned_facilities as PinnedFacilitiesPreferences | undefined
  )?.facility_ids;
  const pinnedIds = Array.isArray(saved) ? saved : [];

  const togglePin = (facility: { id: string; name: string }) => {
    // Each save replaces the whole preference, so one must land before the next.
    if (isPending) return;
    const isPinned = pinnedIds.includes(facility.id);
    setPreference(
      "pinned_facilities",
      {
        facility_ids: isPinned
          ? pinnedIds.filter((id) => id !== facility.id)
          : [...pinnedIds, facility.id],
      },
      {
        onSuccess: () =>
          toast.success(
            t(isPinned ? "facility_unpinned" : "facility_pinned", {
              name: facility.name,
            }),
          ),
      },
    );
  };

  return { pinnedIds, togglePin };
}
