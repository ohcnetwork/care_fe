import { ReactNode } from "react";
import { classNames } from "../../Utils/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Printable({ children, className }: Props) {
  return (
    <div
      id="section-to-print"
      className={classNames("mx-auto w-full max-w-5xl bg-white", className)}
    >
      {children}
    </div>
  );
}
