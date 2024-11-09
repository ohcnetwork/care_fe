import { classNames } from "@/Utils/utils";

interface Props<T extends string> {
  tabs: Record<T, string>;
  selected: T;
  onChange: (tab: T) => void;
  size?: "sm" | "md" | "lg";
}

export default function Switch<T extends string>({
  size = "sm",
  ...props
}: Props<T>) {
  return (
    <ul role="list" className="flex">
      {Object.keys(props.tabs).map((tab) => {
        return (
          <li
            key={tab}
            tabIndex={0}
            className={classNames(
              "cursor-pointer select-none border shadow-sm outline-none transition-all duration-200 ease-in-out first:rounded-l last:rounded-r focus:ring-1",
              size === "sm" && "px-2 py-1 text-xs",
              size === "md" && "px-3 py-2 text-sm",
              size === undefined && "px-3 py-2 text-sm",
              size === "lg" && "px-4 py-3 text-base",
              props.selected === tab
                ? "border-primary-500 bg-primary-500 font-semibold text-white hover:bg-primary-600 focus:border-primary-500 focus:ring-primary-500"
                : "border-secondary-400 bg-secondary-50 hover:bg-secondary-200 focus:border-primary-500 focus:ring-primary-500",
            )}
            onClick={() => props.onChange(tab as T)}
          >
            {props.tabs[tab as T]}
          </li>
        );
      })}
    </ul>
  );
}
