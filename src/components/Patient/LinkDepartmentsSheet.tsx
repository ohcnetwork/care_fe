import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building, Loader2, Trash2 } from "lucide-react";
import { JSX, useState } from "react";
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
import { BatchRequestBody } from "@/types/base/batch/batch";
import deviceApi from "@/types/device/deviceApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
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
  | typeof encounterApi.addOrganization
  | typeof encounterApi.removeOrganization
  | typeof locationApi.addOrganization
  | typeof locationApi.removeOrganization
  | typeof deviceApi.addOrganization
  | typeof deviceApi.removeOrganization;

interface EncounterPathParams {
  encounterId: string;
}

interface LocationPathParams {
  facilityId: string;
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
        ? encounterApi.addOrganization
        : encounterApi.removeOrganization,
      pathParams: { encounterId: entityId } as EncounterPathParams,
      queryKey: ["encounter", entityId],
    };
  } else if (entityType === "location") {
    return {
      route: isAdd
        ? locationApi.addOrganization
        : locationApi.removeOrganization,
      pathParams: {
        facilityId,
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
      data-cy="delete-organization-button"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4 text-destructive" />
      )}
    </Button>
  );
}

function buildOrgPath(
  org: FacilityOrganization | null | undefined,
): JSX.Element {
  if (!org) return <></>;

  const path: string[] = [];
  let currentOrg: FacilityOrganization | undefined = org;
  while (currentOrg?.name) {
    path.unshift(currentOrg.name);
    currentOrg = currentOrg.parent as FacilityOrganization | undefined;
  }
  return (
    <>
      {path.map((name, index) => (
        <span key={name}>
          {name}
          {index < path.length - 1 && (
            <ArrowRight className="inline size-4 mx-1" />
          )}
        </span>
      ))}
    </>
  );
}

export default function LinkDepartmentsSheet({
  entityType,
  entityId,
  currentOrganizations,
  facilityId,
  trigger,
  onUpdate,
}: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[] | null>(null);
  const queryClient = useQueryClient();

  const { mutate: submitBatch, isPending: isAdding } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      const invalidateQueries = getInvalidateQueries(entityType, entityId);
      queryClient.invalidateQueries({ queryKey: invalidateQueries });
      toast.success(t("organization_added_successfully"));
      setSelectedOrgs(null);
      setOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      try {
        const errorData = error.cause as {
          results?: {
            data?: { detail?: string; errors?: { msg: string }[] };
          }[];
        };

        const errorMessages = errorData?.results
          ?.flatMap(
            (result) =>
              result?.data?.errors?.map((err) => err.msg) || // Extract from `errors[].msg`
              (result?.data?.detail ? [result.data.detail] : []), // Extract from `data.detail`
          )
          .filter(Boolean); // Remove undefined/null values

        if (errorMessages?.length) {
          errorMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error("An unexpected error occurred");
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const handleAddOrganizations = () => {
    if (!selectedOrgs?.length) return;
    const { route, pathParams } = getMutationParams(
      entityType,
      entityId,
      facilityId,
      true,
    );

    const batchRequest: BatchRequestBody = {
      requests: selectedOrgs.map((orgId) => {
        const resolvedPath = route.path
          .replace("{facilityId}", facilityId)
          .replace("{id}", entityId)
          .replace("{encounterId}", entityId);

        return {
          url: resolvedPath,
          method: "POST",
          reference_id: `Add Organization ${orgId}`,
          body: {
            ...(entityType === "device"
              ? {
                  managing_organization: orgId,
                }
              : {
                  organization: orgId,
                }),
          },
          pathParams,
        };
      }),
    };

    submitBatch(batchRequest);
  };

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
      <SheetContent className="w-full overflow-y-scroll sm:max-w-3xl space-y-4">
        <SheetHeader>
          <SheetTitle>
            <h4 className="font-semibold">
              {t("manage_organization", {
                count: entityType === "device" ? 1 : 0,
              })}
            </h4>
          </SheetTitle>
          <SheetDescription>
            <span className="size-2.5 text-gray-500">
              {t("manage_organization_description", {
                entityType,
                count: entityType === "device" ? 1 : 0,
              })}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="scroll-auto">
          {currentOrganizations.length > 0 ? (
            <div className="space-y-2">
              <span className="size-2.5 font-semibold">
                {t("current_organization", {
                  count: entityType === "device" ? 1 : 0,
                })}
              </span>
              <div className=" space-y-2 mt-2">
                {currentOrganizations.map((org) => {
                  const orgPath = buildOrgPath(org);
                  return (
                    <div
                      key={org.id}
                      className="flex items-center justify-between rounded-md bg-gray-100 border border-gray-300 p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Building className="size-4 text-gray-700" />
                        <div className="flex flex-col">
                          <span
                            className="font-bold"
                            data-cy="link-organisation-name"
                          >
                            {orgPath}
                          </span>
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
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center w-full bg-gray-50 py-24 px-12 gap-4 mt-4 border rounded-md">
              <Building className="size-4 shrink-0" />
              <p className="font-medium text-center">
                {t("no_organization_added_yet", {
                  count: entityType === "device" ? 1 : 0,
                })}
              </p>
              <p className="text-sm ml-6 text-center">
                {t("add_organizations_for_organization")}
              </p>
            </div>
          )}
          <div className="mt-8 space-y-0.5">
            <div className="border-t-1 border-dotted border-gray-500"></div>
            <div className="border-t-1 border-dotted border-gray-500"></div>
            <div className="border-t-1 border-dotted border-gray-500"></div>
          </div>
          <div className="h-full flex flex-col mt-4">
            <div className="mt-4">
              <FacilityOrganizationSelector
                facilityId={facilityId}
                value={selectedOrgs}
                onChange={setSelectedOrgs}
                currentOrganizations={currentOrganizations}
                singleSelection={entityType === "device"}
              />
              <div className="flex justify-end mt-4">
                <Button
                  className="w-fit"
                  data-cy="add-organization"
                  onClick={handleAddOrganizations}
                  disabled={!selectedOrgs?.length || isAdding}
                >
                  {isAdding && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t("add_organization", {
                    count: entityType === "device" ? 1 : 0,
                  })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
