import React, { useEffect, useState } from "react";
import get from "lodash.get";
import { useSelector } from "react-redux";
import { Link, navigate, usePath } from "raviger";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { IconButton, useTheme } from "@material-ui/core";
import Drawer from "@material-ui/core/Drawer";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import NotificationsList from "../Notifications/NotificationsList";
import { Close } from "@material-ui/icons";
import { PREFERENCE_SIDEBAR_KEY, SIDEBAR } from "../../Common/constants";

const LOGO = process.env.REACT_APP_LIGHT_LOGO;
const LOGO_COLLAPSE =
  process.env.REACT_APP_LIGHT_COLLAPSE_LOGO || "/images/logo_collapsed.svg";

const menus = [
  {
    title: "Facilities",
    link: "/facility",
    icon: "fas fa-hospital",
  },
  {
    title: "Patients",
    link: "/patients",
    icon: "fas fa-user-injured",
  },
  {
    title: "Assets",
    link: "/assets",
    icon: "fas fa-shopping-cart",
  },
  {
    title: "Sample Test",
    link: "/sample",
    icon: "fas fa-medkit",
  },
  {
    title: "Shifting",
    link: "/shifting",
    icon: "fas fa-ambulance",
  },
  {
    title: "Resource",
    link: "/resource",
    icon: "fas fa-heartbeat",
  },
  {
    title: "External Results",
    link: "/external_results",
    icon: "fas fa-vials",
  },
  {
    title: "Users",
    link: "/users",
    icon: "fas fa-user-friends",
  },
  {
    title: "Profile",
    link: "/user/profile",
    icon: "fas fa-user-secret",
  },
  {
    title: "Notice Board",
    link: "/notice_board/",
    icon: "fas fa-comment-alt",
  },
];

interface SideBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const SideBar: React.FC<SideBarProps> = ({ isOpen, setIsOpen }) => {
  const state: any = useSelector((state) => state);
  const { currentUser } = state;
  const loginUser = `${get(currentUser, "data.first_name", "")} ${get(
    currentUser,
    "data.last_name",
    ""
  )}`;
  const path = usePath();
  const url = path.replaceAll("/", "");

  const active = menus.reduce((acc, menu) => {
    const tag = menu.link.replaceAll("/", "");
    return url.includes(tag) ? tag : acc;
  }, "");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(768));
  const [enableCollapse, setEnableCollapse] = useState(
    localStorage.getItem(PREFERENCE_SIDEBAR_KEY) === SIDEBAR.COLLAPSED
  );
  const [expanded, setExpanded] = useState(!enableCollapse);
  const { t } = useTranslation();
  const handleSignOut = () => {
    localStorage.removeItem("care_access_token");
    localStorage.removeItem("care_refresh_token");
    localStorage.removeItem("shift-filters");
    localStorage.removeItem("external-filters");
    localStorage.removeItem("lsg-ward-data");
    navigate("/login");
    window.location.reload();
  };

  useEffect(() => {
    window.addEventListener("storage", () => {
      setEnableCollapse(
        localStorage.getItem(PREFERENCE_SIDEBAR_KEY) === SIDEBAR.COLLAPSED
      );
    });
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpanded(isMobile);

    return () => {
      setIsOpen(false);
    };
  }, [isMobile, setIsOpen]);

  useEffect(() => {
    setExpanded(isMobile || !enableCollapse);
  }, [isMobile, enableCollapse, setExpanded]);

  const open = isOpen || !isMobile;

  return (
    <Drawer
      open={open}
      onClose={() => setIsOpen(false)}
      anchor="left"
      className={clsx(
        "transition-all duration-300",
        expanded ? "w-64" : "w-14"
      )}
      PaperProps={{
        className: "bg-primary-800",
      }}
      variant={isMobile ? "temporary" : "persistent"}
      onMouseEnter={() => !isMobile && enableCollapse && setExpanded(true)}
      onMouseLeave={() => !isMobile && enableCollapse && setExpanded(false)}
    >
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300",
          expanded ? "w-64" : "w-14"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="block flex-shrink-0 w-28">
            <img
              className="m-2 p-2 h-10 w-auto transition"
              src={expanded ? LOGO : LOGO_COLLAPSE}
              alt="care logo"
            />
          </Link>
          <IconButton
            aria-label="Close Sidebar"
            className="md:hidden text-white fill-current"
            onClick={() => setIsOpen(false)}
          >
            <Close color="inherit" />
          </IconButton>
        </div>
        <nav className="flex-1 px-2 overflow-x-hidden">
          {menus.map((item) => {
            return (
              <Link
                key={item.title}
                href={item.link}
                className={clsx(
                  "flex justify-items-start items-center overflow-hidden w-10 py-1 my-1 hover:bg-primary-700 hover:text-white rounded transition-all duration-300",
                  active === item.link.replaceAll("/", "")
                    ? "bg-primary-900 hover:bg-primary-900 text-white"
                    : "bg-primary-800 text-primary-300",
                  expanded && "w-60"
                )}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-8">
                  <i className={clsx(item.icon, "text-lg")}></i>
                </div>
                {
                  <div
                    className={clsx(
                      "transition-all duration-300 whitespace-no-wrap",
                      expanded ? "w-60" : "w-0"
                    )}
                  >
                    {t(item.title)}
                  </div>
                }
              </Link>
            );
          })}
          <NotificationsList expanded={expanded} />

          <a
            key="dashboard"
            href={process.env.REACT_APP_DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className={clsx(
              "flex justify-items-start items-center overflow-hidden w-10 py-1 my-1 hover:bg-primary-700 hover:text-white rounded transition-all duration-300 text-primary-300",
              expanded && "w-60"
            )}
          >
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-9">
              <i className={clsx("fas fa-tachometer-alt", "text-lg")}></i>
            </div>

            <div
              className={clsx(
                "transition-all duration-300 whitespace-no-wrap",
                expanded ? "w-60" : "w-0"
              )}
            >
              {t("Dashboard")}
            </div>
          </a>
        </nav>

        <div
          className={clsx(
            "fixed bottom-0 flex flex-no-wrap items-center ml-2 overflow-hidden transition-all duration-300 py-4",
            expanded ? "w-60" : "w-10"
          )}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-10">
            <div className="flex items-center justify-center bg-white rounded-full w-8 h-8">
              <i className="block fas fa-user text-base text-primary-800"></i>
            </div>
          </div>
          <div className="ml-3 overflow-hidden whitespace-no-wrap">
            <p className="text-base leading-5 font-medium text-white mb-1">
              {loginUser}
            </p>
            <p
              onClick={handleSignOut}
              className="cursor-pointer text-sm leading-4 font-medium text-primary-200 group-hover:text-primary-100 transition ease-in-out duration-150"
            >
              {t("sign_out")}
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
