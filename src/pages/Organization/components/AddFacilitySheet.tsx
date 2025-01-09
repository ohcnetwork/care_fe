import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import CreateFacilityForm from "@/components/Facility/FacilityForm";

interface Props {
  organizationId: string;
  facilityId?: string;
}

export default function AddFacilitySheet({
  organizationId,
  facilityId,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {facilityId ? (
          <Button
            variant="link"
            data-cy="edit-facility-button"
            className="text-primary-400 text-sm"
          >
            <CareIcon icon="l-edit" className="mr-1 h-4 w-4" />
            Edit Facility
          </Button>
        ) : (
          <Button variant="outline" data-cy="add-facility-button">
            <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {facilityId ? "Edit Facility" : "Add New Facility"}
          </SheetTitle>
          <SheetDescription>
            {facilityId
              ? "Update the details of the existing facility."
              : "Create a new facility and add it to the organization."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <CreateFacilityForm
            organizationId={organizationId}
            facilityId={facilityId}
            onSubmitSuccess={() => {
              setOpen(false);
              queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
