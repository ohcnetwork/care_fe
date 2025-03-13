import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
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

import mutate from "@/Utils/request/mutate";
import { FacilityOrganizationCreate } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface Props {
  facilityId: string;
  parentId?: string;
}

const ORG_TYPES = [
  { value: "dept", label: "Department" },
  { value: "team", label: "Team" },
] as const;

type OrgType = (typeof ORG_TYPES)[number]["value"];

export default function FacilityOrganizationSheet({
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
      mutate(facilityOrganizationApi.create, {
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
      toast.success(t("organization_created_successfully"));
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
      toast.error(t("please_enter_organization_name"));
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
        <Button>
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          {t("add_department_team")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("create_department_team")}</SheetTitle>
          <SheetDescription>
            {t("create_department_team_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("enter_department_team_name")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t(`type`)}</label>
            <Select
              value={orgType}
              onValueChange={(value: OrgType) => setOrgType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_organization_type")} />
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
              placeholder={t("enter_department_team_description")}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
          >
            {isPending ? t("creating") : t("create_organization")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
