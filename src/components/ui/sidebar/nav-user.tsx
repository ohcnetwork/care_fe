"use client";

import { CaretSortIcon } from "@radix-ui/react-icons";
import { BadgeCheck, LogOut } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import { usePatientSignOut } from "@/hooks/usePatientSignOut";
import { usePatientContext } from "@/hooks/usePatientUser";

export function FacilityNavUser({
  selectedFacilityId,
}: {
  selectedFacilityId: string | undefined;
}) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { isMobile, open } = useSidebar();
  const { signOut } = useAuthContext();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {open && (
                <>
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    name={`${user.first_name} ${user.last_name}`}
                    imageUrl={user.read_profile_picture_url}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                  <CaretSortIcon className="ml-auto size-4" />
                </>
              )}
              {!open && (
                <div className="flex flex-row items-center">
                  <Avatar
                    name={`${user.first_name} ${user.last_name}`}
                    className="h-8 w-8 rounded-lg"
                    imageUrl={user.read_profile_picture_url}
                  />
                </div>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  name={`${user.first_name} ${user.last_name}`}
                  imageUrl={user.read_profile_picture_url}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="truncate text-xs">{user.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  const profileUrl = selectedFacilityId
                    ? `/facility/${selectedFacilityId}/users/${user.username}`
                    : `/users/${user.username}`;
                  navigate(profileUrl);
                }}
              >
                <BadgeCheck />
                {t("profile")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function PatientNavUser() {
  const { t } = useTranslation();
  const { isMobile, open } = useSidebar();
  const signOut = usePatientSignOut();
  const patientUserContext = usePatientContext();

  const patient = patientUserContext?.selectedPatient;
  const phoneNumber = patientUserContext?.tokenData.phoneNumber;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {open && (
                <>
                  <Avatar
                    className="h-8 w-8 rounded-lg"
                    name={patient?.name || phoneNumber}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {patient?.name || phoneNumber}
                    </span>
                    {patient && (
                      <span className="truncate text-xs">{phoneNumber}</span>
                    )}
                  </div>
                  <CaretSortIcon className="ml-auto size-4" />
                </>
              )}
              {!open && (
                <div className="flex flex-row items-center">
                  <Avatar
                    name={patient?.name || phoneNumber}
                    className="h-8 w-8 rounded-lg"
                  />
                </div>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  name={patient?.name || phoneNumber}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {patient?.name || phoneNumber}
                  </span>
                  {patient && (
                    <span className="truncate text-xs">{phoneNumber}</span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
