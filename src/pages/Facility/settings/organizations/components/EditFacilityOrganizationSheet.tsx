import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { PenLine } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import {
  FacilityOrganization,
  FacilityOrganizationEdit,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface Props {
  facilityId: string;
  organization: FacilityOrganization;
}

const ORG_TYPES = [
  { value: "dept", label: "Department" },
  { value: "team", label: "Team" },
] as const;

type OrgType = (typeof ORG_TYPES)[number]["value"];

export default function EditFacilityOrganizationSheet({
  facilityId,
  organization,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("dept");
  const isMobile = useBreakpoints({ default: true, sm: false });

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setDescription(organization.description || "");
      if (ORG_TYPES.some((type) => type.value === organization.org_type)) {
        setOrgType(organization.org_type as OrgType);
      }
    }
  }, [organization]);

  const { mutate: updateOrganization, isPending } = useMutation({
    mutationFn: (body: FacilityOrganizationEdit) =>
      mutate(facilityOrganizationApi.update, {
        pathParams: { facilityId, organizationId: organization.id },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization", "list", facilityId],
      });
      toast.success(t("organization_updated_successfully"));
      setOpen(false);
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

    updateOrganization({
      name: name.trim(),
      description: description.trim() || undefined,
      org_type: orgType,
      facility: facilityId,
      parent: organization?.parent?.id,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="white" size={isMobile ? "xs" : "sm"}>
          <PenLine className="h-4 w-4" />
          <span className="hidden lg:inline">{t("edit")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("edit_department_team")}</SheetTitle>
          <SheetDescription>
            {t("edit_department_team_description")}
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
            <label className="text-sm font-medium">{t("description")}</label>
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
            {isPending ? t("saving") : t("save_changes")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
