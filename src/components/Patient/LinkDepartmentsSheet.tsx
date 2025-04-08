import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import deviceApi from "@/types/device/deviceApi";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import locationApi from "@/types/location/locationApi";

interface Props {
  entityType: "encounter" | "location" | "device";
  entityId: string;
  currentOrganizations: FacilityOrganization[];
  facilityId: string;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
  orgType?: "organization" | "managing_organization";
}

type MutationRoute =
  | typeof routes.encounter.addOrganization
  | typeof routes.encounter.removeOrganization
  | typeof locationApi.addOrganization
  | typeof locationApi.removeOrganization
  | typeof deviceApi.addOrganization
  | typeof deviceApi.removeOrganization;

interface EncounterPathParams {
  encounterId: string;
}

interface LocationPathParams {
  facility_id: string;
  id: string;
}

interface DevicePathParams {
  facilityId: string;
  id: string;
}

type PathParams = EncounterPathParams | LocationPathParams | DevicePathParams;

interface MutationParams {
  route: MutationRoute;
  pathParams: PathParams;
  queryKey: string[];
}

function getMutationParams(
  entityType: "encounter" | "location" | "device",
  entityId: string,
  facilityId: string,
  isAdd: boolean,
): MutationParams {
  if (entityType === "encounter") {
    return {
      route: isAdd
        ? routes.encounter.addOrganization
        : routes.encounter.removeOrganization,
      pathParams: { encounterId: entityId } as EncounterPathParams,
      queryKey: ["encounter", entityId],
    };
  } else if (entityType === "location") {
    return {
      route: isAdd
        ? locationApi.addOrganization
        : locationApi.removeOrganization,
      pathParams: {
        facility_id: facilityId,
        id: entityId,
      } as LocationPathParams,
      queryKey: ["location", entityId],
    };
  }

  return {
    route: isAdd ? deviceApi.addOrganization : deviceApi.removeOrganization,
    pathParams: {
      facilityId,
      id: entityId,
    } as DevicePathParams,
    queryKey: ["device", entityId],
  };
}

function getInvalidateQueries(
  entityType: "encounter" | "location" | "device",
  entityId: string,
) {
  if (entityType === "encounter") {
    return ["encounter", entityId];
  } else if (entityType === "location") {
    return ["location", entityId, "organizations"];
  }
  return ["device", entityId, "organizations"];
}

function DeleteOrganizationButton({
  organizationId,
  entityType,
  entityId,
  facilityId,
  onSuccess,
}: {
  organizationId: string;
  entityType: "encounter" | "location" | "device";
  entityId: string;
  facilityId: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const { mutate: removeOrganization, isPending } = useMutation({
    mutationFn: (organizationId: string) => {
      const { route, pathParams } = getMutationParams(
        entityType,
        entityId,
        facilityId,
        false,
      );
      return mutate(route, {
        pathParams,
        body: { organization: organizationId },
      })({ organization: organizationId });
    },
    onSuccess: () => {
      const { queryKey } = getMutationParams(
        entityType,
        entityId,
        facilityId,
        false,
      );
      queryClient.invalidateQueries({ queryKey });
      toast.success(t("organization_removed_successfully"));
      onSuccess?.();
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => removeOrganization(organizationId)}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4 text-destructive" />
      )}
    </Button>
  );
}

export default function LinkDepartmentsSheet({
  entityType,
  entityId,
  currentOrganizations,
  facilityId,
  trigger,
  onUpdate,
  orgType = "organization",
}: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { route, pathParams } = getMutationParams(
    entityType,
    entityId,
    facilityId,
    true,
  );

  const { mutate: addOrganization, isPending: isAdding } = useMutation({
    mutationFn: mutate(route, {
      pathParams,
    }),
    onSuccess: () => {
      const invalidateQueries = getInvalidateQueries(entityType, entityId);
      queryClient.invalidateQueries({ queryKey: invalidateQueries });
      toast.success(t("organization_added_successfully"));
      setSelectedOrg(null);
      setOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Building className="mr-2 size-4" />
            {t("manage_organization", {
              count: entityType === "device" ? 1 : 0,
            })}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t("manage_organization", {
              count: entityType === "device" ? 1 : 0,
            })}
          </SheetTitle>
          <SheetDescription>
            {t("manage_organization_description", {
              entityType,
              count: entityType === "device" ? 1 : 0,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-4">
              <FacilityOrganizationSelector
                facilityId={facilityId}
                value={selectedOrg}
                onChange={setSelectedOrg}
              />

              <Button
                className="w-full"
                onClick={() =>
                  selectedOrg &&
                  addOrganization({ [orgType]: selectedOrg } as Record<
                    typeof orgType,
                    string
                  >)
                }
                disabled={!selectedOrg || isAdding}
              >
                {isAdding && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("add_organization", {
                  count: entityType === "device" ? 1 : 0,
                })}
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">
                {t("current_organization", {
                  count: entityType === "device" ? 1 : 0,
                })}
              </h3>
              <div className="space-y-2">
                {currentOrganizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="size-4 text-blue-400" />
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        {org.description && (
                          <span className="text-xs text-gray-500">
                            {org.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <DeleteOrganizationButton
                      organizationId={org.id}
                      entityType={entityType}
                      entityId={entityId}
                      facilityId={facilityId}
                      onSuccess={onUpdate}
                    />
                  </div>
                ))}
                {currentOrganizations.length === 0 && (
                  <p className="text-sm text-gray-500">
                    {t("no_organization_added_yet", {
                      count: entityType === "device" ? 1 : 0,
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
