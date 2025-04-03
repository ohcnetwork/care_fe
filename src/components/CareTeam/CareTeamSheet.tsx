import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CareTeamMember } from "@/types/careTeam/careTeam";
import careTeamApi from "@/types/careTeam/careTeamApi";
import { Encounter } from "@/types/emr/encounter";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

type CareTeamSheetProps = {
  trigger: React.ReactNode;
  encounter: Encounter;
};

type CareTeamMemberWithUser = CareTeamMember & { user: UserBase };

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-1 p-8 text-center">
      <div className="rounded-full bg-secondary/10 p-3">
        <GripVertical className="text-3xl text-gray-500" />
      </div>
      <div className="max-w-[300px] space-y-1">
        <h3 className="font-medium">{t("no_care_team_members")}</h3>
        <p className="text-sm text-gray-500">{t("add_care_team_members")}</p>
      </div>
    </div>
  );
}

export function CareTeamSheet({ trigger, encounter }: CareTeamSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [members, setMembers] = useState<CareTeamMemberWithUser[]>(
    encounter.care_team.map((member) => ({
      user_id: member.member.id,
      role: member.role,
      user: member.member,
    })),
  );
  const [selectedUser, setSelectedUser] = useState<UserBase | undefined>();
  const [selectedRole, setSelectedRole] = useState<Code | null>(null);

  // Reset state when sheet is closed
  useEffect(() => {
    if (!open) {
      setSelectedUser(undefined);
      setSelectedRole(null);
      setMembers(
        encounter.care_team.map((member) => ({
          user_id: member.member.id,
          role: member.role,
          user: member.member,
        })),
      );
    }
  }, [open, encounter.care_team]);

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
    if (members.some((member) => member.user_id === selectedUser.id)) {
      toast.error(t("member_already_added"));
      return;
    }

    const newMembers = [
      ...members,
      {
        user_id: selectedUser.id,
        role: selectedRole,
        user: selectedUser,
      },
    ];

    setMembers(newMembers);
    saveCareTeam(
      {
        members: newMembers.map(({ user_id, role }) => ({ user_id, role })),
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

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
    saveCareTeam(
      {
        members: newMembers.map(({ user_id, role }) => ({ user_id, role })),
      },
      {
        onSuccess: () => {
          toast.success(t("member_removed_successfully"));
        },
      },
    );
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return; // Already primary

    const newMembers = [...members];
    const [movedMember] = newMembers.splice(index, 1);
    newMembers.unshift(movedMember);

    setMembers(newMembers);
    saveCareTeam(
      {
        members: newMembers.map(({ user_id, role }) => ({ user_id, role })),
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
      <SheetContent className="w-full sm:max-w-3xl">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-xl font-semibold">
            {t("manage_care_team")}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex flex-col">
                <UserSelector
                  selected={selectedUser}
                  onChange={setSelectedUser}
                  placeholder={t("select_member")}
                />
              </div>
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

            <div className="space-y-2">
              {members.length === 0 ? (
                <EmptyState />
              ) : (
                members.map((member, index) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={formatName(member.user)}
                        imageUrl={member.user?.profile_picture_url}
                        className="size-8"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {formatName(member.user)}
                          </p>
                          {index === 0 && (
                            <Badge variant="primary" className="font-normal">
                              {t("primary")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {member.role.display}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {index !== 0 && (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(index)}
                        disabled={isPending}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
