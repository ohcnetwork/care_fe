import { CaretSortIcon } from "@radix-ui/react-icons";
import { BadgeCheck, LogOut, RefreshCw } from "lucide-react";
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
import { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { Avatar } from "@/components/Common/Avatar";

import { useAppUpdates } from "@/hooks/useAppUpdates";
import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import { useCareApps } from "@/hooks/useCareApps";
import { usePatientSignOut } from "@/hooks/usePatientSignOut";
import { usePatientContext } from "@/hooks/usePatientUser";

import { formatName } from "@/Utils/utils";

export function FacilityNavUser({
  selectedFacilityId,
}: {
  selectedFacilityId: string | undefined;
}) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const { isMobile, open } = useSidebar();
  const { signOut } = useAuthContext();
  const careApps = useCareApps();
  const { newVersion, updateApp } = useAppUpdates(false, undefined, true);
  const pluginNavItems = careApps
    .filter((c) => !!c.userNavItems)
    .flatMap((c) => c.userNavItems) as NavigationLink[];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              data-cy="user-menu-dropdown"
            >
              <Avatar
                className="size-8 rounded-lg"
                name={`${user.first_name} ${user.last_name}`}
                imageUrl={user.profile_picture_url}
              />
              {(open || isMobile) && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {formatName(user)}
                    </span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                  <CaretSortIcon className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="size-8 rounded-lg"
                  name={`${user.first_name} ${user.last_name}`}
                  imageUrl={user.profile_picture_url}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {formatName(user)}
                  </span>
                  <span className="truncate text-xs">{user.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {newVersion && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-cy="user-menu-update"
                  onClick={updateApp}
                >
                  <RefreshCw />
                  {t("update_available")}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                data-cy="user-menu-profile"
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
              {pluginNavItems.map((item) => (
                <DropdownMenuItem
                  key={item.name}
                  data-cy={`user-menu-${item.name}`}
                  onClick={() => {
                    navigate(
                      `/facility/${selectedFacilityId}/users/${user.username}/${item.url}`,
                    );
                  }}
                >
                  {item.icon}
                  {t(item.name)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-cy="user-menu-logout" onClick={signOut}>
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
              data-cy="user-menu-dropdown"
            >
              {(open || isMobile) && (
                <>
                  <Avatar
                    className="size-8 rounded-lg"
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
              {!open && !isMobile && (
                <div className="flex flex-row items-center">
                  <Avatar
                    name={patient?.name || phoneNumber}
                    className="size-8 rounded-lg"
                  />
                </div>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="size-8 rounded-lg"
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
            <DropdownMenuItem data-cy="user-menu-logout" onClick={signOut}>
              <LogOut />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
