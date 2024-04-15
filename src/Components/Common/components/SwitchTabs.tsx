import type { ReactNode } from "react";
import { classNames } from "../../../Utils/utils";

export default function SwitchTabs(props: {
  className?: string;
  isTab2Active: boolean;
  onClickTab1?: () => void;
  onClickTab2?: () => void;
  tab1: ReactNode;
  tab2: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "relative grid w-full grid-cols-2 items-center gap-4 rounded-md bg-primary-500/10 px-4 py-3 lg:w-52",
        props.className,
      )}
    >
      <div
        className={`absolute z-0 w-[50%] origin-left rounded bg-primary-500 py-4 transition-all duration-200 ease-out lg:left-1.5 ${
          props.isTab2Active ? "right-1.5 lg:translate-x-[89%]" : "left-1.5"
        }`}
      ></div>
      <div
        className={`z-10 flex cursor-pointer items-center justify-center text-sm transition-all duration-200 ease-out ${
          props.isTab2Active
            ? "text-primary-500 hover:font-medium hover:text-green-600"
            : "text-white"
        } `}
        onClick={props.onClickTab1}
      >
        {props.tab1}
      </div>
      <div
        className={`z-10 flex cursor-pointer items-center justify-center text-sm transition-all duration-200 ease-out ${
          !props.isTab2Active
            ? "ml-2 text-primary-500 hover:font-medium hover:text-green-600"
            : "text-white"
        }`}
        onClick={props.onClickTab2}
      >
        {props.tab2}
      </div>
    </div>
  );
}
