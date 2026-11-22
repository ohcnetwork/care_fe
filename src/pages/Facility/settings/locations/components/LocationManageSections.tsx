import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Tags, Trash } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import LinkDepartmentsSheet from "@/components/Patient/LinkDepartmentsSheet";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { TagBadges } from "@/components/Tags/TagBadges";

import query from "@/Utils/request/query";
import { useLocationActions } from "@/pages/Facility/settings/locations/useLocationActions";
import locationApi from "@/types/location/locationApi";

interface LocationManageSectionsProps {
  facilityId: string;
  locationId: string;
  onDeleted: () => void;
}

/** Keeps a row's icon on its title line when the values below wrap. */
const rowIcon = "translate-y-0.5 self-start text-muted-foreground";

/**
 * What can be changed about an existing location besides its own fields:
 * its tags, the departments that manage it, and removing it. The same for a
 * building, a ward or a bed.
 */
export function LocationManageSections({
  facilityId,
  locationId,
  onDeleted,
}: LocationManageSectionsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { remove, refresh } = useLocationActions(facilityId);

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });
  const { data: organizations } = useQuery({
    queryKey: ["location", locationId, "organizations"],
    queryFn: query(locationApi.getOrganizations, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  if (!location) return null;

  const refreshAll = () => {
    refresh();
    queryClient.invalidateQueries({
      queryKey: ["location", locationId, "organizations"],
    });
  };
  // A location that still holds something, or has a patient on it, stays.
  const canDelete = !location.has_children && !location.current_encounter;

  return (
    <div className="space-y-4">
      {/* Both save as soon as they change, apart from the fields above. */}
      <div className="rounded-lg border border-border">
        <Item className="items-start rounded-none border-b-border">
          <ItemMedia variant="icon" className={rowIcon}>
            <Tags aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t("tags_proper")}</ItemTitle>
            {location.tags?.length ? (
              <TagBadges
                tags={location.tags}
                size="sm"
                hierarchyDisplay
                className="gap-1.5"
              />
            ) : (
              <ItemDescription>{t("no_tags_assigned")}</ItemDescription>
            )}
          </ItemContent>
          <ItemActions>
            <TagAssignmentSheet
              entityType="location"
              entityId={location.id}
              facilityId={facilityId}
              currentTags={location.tags ?? []}
              onUpdate={refreshAll}
              trigger={
                <Button variant="outline" size="sm">
                  {t(location.tags?.length ? "manage_tags" : "add_tags")}
                </Button>
              }
            />
          </ItemActions>
        </Item>

        <Item className="items-start">
          <ItemMedia variant="icon" className={rowIcon}>
            <Building2 aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t("departments")}</ItemTitle>
            {organizations?.results.length ? (
              <div className="flex flex-wrap gap-1.5">
                {organizations.results.map((organization) => (
                  <Badge key={organization.id} variant="secondary" size="sm">
                    {organization.name}
                  </Badge>
                ))}
              </div>
            ) : (
              organizations && (
                <ItemDescription>
                  {t("no_departments_assigned")}
                </ItemDescription>
              )
            )}
          </ItemContent>
          {organizations && (
            <ItemActions>
              <LinkDepartmentsSheet
                entityType="location"
                entityId={locationId}
                currentOrganizations={organizations.results}
                facilityId={facilityId}
                onUpdate={refreshAll}
                trigger={
                  <Button variant="outline" size="sm">
                    {t("manage_organization", { count: 0 })}
                  </Button>
                }
              />
            </ItemActions>
          )}
        </Item>
      </div>

      {canDelete && (
        <Item variant="outline" className="rounded-lg">
          <ItemContent>
            <ItemTitle>{t("delete_this_location")}</ItemTitle>
            <ItemDescription>
              {t("this_action_cannot_be_undone")}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash aria-hidden="true" />
              {t("delete")}
            </Button>
          </ItemActions>
          <ConfirmActionDialog
            open={confirmingDelete}
            onOpenChange={setConfirmingDelete}
            title={t("remove_name", { name: location.name })}
            description={t("are_you_sure_want_to_delete", {
              name: location.name,
            })}
            confirmText={t("remove")}
            onConfirm={() => remove(location, { onSuccess: onDeleted })}
            variant="destructive"
          />
        </Item>
      )}
    </div>
  );
}
