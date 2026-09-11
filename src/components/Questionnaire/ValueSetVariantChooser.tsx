import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ValueSetRead, ValueSetStatus } from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface ValueSetVariantChooserProps {
  slug: string;
  facilityId: string;
  /** What `slug` currently resolves to for this user (from expand_slug). */
  current?: ValueSetRead;
}

interface Variant {
  valueset: ValueSetRead;
  scope: "instance" | "facility";
}

/**
 * Lets a user pick which value set a slug searches inside this facility:
 * the instance set, or one of the facility's own sets with that slug (an
 * override created under facility settings). The choice is saved as the
 * user's preference and applies wherever the slug is resolved. Renders
 * nothing while there is only one candidate.
 */
export function ValueSetVariantChooser({
  slug,
  facilityId,
  current,
}: ValueSetVariantChooserProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // The list endpoint has no slug filter, so the facility's (small) set of
  // value sets is fetched once and narrowed here.
  const facilityQuery = useQuery({
    queryKey: ["valuesets", "variants", facilityId],
    queryFn: query(valueSetApi.list, {
      queryParams: {
        facility: facilityId,
        status: ValueSetStatus.ACTIVE,
        limit: 100,
      },
      silent: true,
    }),
    staleTime: 5 * 60 * 1000,
  });
  const facilityVariants = (facilityQuery.data?.results ?? []).filter(
    (valueset) => valueset.slug === slug,
  );

  // Resolving without a facility yields the instance set. It hits the
  // terminology server, so it only runs once the menu is opened.
  const instanceQuery = useQuery({
    queryKey: ["valueset", "instance-variant", slug],
    queryFn: query(valueSetApi.expandSlug, {
      body: { slug, search: "", count: 1 },
      silent: true,
    }),
    enabled: open,
    staleTime: Infinity,
  });

  const { mutate: setPreference, isPending } = useMutation({
    mutationFn: (valuesetId: string) =>
      mutate(valueSetApi.setSlugPreference, {
        pathParams: { id: valuesetId },
      })({ slug, facility: facilityId }),
    onSuccess: () => {
      toast.success(t("valueset_preference_saved"));
      // Every slug-addressed read now points at a different set: the
      // popover's own search/resolve/favourites/recents, and the inline
      // bounded expansions the renderer draws unit chips from.
      queryClient.invalidateQueries({ queryKey: ["valueset"] });
      queryClient.invalidateQueries({ queryKey: ["qv2-valueset-expansion"] });
      setOpen(false);
    },
  });

  if (facilityVariants.length === 0) {
    return null;
  }

  const variants: Variant[] = [
    ...(instanceQuery.data
      ? [{ valueset: instanceQuery.data.valueset, scope: "instance" as const }]
      : []),
    ...facilityVariants.map((valueset) => ({
      valueset,
      scope: "facility" as const,
    })),
  ];

  return (
    <div
      className="flex items-center justify-between gap-2 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-600"
      // This footer sits inside cmdk's <Command>, whose root key handler
      // claims Enter and the arrow keys for the result list with no check
      // on the event target — without this, Enter on "Change" is cancelled
      // and picks the highlighted code instead. The chooser's own popover
      // is portaled out, so its keys never reach here.
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="truncate">
        {t("valueset_using", { name: current?.name ?? slug })}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            {t("change")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-1">
          <p className="px-2 py-1.5 text-xs font-medium text-gray-500">
            {t("valueset_choose_variant")}
          </p>
          <div role="listbox" aria-label={t("valueset_choose_variant")}>
            {variants.map(({ valueset, scope }) => {
              const selected = valueset.id === current?.id;
              return (
                <button
                  key={valueset.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={isPending}
                  onClick={() => setPreference(valueset.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-gray-100 disabled:opacity-50",
                    selected && "font-medium",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{valueset.name}</span>
                    <span className="block text-xs text-gray-500">
                      {t(scope === "facility" ? "this_facility" : "instance")}
                    </span>
                  </span>
                  {selected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
            {instanceQuery.isLoading && (
              <p className="px-2 py-1.5 text-xs text-gray-500">
                {t("loading")}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
