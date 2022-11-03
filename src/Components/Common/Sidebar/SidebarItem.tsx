import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";

export type SidebarIcon = React.ReactNode;

type SidebarItemProps = {
  text: string;
  icon: SidebarIcon;
  external?: true | undefined;
  badgeCount?: number | undefined;
} & ({ to: string; do?: undefined } | { to?: undefined; do: () => void });

type SidebarItemBaseProps = SidebarItemProps & { shrinked?: boolean };
const SidebarItemBase = ({
  shrinked,
  external,
  ...props
}: SidebarItemBaseProps) => {
  const path = usePath();
  const { t } = useTranslation();
  const selected = props.to && path?.startsWith(props.to);

  return (
    <Link
      className={`relative w-full flex-1 min-h-[40px] md:flex-none md:h-11 text-white ${
        selected
          ? "font-bold bg-primary-900"
          : "font-normal bg-primary-800 hover:bg-primary-700"
      } tooltip transition-all duration-200 ease-in-out cursor-pointer`}
      target={external && "_blank"}
      rel={external && "noreferrer"}
      href={props.to ?? ""}
      onClick={props.do}
    >
      <span className={`tooltip-text tooltip-right ${!shrinked && "hidden"}`}>
        {props.text}
      </span>
      <div
        className={`flex items-center h-full ${
          shrinked ? "justify-center" : "justify-start pl-10 pr-9"
        } transition-all duration-200 ease-in-out`}
      >
        <div className="flex-none text-lg">{props.icon}</div>
        <span
          className={`${
            shrinked ? "hidden" : "grow"
          } w-full flex items-center text-sm pl-4 tracking-wide`}
        >
          {t(props.text)}
        </span>
        {external && !shrinked && <i className="uil uil-external-link-alt" />}
      </div>

      {!!props.badgeCount && (
        <span
          className={`absolute flex items-center justify-center text-white font-semibold bg-primary-500 ${
            shrinked
              ? "right-3 top-0.5 h-4 w-5 text-[9px] rounded-md"
              : "right-9 inset-y-0 h-6 my-auto text-xs px-2 rounded-md"
          } z-10 transition-all duration-200 ease-in-out animate-pulse`}
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
