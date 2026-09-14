import { BadgeCheck, ChevronsUpDown, LogOut, RefreshCw } from "lucide-react";
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
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { NavigationLink } from "@/components/ui/sidebar/nav-main";

import { SidebarUserAvatar } from "@/components/ui/sidebar/sidebar-user-avatar";

import { useAppVersion } from "@/hooks/useAppVersion";
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
  const { handleMenuOpenChange } = useAppSidebar();
  const { signOut } = useAuthContext();
  const careApps = useCareApps();
  const { pendingUpdate, updateApp } = useAppVersion();
  const pluginNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.userNavItems ? c.userNavItems : [],
  ) as NavigationLink[];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-[10px] bg-neutral-200/60 text-neutral-950 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-indigo-400 data-[state=open]:bg-neutral-200 data-[state=open]:text-neutral-950"
              tooltip={formatName(user)}
              aria-label={formatName(user)}
            >
              <SidebarUserAvatar
                name={formatName(user, true)}
                imageUrl={user.profile_picture_url}
              />
              {(open || isMobile) && (
                <>
                  <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {formatName(user)}
                    </span>
                    <span className="truncate text-xs text-neutral-600">
                      {user.user_type ? t(user.user_type) : user.username}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-neutral-600" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <SidebarUserAvatar
                  name={formatName(user, true)}
                  imageUrl={user.profile_picture_url}
                />
                <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {formatName(user)}
                  </span>
                  <span className="truncate text-xs text-neutral-600">
                    {user.username}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {pendingUpdate && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={updateApp}>
                  <RefreshCw />
                  {t("update_available")}
                </DropdownMenuItem>
              </>
            )}
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
              {pluginNavItems.map((item) => (
                <DropdownMenuItem
                  key={item.name}
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
  const { handleMenuOpenChange } = useAppSidebar();
  const signOut = usePatientSignOut();
  const patientUserContext = usePatientContext();

  const patient = patientUserContext?.selectedPatient;
  const phoneNumber = patientUserContext?.tokenData.phoneNumber;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-[10px] bg-neutral-200/60 text-neutral-950 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-indigo-400 data-[state=open]:bg-neutral-200 data-[state=open]:text-neutral-950"
              tooltip={patient?.name || phoneNumber}
              aria-label={patient?.name || phoneNumber}
            >
              {(open || isMobile) && (
                <>
                  <SidebarUserAvatar name={patient?.name || phoneNumber} />
                  <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {patient?.name || phoneNumber}
                    </span>
                    {patient && (
                      <span className="truncate text-xs text-neutral-600">
                        {phoneNumber}
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-neutral-600" />
                </>
              )}
              {!open && !isMobile && (
                <div className="flex flex-row items-center">
                  <SidebarUserAvatar name={patient?.name || phoneNumber} />
                </div>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "top" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <SidebarUserAvatar name={patient?.name || phoneNumber} />
                <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {patient?.name || phoneNumber}
                  </span>
                  {patient && (
                    <span className="truncate text-xs text-neutral-600">
                      {phoneNumber}
                    </span>
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
