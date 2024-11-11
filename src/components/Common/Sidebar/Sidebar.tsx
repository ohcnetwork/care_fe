import careConfig from "@careConfig";
import { Link } from "raviger";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ShrinkedSidebarItem,
  SidebarItem,
} from "@/components/Common/Sidebar/SidebarItem";
import SidebarUserCard from "@/components/Common/Sidebar/SidebarUserCard";
import NotificationItem from "@/components/Notifications/NotificationsList";

import useActiveLink from "@/hooks/useActiveLink";
import { useCareAppNavItems } from "@/hooks/useCareApps";

import { classNames } from "@/Utils/utils";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const LOGO_COLLAPSE = "/images/care_logo_mark.svg";

export interface INavItem {
  text: string;
  to?: string;
  icon: IconName;
}

type StatelessSidebarProps =
  | {
      shrinkable: true;
      shrinked: boolean;
      setShrinked: (state: boolean) => void;
      onItemClick?: undefined;
    }
  | {
      shrinkable?: false;
      shrinked?: false;
      setShrinked?: undefined;
      onItemClick: (open: boolean) => void;
    };

const StatelessSidebar = ({
  shrinked = false,
  setShrinked,
  onItemClick,
}: StatelessSidebarProps) => {
  const { t } = useTranslation();
  const BaseNavItems: INavItem[] = [
    { text: t("facilities"), to: "/facility", icon: "l-hospital" },
    { text: t("patients"), to: "/patients", icon: "l-user-injured" },
    { text: t("assets"), to: "/assets", icon: "l-shopping-cart-alt" },
    { text: t("sample_test"), to: "/sample", icon: "l-medkit" },
    { text: t("shifting"), to: "/shifting", icon: "l-ambulance" },
    { text: t("resource"), to: "/resource", icon: "l-heart-medical" },
    { text: t("users"), to: "/users", icon: "l-users-alt" },
    { text: t("notice_board"), to: "/notice_board", icon: "l-meeting-board" },
  ];

  const PluginNavItems = useCareAppNavItems();

  const NavItems = [...BaseNavItems, ...PluginNavItems];

  const activeLink = useActiveLink();
  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const [lastIndicatorPosition, setLastIndicatorPosition] = useState(0);
  const [isOverflowVisible, setOverflowVisisble] = useState(false);

  const updateIndicator = () => {
    if (!indicatorRef.current) return;
    const index = NavItems.findIndex((item) => item.to === activeLink);
    const navItemCount = NavItems.length + (careConfig.urls.dashboard ? 2 : 1);
    if (index !== -1) {
      const e = indicatorRef.current;
      const itemHeight = activeLinkRef.current?.clientHeight || 0;
      const itemOffset = index * itemHeight;

      const indicatorHeight = indicatorRef.current.clientHeight;
      const indicatorOffset = (itemHeight - indicatorHeight) / 2;

      const top = `${itemOffset + indicatorOffset}px`;
      const bottom = `${navItemCount * itemHeight - itemOffset - indicatorOffset}px`;

      e.style.top = top;
      e.style.bottom = bottom;

      setLastIndicatorPosition(index);
    } else {
      indicatorRef.current.style.display = "none";
    }
  };

  useEffect(() => {
    updateIndicator();
  }, [activeLink, lastIndicatorPosition]);

  useEffect(() => {
    addEventListener("resize", updateIndicator);
    return () => removeEventListener("resize", updateIndicator);
  }, []);

  const handleOverflow = (value: boolean) => {
    setOverflowVisisble(value);
  };

  return (
    <nav
      className={`group flex h-dvh flex-1 flex-col bg-gray-100 py-3 md:py-5 ${
        shrinked ? "w-14" : "w-60"
      } transition-all duration-300 ease-in-out ${
        isOverflowVisible && shrinked
          ? "overflow-visible"
          : "overflow-y-auto overflow-x-hidden"
      }`}
    >
      {setShrinked && shrinked && (
        <div>
          <ToggleShrink
            shrinked={shrinked}
            toggle={() => setShrinked(!shrinked)}
          />
        </div>
      )}
      <div
        className={`flex items-center ${shrinked ? "mt-2 justify-center" : "justify-between"}`}
      >
        <Link
          href="/"
          className={`${
            shrinked ? "mx-auto" : "ml-3"
          } flex items-center justify-between`}
        >
          <img
            className="h-8 w-auto self-start transition md:h-10"
            src={shrinked ? LOGO_COLLAPSE : careConfig.mainLogo?.light}
          />
        </Link>
        {setShrinked && !shrinked && (
          <div className="ml-1">
            <ToggleShrink
              shrinked={shrinked}
              toggle={() => setShrinked(!shrinked)}
            />
          </div>
        )}
      </div>
      <div className="relative mt-4 flex h-full flex-col justify-between">
        <div className="relative flex flex-1 flex-col md:flex-none">
          <div
            ref={indicatorRef}
            className={classNames(
              "absolute right-2 z-10 block h-6 w-1 rounded-l bg-primary-500 transition-all",
              activeLink ? "opacity-100" : "opacity-0",
            )}
          />
          {NavItems.map((i) => {
            return (
              <Item
                ref={i.to === activeLink ? activeLinkRef : undefined}
                key={i.text}
                {...i}
                icon={<CareIcon icon={i.icon} className="h-5" />}
                selected={i.to === activeLink}
                onItemClick={() => onItemClick && onItemClick(false)}
                handleOverflow={handleOverflow}
              />
            );
          })}

          <NotificationItem
            shrinked={shrinked}
            handleOverflow={handleOverflow}
            onClickCB={() => onItemClick && onItemClick(false)}
          />
          {careConfig.urls.dashboard && (
            <Item
              text="Dashboard"
              to={careConfig.urls.dashboard}
              icon={<CareIcon icon="l-dashboard" className="text-lg" />}
              external
              handleOverflow={handleOverflow}
            />
          )}
        </div>
        <div className="hidden md:block md:flex-1" />

        <SidebarUserCard shrinked={shrinked} />
      </div>
    </nav>
  );
};

export const SidebarShrinkContext = createContext<{
  shrinked: boolean;
  setShrinked: (state: boolean) => void;
}>({
  shrinked: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShrinked: () => {},
});

export const DesktopSidebar = () => {
  const { shrinked, setShrinked } = useContext(SidebarShrinkContext);
  return (
    <StatelessSidebar
      shrinked={shrinked}
      setShrinked={setShrinked}
      shrinkable
    />
  );
};

interface MobileSidebarProps {
  open: boolean;
  setOpen: (state: boolean) => void;
}

export const MobileSidebar = (props: MobileSidebarProps) => {
  return (
    <SlideOver {...props} slideFrom="left" onlyChild>
      <StatelessSidebar onItemClick={props.setOpen} />
    </SlideOver>
  );
};

interface ToggleShrinkProps {
  shrinked: boolean;
  toggle: () => void;
}

const ToggleShrink = ({ shrinked, toggle }: ToggleShrinkProps) => {
  const { t } = useTranslation();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 ${shrinked ? "bg-gray-200" : "bg-gray-100"} text-gray-600 hover:bg-primary-200 hover:text-primary-800 ${
              shrinked ? "mx-auto" : "mr-4"
            } transition-all ease-in-out`}
            onClick={toggle}
          >
            <CareIcon
              icon={shrinked ? "l-arrow-bar-right" : "l-layout-sidebar-alt"}
              className="text-lg transition"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{shrinked ? t("expand_sidebar") : t("collapse_sidebar")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
