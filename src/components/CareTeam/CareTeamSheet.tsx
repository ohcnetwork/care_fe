import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
        <UserRound className="text-3xl text-gray-500" />
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
      setOpen(false);
    },
  });

  const handleAddMember = () => {
    if (!selectedUser || !selectedRole) return;

    // Check if user is already in the team
    if (members.some((member) => member.user_id === selectedUser.id)) {
      toast.error(t("member_already_added"));
      return;
    }

    setMembers([
      ...members,
      {
        user_id: selectedUser.id,
        role: selectedRole,
        user: selectedUser,
      },
    ]);

    setSelectedUser(undefined);
    setSelectedRole(null);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMembers = [...members];
    [newMembers[index - 1], newMembers[index]] = [
      newMembers[index],
      newMembers[index - 1],
    ];
    setMembers(newMembers);
  };

  const handleMoveDown = (index: number) => {
    if (index === members.length - 1) return;
    const newMembers = [...members];
    [newMembers[index], newMembers[index + 1]] = [
      newMembers[index + 1],
      newMembers[index],
    ];
    setMembers(newMembers);
  };

  const handleSave = () => {
    saveCareTeam({
      members: members.map(({ user_id, role }) => ({ user_id, role })),
    });
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
                  placeholder={t("select_doctor")}
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
                disabled={!selectedUser || !selectedRole}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <UserRound className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {index > 0 && (
                            <DropdownMenuItem
                              onClick={() => handleMoveUp(index)}
                            >
                              <ChevronUp className="mr-2 size-4" />
                              {t("move_up")}
                            </DropdownMenuItem>
                          )}
                          {index < members.length - 1 && (
                            <DropdownMenuItem
                              onClick={() => handleMoveDown(index)}
                            >
                              <ChevronDown className="mr-2 size-4" />
                              {t("move_down")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(index)}
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

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || members.length === 0}
            className="cursor-pointer"
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
