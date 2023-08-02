import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import useAppHistory from "../../../Common/hooks/useAppHistory";

export type SidebarIcon = React.ReactNode;

type SidebarItemProps = {
  text: string;
  icon: SidebarIcon;
  external?: true | undefined;
  badgeCount?: number | undefined;
  selected?: boolean | undefined;
  handleOverflow?: any;
} & ({ to: string; do?: undefined } | { to?: string; do: () => void });

type SidebarItemBaseProps = SidebarItemProps & { shrinked?: boolean };
const SidebarItemBase = ({
  shrinked,
  external,
  ...props
}: SidebarItemBaseProps) => {
  const { t } = useTranslation();
  const { resetHistory } = useAppHistory();

  return (
    <Link
      className={`tooltip relative ml-1  mr-3 h-full min-h-[40px] flex-1 cursor-pointer rounded-lg text-white transition-all duration-200 ease-in-out md:h-11 md:flex-none
        ${
          props.selected
            ? "bg-primary-900 font-bold"
            : "bg-primary-800 font-normal hover:bg-primary-700"
        }`}
      target={external && "_blank"}
      rel={external && "noreferrer"}
      href={props.to ?? ""}
      onClick={props.do ?? resetHistory}
      onMouseEnter={() => {
        props.handleOverflow(true);
      }}
      onMouseLeave={() => {
        props.handleOverflow(false);
      }}
    >
      <span className={`tooltip-text tooltip-right ${!shrinked && "hidden"}`}>
        {t(props.text)}
      </span>
      <div
        className={`flex h-full items-center ${
          shrinked ? "justify-center" : "justify-start pl-5 pr-4"
        } transition-all duration-200 ease-in-out`}
      >
        <div className="flex-none text-lg">{props.icon}</div>
        <span
          className={`${
            shrinked ? "hidden" : "grow"
          } flex w-full items-center pl-4 text-sm tracking-wide`}
        >
          {t(props.text)}
        </span>
        {external && !shrinked && (
          <CareIcon className="care-l-external-link-alt text-lg" />
        )}
      </div>

      {!!props.badgeCount && (
        <span
          className={`absolute flex items-center justify-center bg-primary-500 font-semibold text-white ${
            shrinked
              ? "right-3 top-0.5 h-4 w-5 rounded-md text-[9px]"
              : "inset-y-0 right-4 my-auto h-6 rounded-md px-2 text-xs"
          } z-10 animate-pulse transition-all duration-200 ease-in-out`}
        >
          {props.badgeCount > 9 ? "9+" : props.badgeCount}
        </span>
      )}
    </Link>
  );
};

export const SidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase {...props} />
);

export const ShrinkedSidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase shrinked {...props} />
);
