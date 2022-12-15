import { Fragment, useEffect, useRef, useState } from "react";
import { SidebarItem, ShrinkedSidebarItem } from "./SidebarItem";
import SidebarUserCard from "./SidebarUserCard";
import NotificationItem from "../../Notifications/NotificationsList";
import { Dialog, Transition } from "@headlessui/react";
import useActiveLink from "../../../Common/hooks/useActiveLink";
import CareIcon from "../../../CAREUI/icons/CareIcon";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const DASHBOARD = process.env.REACT_APP_DASHBOARD_URL ?? "";

const LOGO = process.env.REACT_APP_LIGHT_LOGO;
const LOGO_COLLAPSE =
  process.env.REACT_APP_LIGHT_COLLAPSE_LOGO || "/images/logo_collapsed.svg";

type StatelessSidebarProps =
  | {
      shrinkable: true;
      shrinked: boolean;
      setShrinked: (state: boolean) => void;
    }
  | {
      shrinkable?: false;
      shrinked?: false;
      setShrinked?: undefined;
    };

const NavItems = [
  { text: "Facilities", to: "/facility", icon: "care-l-hospital" },
  { text: "Patients", to: "/patients", icon: "care-l-wheelchair" },
  { text: "Assets", to: "/assets", icon: "care-l-shopping-cart-alt" },
  { text: "Sample Test", to: "/sample", icon: "care-l-medkit" },
  { text: "Shifting", to: "/shifting", icon: "care-l-ambulance" },
  { text: "Resource", to: "/resource", icon: "care-l-heart-medical" },
  {
    text: "External Results",
    to: "/external_results",
    icon: "care-l-clipboard-notes",
  },
  { text: "Users", to: "/users", icon: "care-l-users-alt" },
  { text: "Notice Board", to: "/notice_board", icon: "care-l-meeting-board" },
];

const StatelessSidebar = ({
  shrinkable = false,
  shrinked = false,
  setShrinked,
}: StatelessSidebarProps) => {
  const activeLink = useActiveLink();
  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  const indicatorRef = useRef<HTMLDivElement>(null);
  const [lastIndicatorPosition, setLastIndicatorPosition] = useState(0);

  useEffect(() => {
    if (!indicatorRef.current) return;
    const index = NavItems.findIndex((item) => item.to === activeLink);
    if (index !== -1) {
      // Haha math go brrrrrrrrr

      const e = indicatorRef.current;

      const itemHeight = 44;
      const bottomItemOffset = 2;

      const indexDifference = index - lastIndicatorPosition;
      e.style.display = "block";

      // if (indexDifference > 0) {
      //   console.log("indexDifference > 0");
      //   e.style.top = lastIndicatorPosition * itemHeight + 16 + "px";
      //   e.style.bottom = "auto";
      // } else {
      //   console.log("indexDifference < 0");
      //   e.style.bottom =
      //     itemHeight * (NavItems.length + bottomItemOffset) -
      //     lastIndicatorPosition * itemHeight -
      //     28 +
      //     "px";
      //   e.style.top = "auto";
      // }

      // e.style.height = `${Math.abs(indexDifference) * itemHeight + 12}px`;
      setTimeout(() => {
        if (!e) return;
        if (indexDifference > 0) {
          e.style.top = index * itemHeight + 16 + "px";
          e.style.bottom = "auto";
        } else {
          e.style.bottom =
            itemHeight * (NavItems.length + bottomItemOffset) -
            index * itemHeight -
            28 +
            "px";
          e.style.top = "auto";
        }
        e.style.height = "0.75rem";
        setLastIndicatorPosition(index);
      }, 300);
    } else {
      indicatorRef.current.style.display = "none";
    }
  }, [activeLink]);

  return (
    <nav
      className={`h-screen group flex flex-col bg-primary-800 py-3 md:py-5 ${
        shrinked ? "w-14" : "w-60"
      } transition-all duration-300 ease-in-out overflow-auto`}
    >
      <div className="h-3" /> {/* flexible spacing */}
      <img
        className={`${
          shrinked ? "mx-auto" : "ml-5"
        } h-5 md:h-8 self-start transition mb-2 md:mb-5`}
        src={shrinked ? LOGO_COLLAPSE : LOGO}
      />
      <div className="h-3" /> {/* flexible spacing */}
      <div className="flex flex-col relative h-full mb-4 md:mb-0">
        <div className="flex flex-col relative flex-1 md:flex-none">
          <div
            ref={indicatorRef}
            className={`absolute left-2 w-1 hidden md:block
            bg-primary-400 rounded z-10 transition-all`}
           />
          {NavItems.map((i) => {
            return (
              <Item
                key={i.text}
                {...i}
                icon={<CareIcon className={`${i.icon} h-5`} />}
                selected={i.to === activeLink}
              />
            );
          })}

          <NotificationItem shrinked={shrinked} />
          <Item
            text="Dashboard"
            to={DASHBOARD}
            icon={<CareIcon className="care-l-dashboard h-5" />}
            external
          />
        </div>
        <div className="hidden md:block md:flex-1" />

        <div className="relative flex justify-end">
          {shrinkable && (
            <div
              className={`${
                shrinked ? "mx-auto" : "self-end"
              } flex self-end h-12 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out`}
            >
              <ToggleShrink
                shrinked={shrinked}
                toggle={() => setShrinked && setShrinked(!shrinked)}
              />
            </div>
          )}
        </div>
        <SidebarUserCard shrinked={shrinked} />
      </div>
    </nav>
  );
};

export const DesktopSidebar = () => {
  const [shrinked, setShrinked] = useState(
    () => localStorage.getItem(SIDEBAR_SHRINK_PREFERENCE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_SHRINK_PREFERENCE_KEY,
      shrinked ? "true" : "false"
    );
  }, [shrinked]);

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

export const MobileSidebar = ({ open, setOpen }: MobileSidebarProps) => {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-all" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-fit">
                  <StatelessSidebar />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

interface ToggleShrinkProps {
  shrinked: boolean;
  toggle: () => void;
}

const ToggleShrink = ({ shrinked, toggle }: ToggleShrinkProps) => (
  <div
    className={`flex items-center justify-center w-10 h-10 self-end cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700 ${
      shrinked ? "mx-auto" : "mr-4"
    } transition-all duration-200 ease-in-out`}
    onClick={toggle}
  >
    <i
      className={`fa-solid fa-chevron-up ${
        shrinked ? "rotate-90 text-sm" : "-rotate-90 text-base"
      } transition-all duration-300 delay-150 ease-out`}
    />
  </div>
);
