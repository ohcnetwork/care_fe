import { Activity, ArrowRight, MoreHorizontal } from "lucide-react";
import { Link, navigate, usePath } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { isNavigationActive, NavLink } from "@/components/ui/sidebar/nav-main";

import {
  ENCOUNTER_LIST_CLASSES,
  EncounterListClass,
  useDefaultEncounterClass,
} from "@/hooks/useDefaultEncounterClass";

/**
 * Links to the encounter list on screen, or else the user's default list,
 * with a menu beside it to open another list or change the default.
 */
export function EncounterNavItem({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const path = usePath();
  const { isMobile, setOpenMobile } = useSidebar();
  const { handleMenuOpenChange } = useAppSidebar();
  const [defaultClass, setDefaultClass] = useDefaultEncounterClass();
  const [settingDefault, setSettingDefault] = useState(false);

  const listUrl = (encounterClass: EncounterListClass) =>
    `/facility/${facilityId}/encounters/patients/${encounterClass}`;
  const listName = (encounterClass: EncounterListClass) =>
    encounterClass === "all"
      ? t("all_encounters")
      : t(`encounter_class__${encounterClass}`);

  const viewing = ENCOUNTER_LIST_CLASSES.find((encounterClass) =>
    isNavigationActive(path, listUrl(encounterClass)),
  );
  const current = viewing ?? defaultClass;

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenuItem className="flex items-center gap-1">
      <SidebarMenuButton
        asChild
        tooltip={listName(current)}
        isActive={!!viewing}
        className="min-w-0 flex-1"
      >
        <NavLink
          href={listUrl(current)}
          ariaLabel={listName(current)}
          isActive={!!viewing}
        >
          <Activity />
          <span title={listName(current)}>{listName(current)}</span>
        </NavLink>
      </SidebarMenuButton>
      {ENCOUNTER_LIST_CLASSES.length > 1 && (
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) setSettingDefault(false);
            handleMenuOpenChange(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground [--button-size:--spacing(11)]"
              aria-label={t("encounter_types")}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
            className="min-w-56"
          >
            {settingDefault ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t("set_default_encounter")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={defaultClass}
                  onValueChange={(encounterClass: EncounterListClass) => {
                    setDefaultClass(encounterClass);
                    navigate(listUrl(encounterClass));
                    closeMobileSidebar();
                  }}
                >
                  {ENCOUNTER_LIST_CLASSES.map((encounterClass) => (
                    <DropdownMenuRadioItem
                      key={encounterClass}
                      value={encounterClass}
                    >
                      {listName(encounterClass)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            ) : (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t("encounter_types")}</DropdownMenuLabel>
                  {ENCOUNTER_LIST_CLASSES.map((encounterClass) => (
                    <DropdownMenuItem key={encounterClass} asChild>
                      <Link
                        href={listUrl(encounterClass)}
                        onClick={closeMobileSidebar}
                      >
                        {listName(encounterClass)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  closeOnClick={false}
                  onClick={() => setSettingDefault(true)}
                >
                  {t("set_default")}
                  <ArrowRight className="ml-auto" />
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
}
