import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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
import FacilityOrganizationSelector from "@/pages/FacilityOrganization/components/FacilityOrganizationSelector";
import { Encounter } from "@/types/emr/encounter";

interface Props {
  encounter: Encounter;
  facilityId: string;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
}

export default function ManageEncounterOrganizations({
  encounter,
  facilityId,
  trigger,
  onUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const queryClient = useQueryClient();

  const { mutate: addOrganization, isPending: isAdding } = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(routes.encounter.addOrganization, {
        pathParams: { encounterId: encounter.id },
        body: { organization: organizationId },
      })({ organization: organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
      toast.success("Organization added successfully");
      setSelectedOrg("");
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

  const { mutate: removeOrganization, isPending: isRemoving } = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(routes.encounter.removeOrganization, {
        pathParams: { encounterId: encounter.id },
        body: { organization: organizationId },
      })({ organization: organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounter", encounter.id] });
      toast.success("Organization removed successfully");
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
            <Building className="mr-2 h-4 w-4" />
            Manage Organizations
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Manage Organizations</SheetTitle>
          <SheetDescription>
            Add or remove organizations from this encounter
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Add Organization</h3>
              <FacilityOrganizationSelector
                facilityId={facilityId}
                value={selectedOrg}
                onChange={setSelectedOrg}
              />

              <Button
                className="w-full"
                onClick={() => selectedOrg && addOrganization(selectedOrg)}
                disabled={!selectedOrg || isAdding}
              >
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Organization
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Current Organizations</h3>
              <div className="space-y-2">
                {encounter.organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-400" />
                      <div className="flex flex-col">
                        <span className="font-medium">{org.name}</span>
                        {org.description && (
                          <span className="text-xs text-muted-foreground">
                            {org.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOrganization(org.id)}
                      disabled={isRemoving}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ))}
                {encounter.organizations.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No organizations added yet
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
