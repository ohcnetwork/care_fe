import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Avatar } from "@/components/Common/Avatar";
import UserSelector from "@/components/Common/UserSelector";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { Code } from "@/types/base/code/code";
import careTeamApi from "@/types/careTeam/careTeamApi";
import { Encounter } from "@/types/emr/encounter/encounter";
import { UserBase } from "@/types/user/user";

type CareTeamSheetProps = {
  trigger: React.ReactNode;
  encounter: Encounter;
  canWrite: boolean;
};

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-1 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <UserRound className="text-3xl text-gray-500" />
      </div>
      <div className="max-w-[300px] space-y-1">
        <h3 className="font-medium">{t("no_care_team_members")}</h3>
      </div>
    </div>
  );
}

export function CareTeamSheet({
  trigger,
  encounter,
  canWrite,
}: CareTeamSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserBase | undefined>();
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<Code | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<UserBase | undefined>();

  // Reset state when sheet is closed
  useEffect(() => {
    if (!open) {
      setSelectedUser(undefined);
      setSelectedRole(null);
      setMemberToRemove(undefined);
    }
  }, [open]);

  const { mutate: saveCareTeam, isPending } = useMutation({
    mutationFn: mutate(careTeamApi.setCareTeam, {
      pathParams: { encounterId: encounter.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["encounter", encounter.id],
      });
    },
  });

  const handleAddMember = () => {
    if (!selectedUser || !selectedRole) return;

    // Check if user is already in the team
    if (
      encounter.care_team.some((member) => member.member.id === selectedUser.id)
    ) {
      toast.error(t("member_already_added"));
      return;
    }

    const newMembers = [
      ...encounter.care_team.map((member) => ({
        user_id: member.member.id,
        role: member.role,
      })),
      {
        user_id: selectedUser.id,
        role: selectedRole,
      },
    ];

    saveCareTeam(
      {
        members: newMembers,
      },
      {
        onSuccess: () => {
          toast.success(t("member_added_successfully"));
        },
      },
    );

    setSelectedUser(undefined);
    setSelectedRole(null);
  };

  const handleOrganizationChange = (value: string[] | null) => {
    setSelectedOrganization(value ? value[0] : "");
    setSelectedUser(undefined);
  };

  const confirmRemoveMember = (member: UserBase) => {
    setMemberToRemove(member);
  };

  const handleRemoveMember = () => {
    if (!memberToRemove) return;

    const newMembers = encounter.care_team
      .filter((member) => member.member.id !== memberToRemove.id)
      .map((member) => ({
        user_id: member.member.id,
        role: member.role,
      }));

    saveCareTeam(
      {
        members: newMembers,
      },
      {
        onSuccess: () => {
          toast.success(t("member_removed_successfully"));
        },
      },
    );

    setMemberToRemove(undefined);
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return; // Already primary

    // Create a new array with the selected member moved to the top
    const newMembers = [
      // First add the member that should be primary
      {
        user_id: encounter.care_team[index].member.id,
        role: encounter.care_team[index].role,
      },
      // Then add all other members except the one being moved
      ...encounter.care_team
        .filter((_, i) => i !== index)
        .map((member) => ({
          user_id: member.member.id,
          role: member.role,
        })),
    ];

    saveCareTeam(
      {
        members: newMembers,
      },
      {
        onSuccess: () => {
          toast.success(t("primary_member_updated"));
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl pr-0">
        <SheetHeader className="space-y-1 mr-2">
          <SheetTitle className="text-xl font-semibold">
            {canWrite ? t("manage_care_team") : t("view_care_team")}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full my-6 pb-12 pr-6">
          <div className="space-y-6">
            <FacilityOrganizationSelector
              singleSelection={true}
              onChange={handleOrganizationChange}
              facilityId={encounter.facility.id}
            />
            <div className="flex flex-col gap-3">
              {canWrite && (
                <div className="flex flex-col gap-4">
                  {selectedOrganization && (
                    <div className="flex flex-col">
                      <UserSelector
                        selected={selectedUser}
                        onChange={setSelectedUser}
                        placeholder={t("select_member")}
                        facilityId={encounter.facility.id}
                        organizationId={selectedOrganization}
                      />
                    </div>
                  )}
                  <ValueSetSelect
                    system="system-practitioner-role-code"
                    value={selectedRole}
                    onSelect={setSelectedRole}
                    placeholder={t("select_role")}
                  />
                  <Button
                    size="icon"
                    onClick={handleAddMember}
                    disabled={!selectedUser || !selectedRole || isPending}
                    className="w-full md:w-auto px-2 cursor-pointer"
                  >
                    {t("add")}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {encounter.care_team.length === 0 ? (
                  <EmptyState />
                ) : (
                  encounter.care_team.map((member, index) => (
                    <div
                      key={member.member.id}
                      className="flex flex-col gap-2 rounded-lg border p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={formatName(member.member)}
                            imageUrl={member.member?.profile_picture_url}
                            className="size-8"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {formatName(member.member)}
                              </p>
                              {index === 0 && (
                                <Badge
                                  variant="primary"
                                  className="font-normal"
                                >
                                  {t("primary")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {member.role.display}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-col-reverse md:flex-row">
                          <div className="hidden md:block">
                            {canWrite && index !== 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMakePrimary(index)}
                                disabled={isPending}
                                className="cursor-pointer"
                              >
                                {t("mark_as_primary")}
                              </Button>
                            )}
                          </div>
                          {canWrite && (
                            <>
                              <div className="md:hidden">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isPending}
                                      className="cursor-pointer"
                                    >
                                      <MoreVertical className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {index !== 0 && (
                                      <DropdownMenuItem
                                        onClick={() => handleMakePrimary(index)}
                                        disabled={isPending}
                                      >
                                        {t("mark_as_primary")}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        confirmRemoveMember(member.member)
                                      }
                                      disabled={isPending}
                                      className="text-destructive"
                                    >
                                      {t("remove")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="hidden md:block">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    confirmRemoveMember(member.member)
                                  }
                                  disabled={isPending}
                                  className="cursor-pointer"
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <AlertDialog
          open={!!memberToRemove}
          onOpenChange={(open) => !open && setMemberToRemove(undefined)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("confirm_removing_member")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("confirm_removing_member_description", {
                  member: memberToRemove ? formatName(memberToRemove) : "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveMember}>
                {t("remove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
