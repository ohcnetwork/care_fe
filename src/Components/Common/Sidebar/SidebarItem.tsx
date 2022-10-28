import { Link, usePath } from "raviger";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "../../../Common/icons";

export type SidebarIcon = React.ReactNode;

type SidebarItemProps = {
  text: string;
  icon: SidebarIcon;
  external?: true | undefined;
} & ({ to: string; do?: undefined } | { to?: undefined; do: () => void });

type SidebarItemBaseProps = SidebarItemProps & { shrinked?: boolean };
const SidebarItemBase = (props: SidebarItemBaseProps) => {
  const path = usePath();
  const { t } = useTranslation();
  const selected = props.to && path?.includes(props.to);

  return (
    <Link
      className={`w-full flex-1 min-h-[40px] md:flex-none md:h-10 text-white ${
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
    </Link>
  );
};

export const SidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase {...props} />
);

export const ShrinkedSidebarItem = (props: SidebarItemProps) => (
  <SidebarItemBase shrinked {...props} />
);
