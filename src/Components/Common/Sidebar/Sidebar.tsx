import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SidebarItem, ShrinkedSidebarItem } from "./SidebarItem";
import SidebarUserCard from "./SidebarUserCard";
import NotificationItem from "../../Notifications/NotificationsList";
import useActiveLink from "../../../Common/hooks/useActiveLink";
import CareIcon, { IconName } from "../../../CAREUI/icons/CareIcon";
import SlideOver from "../../../CAREUI/interactive/SlideOver";
import { classNames } from "../../../Utils/utils";
import { Link } from "raviger";
import careConfig from "@careConfig";
import { useCareAppNavItems } from "@/Common/hooks/useCareApps";

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
  const BaseNavItems: INavItem[] = [
    { text: "Facilities", to: "/facility", icon: "l-hospital" },
    { text: "Patients", to: "/patients", icon: "l-user-injured" },
    { text: "Assets", to: "/assets", icon: "l-shopping-cart-alt" },
    { text: "Sample Test", to: "/sample", icon: "l-medkit" },
    { text: "Shifting", to: "/shifting", icon: "l-ambulance" },
    { text: "Resource", to: "/resource", icon: "l-heart-medical" },
    { text: "Users", to: "/users", icon: "l-users-alt" },
    { text: "Notice Board", to: "/notice_board", icon: "l-meeting-board" },
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
    const navItemCount = NavItems.length + (careConfig.urls.dashboard ? 2 : 1); // +2 for notification and dashboard
    if (index !== -1) {
      // Haha math go brrrrrrrrr

      const e = indicatorRef.current;
      const itemHeight = activeLinkRef.current?.clientHeight || 0;
      if (lastIndicatorPosition > index) {
        e.style.top = `${itemHeight * (index + 0.37)}px`;
        setTimeout(() => {
          e.style.bottom = `${itemHeight * (navItemCount - 0.63 - index)}px`;
        }, 50);
      } else {
        e.style.bottom = `${itemHeight * (navItemCount - 0.63 - index)}px`;
        setTimeout(() => {
          e.style.top = `${itemHeight * (index + 0.37)}px`;
        }, 50);
      }
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
      className={`group flex h-full flex-col bg-gray-100 py-3 md:py-5 ${
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
        <Link href="/" className="flex items-center justify-between">
          <img
            className={`${
              shrinked ? "mx-auto" : "ml-4 md:ml-2"
            } h-8 self-start transition md:h-12 lg:h-12`}
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
      <div className="h-4" /> {/* flexible spacing */}
      <div className="relative flex h-full flex-col">
        <div className="relative flex flex-1 flex-col md:flex-none">
          <div
            ref={indicatorRef}
            // className="absolute left-2 w-1 hidden md:block bg-primary-400 rounded z-10 transition-all"
            className={classNames(
              "absolute left-2 z-10 block w-1 rounded bg-primary-400 transition-all",
              activeLink ? "opacity-0 md:opacity-100" : "opacity-0",
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

const ToggleShrink = ({ shrinked, toggle }: ToggleShrinkProps) => (
  <div
    className={`flex h-5 w-5 cursor-pointer items-center justify-center self-end rounded bg-gray-300 text-secondary-100 text-opacity-70 hover:bg-secondary-500 hover:text-opacity-100 ${
      shrinked ? "mx-auto" : "mr-4"
    } transition-all duration-200 ease-in-out`}
    onClick={toggle}
  >
    <CareIcon
      icon="l-angle-up"
      className={`text-3xl ${
        shrinked ? "rotate-90" : "-rotate-90"
      } transition-all delay-150 duration-300 ease-out`}
    />
  </div>
);
