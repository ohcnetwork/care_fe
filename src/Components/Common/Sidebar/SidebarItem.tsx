import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "../../../Common/icons";

export type SidebarIcon = React.ReactNode;

type SidebarItemProps = {
  text: string;
  icon: SidebarIcon;
  external?: true | undefined;
  badgeCount?: number | undefined;
} & ({ to: string; do?: undefined } | { to?: undefined; do: () => void });

type SidebarItemBaseProps = SidebarItemProps & { shrinked?: boolean };
const SidebarItemBase = (props: SidebarItemBaseProps) => {
  const path = usePath();
  const { t } = useTranslation();
  const selected = props.to && path?.includes(props.to);

  return (
    <Link
      className={`relative w-full flex-1 min-h-[40px] md:flex-none md:h-10 text-white ${
        selected
          ? "font-bold bg-primary-900"
          : "font-normal bg-primary-800 hover:bg-primary-700"
      } tooltip transition-all duration-200 ease-in-out cursor-pointer`}
      target={props.external && "_blank"}
      rel={props.external && "noreferrer"}
      href={props.to ?? ""}
      onClick={props.do}
    >
      <span
        className={`tooltip-text tooltip-right ${!props.shrinked && "hidden"}`}
      >
        {props.text}
      </span>
      <div
        className={`flex items-center h-full ${
          props.shrinked ? "justify-center" : "justify-start ml-10 mr-9"
        } transition-all duration-200 ease-in-out`}
      >
        <div className="flex-none h-5 w-5 fill-white">{props.icon}</div>

        <div
          className={`${
            props.shrinked ? "hidden" : "grow"
          } w-full flex items-center`}
        >
          <div className="text-sm pl-4 grow">{t(props.text)}</div>
          {props.external && (
            <div className="flex-none h-4 w-4 fill-white">
              <ExternalLink />
            </div>
          )}
        </div>
      </div>
      {!!props.badgeCount && (
        <span className="absolute right-9 inset-y-0 h-6 my-auto flex items-center justify-center text-xs text-white font-semibold bg-primary-500 px-2 rounded-md z-10 transition-all duration-200 ease-in-out animate-pulse">
          {props.badgeCount > 9 ? "9+" : props.badgeCount}
        </span>
      )}
      {/* {!!props.badgeCount && (
        <span className="absolute top-1 left-9 w-5 h-5 flex items-center justify-center text-[10px] text-white bg-primary-300 bg-opacity-80 rounded-full z-10">
          {props.badgeCount > 9 ? "9+" : props.badgeCount}
        </span>
      )} */}
    </Link>
  );
};

export const SidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase {...props} />
);

export const ShrinkedSidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase shrinked {...props} />
);
