import careConfig from "@careConfig";
import { Link } from "raviger";
import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";

import {
  INavItem,
  SidebarShrinkContext,
  ToggleShrink,
} from "@/components/Common/Sidebar/Sidebar";
import {
  ShrinkedSidebarItem,
  SidebarItem,
} from "@/components/Common/Sidebar/SidebarItem";

import useActiveLink from "@/hooks/useActiveLink";

import { classNames } from "@/Utils/utils";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const LOGO_COLLAPSE = "/images/care_logo_mark.svg";

const GetNavItems = () => {
  const { t } = useTranslation();
  const BaseNavItems: INavItem[] = [
    { text: t("appointments"), to: "/patient/home", icon: "d-patient" },
    { text: t("lab_tests"), to: "/patient/lab_tests", icon: "d-patient" },
    { text: t("abha"), to: "/patient/abha", icon: "d-folder" },
    {
      text: t("medical_records"),
      to: "/patient/medical_records",
      icon: "d-book-open",
    },
    { text: t("my_doctors"), to: "/patient/doctors", icon: "d-book-open" },
    { text: t("my_profile"), to: "/patient/profile", icon: "d-people" },
  ];
  return BaseNavItems;
};

export const OTPPatientDesktopSidebar = () => {
  const { shrinked, setShrinked } = useContext(SidebarShrinkContext);
  return (
    <OTPPatientStatelessSidebar
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

export const OTPPatientMobileSidebar = (props: MobileSidebarProps) => {
  return (
    <SlideOver {...props} slideFrom="left" onlyChild>
      <OTPPatientStatelessSidebar onItemClick={props.setOpen} />
    </SlideOver>
  );
};

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

export const OTPPatientStatelessSidebar = ({
  shrinked = false,
  setShrinked,
  onItemClick,
}: StatelessSidebarProps) => {
  const activeLink = useActiveLink();
  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  const NavItems = GetNavItems();

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
        </div>
        <div className="hidden md:block md:flex-1" />
      </div>
    </nav>
  );
};
