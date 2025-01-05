import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { FacilityOrganizationCreate } from "@/types/facilityOrganization/facilityOrganization";

interface Props {
  facilityId: string;
  parentId?: string;
}

const ORG_TYPES = [
  { value: "dept", label: "Department" },
  { value: "team", label: "Team" },
] as const;

type OrgType = (typeof ORG_TYPES)[number]["value"];

export default function CreateFacilityOrganizationSheet({
  facilityId,
  parentId,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("dept");

  const { mutate: createOrganization, isPending } = useMutation({
    mutationFn: (body: FacilityOrganizationCreate) =>
      mutate(routes.facilityOrganization.create, {
        pathParams: { facilityId },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization", "list", facilityId, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["getCurrentUser"],
      });
      toast.success("Organization created successfully");
      setOpen(false);
      setName("");
      setDescription("");
      setOrgType("dept");
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Please enter an organization name");
      return;
    }

    createOrganization({
      name: name.trim(),
      description: description.trim() || undefined,
      org_type: orgType,
      parent: parentId,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="primary_gradient">
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Organization</SheetTitle>
          <SheetDescription>
            Create a new organization in this facility.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={orgType}
              onValueChange={(value: OrgType) => setOrgType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {ORG_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter organization description (optional)"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
          >
            {isPending ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
