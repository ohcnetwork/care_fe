import { Link, usePath } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type SidebarIcon = React.ReactNode;

interface SidebarItemProps {
  text: string;
  to: string;
  icon: SidebarIcon;
  external?: true | undefined;
}

type SidebarItemBaseProps = SidebarItemProps & { children: ReactNode };
const SidebarItemBase = (props: SidebarItemBaseProps) => {
  const path = usePath();
  const selected = path?.includes(props.to);

  return (
    <Link
      className={`w-full flex h-10 items-center justify-start text-white ${
        selected
          ? "font-bold bg-primary-900"
          : "font-normal bg-primary-800 hover:bg-primary-700"
      } transition-all duration-200 ease-in-out cursor-pointer`}
      target={props.external && "_blank"}
      rel={props.external && "noreferrer"}
      href={props.to}
    >
      {props.children}
    </Link>
  );
};

export const SidebarItem = (props: SidebarItemProps) => {
  const { t } = useTranslation();
  return (
    <SidebarItemBase {...props}>
      <div className="ml-10 mr-9 transition-all duration-200 ease-in-out">
        <div className="h-5 w-5">{props.icon}</div>
        <div className="ml-4 text-sm">{t(props.text)}</div>
        {props.external && <ExternalIcon />}
      </div>
    </SidebarItemBase>
  );
};

export const ShrinkedSidebarItem = (props: SidebarItemProps) => {
  return (
    <SidebarItemBase {...props}>
      <div className="mx-2 transition-all duration-200 ease-in-out">
        <div className="h-5 w-5">{props.icon}</div>
      </div>
    </SidebarItemBase>
  );
};

const ExternalIcon = () => (
  <i className="h-4 w-4 fa-solid fa-arrow-up-right-from-square" />
);
