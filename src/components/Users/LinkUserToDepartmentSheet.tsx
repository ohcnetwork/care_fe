import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { RoleSelect } from "@/components/Common/RoleSelect";

import mutate from "@/Utils/request/mutate";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { RoleBase } from "@/types/emr/role/role";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface Props {
  userId: string;
  facilityId: string;
  trigger?: React.ReactNode;
}

export default function LinkUserToDepartmentSheet({
  userId,
  facilityId,
  trigger,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    string[] | null
  >(null);
  const [selectedRole, setSelectedRole] = useState<RoleBase>();

  const { mutate: assignUser, isPending } = useMutation({
    mutationFn: (body: {
      user: string;
      role: string;
      organizationId: string;
    }) =>
      mutate(facilityOrganizationApi.assignUser, {
        pathParams: { facilityId, organizationId: body.organizationId },
        body: { user: body.user, role: body.role },
      })({ user: body.user, role: body.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganizations", "byUser", facilityId, userId],
      });
      toast.success(t("user_linked_to_department_success"));
      setOpen(false);
      setSelectedOrganizations(null);
      setSelectedRole(undefined);
    },
    onError: (error) => {
      const errorData = error.cause as { errors?: { msg?: string[] } };
      if (errorData?.errors?.msg) {
        errorData.errors.msg.forEach((er) => {
          toast.error(er);
        });
      } else {
        toast.error(t("error_linking_user_to_department"));
      }
    },
  });

  const handleLinkUser = () => {
    if (!selectedOrganizations || selectedOrganizations.length === 0) {
      toast.error(t("please_select_department"));
      return;
    }

    if (!selectedRole) {
      toast.error(t("please_select_role"));
      return;
    }

    assignUser({
      user: userId,
      role: selectedRole.id,
      organizationId: selectedOrganizations[0],
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("link_department")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("link_user_to_department")}</SheetTitle>
          <SheetDescription>
            {t("link_user_to_department_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <FacilityOrganizationSelector
              facilityId={facilityId}
              value={selectedOrganizations}
              onChange={setSelectedOrganizations}
              singleSelection={true}
              optional={true}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("select_role")}</Label>
            <RoleSelect value={selectedRole} onChange={setSelectedRole} />
          </div>

          <Button
            className="w-full"
            onClick={handleLinkUser}
            disabled={
              !selectedOrganizations ||
              selectedOrganizations.length === 0 ||
              !selectedRole ||
              isPending
            }
          >
            {isPending && (
              <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
            )}
            {t("link_to_department")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
