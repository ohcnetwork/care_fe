import { ReactNode } from "react";
import { classNames } from "../../../Utils/utils";

export const PatientDetail = ({
    name,
    children,
    className,
  }: {
    name: string;
    children?: ReactNode;
    className?: string;
  }) => {
    return (
      <div
        className={classNames(
          "inline-flex items-center whitespace-nowrap text-sm tracking-wide",
          className,
        )}
      >
        <div className="font-medium text-secondary-800">{name}: </div>
        {children != null ? (
          <span className="pl-2 font-bold">{children}</span>
        ) : (
          <div className="h-5 w-48 animate-pulse bg-secondary-200" />
        )}
      </div>
    );
  };
  