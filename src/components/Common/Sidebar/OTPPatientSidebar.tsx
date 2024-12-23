import careConfig from "@careConfig";
import { Link } from "raviger";
import { useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import { OTPPatientUserContext } from "@/Routers/OTPPatientRouter";
import { classNames } from "@/Utils/utils";
import { AppointmentPatient } from "@/pages/Patient/Utils";

import OTPPatientSidebarUserCard from "./OTPPatientSidebarUserCard";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const LOGO_COLLAPSE = "/images/care_logo_mark.svg";

const GetNavItems = (selectedUser: AppointmentPatient | null) => {
  const { t } = useTranslation();
  const { state, district, ward, local_body } = selectedUser || {};
  const paramString =
    (!state ? `state=${state}&` : "") +
    (!district ? `district=${district}&` : "") +
    (ward ? `ward=${ward}&` : "") +
    (local_body ? `local_body=${local_body}` : "");
  const BaseNavItems: INavItem[] = [
    { text: t("appointments"), to: "/patient/home", icon: "d-patient" },
    {
      text: t("nearby_facilities"),
      to: `/facilities/?${paramString}`,
      icon: "d-patient",
    },
    {
      text: t("medical_records"),
      to: `/patient/${selectedUser?.id}`,
      icon: "d-book-open",
    },
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

  const { t } = useTranslation();

  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);
  const [lastIndicatorPosition, setLastIndicatorPosition] = useState(0);
  const [isOverflowVisible, setOverflowVisisble] = useState(false);
  const {
    users,
    selectedUser,
    setSelectedUser,
  }: {
    users?: AppointmentPatient[] | undefined;
    selectedUser: AppointmentPatient | null;
    setSelectedUser: (user: AppointmentPatient) => void;
  } = useContext(OTPPatientUserContext);

  const NavItems = GetNavItems(selectedUser);

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
        <div
          className={classNames(
            "mx-2 mb-2 flex flex-wrap",
            shrinked ? "flex-row" : "flex-col",
          )}
        >
          <Select
            disabled={users?.length === 0}
            value={users ? selectedUser?.id : "Book "}
            onValueChange={(value) => {
              const user = users?.find((user) => user.id === value);
              if (user) {
                setSelectedUser(user);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue
                asChild
                placeholder={
                  !shrinked &&
                  (users?.length === 0 ? t("no_patients") : t("select_patient"))
                }
              >
                <div className="flex flex-row justify-between items-center gap-2 w-full text-primary-800">
                  {!shrinked && (
                    <div className="flex flex-row items-center gap-2">
                      <span className="font-semibold">
                        {selectedUser?.name && selectedUser?.name.length > 8
                          ? selectedUser?.name.slice(0, 8) + "..."
                          : selectedUser?.name}
                      </span>
                      <span className="text-xs text-secondary-600">
                        {t("switch_patient")}
                      </span>
                    </div>
                  )}
                  <CareIcon icon="l-users-alt" className="h-4 self-center" />
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <OTPPatientSidebarUserCard shrinked={shrinked} />
      </div>
    </nav>
  );
};
