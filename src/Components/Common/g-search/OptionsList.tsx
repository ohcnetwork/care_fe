import clsx from "clsx";
import { OptionsListProps as Props } from "./types";

const defaultRender = (
  item: any,
  tag: string,
  _type: string,
  label?: (item: any) => string
) => (
  <div className="flex items-center p-2 cursor-pointer rounded-sm hover:bg-gray-200 shadow">
    <span className="text-sm text-gray-400">{tag}</span>
    <span className="ml-2">{label?.(item) ?? item.name}</span>
  </div>
);

const OptionsList = ({
  options,
  filter,
  onSelect,
  onHover,
  className,
  list = "column",
  optionClassName,
}: Props) => {
  return (
    <ul
      className={clsx(
        "flex mt-1 p-2 gap-2 border-gray-50 overflow-y-auto",
        list === "row" ? "flex-row flex-wrap" : "flex-col",
        className
      )}
    >
      {options
        .filter(({ item, tag, type }) => filter?.(item, tag, type) ?? true)
        .map(({ item, tag, type, className, render, label }, i) => (
          <li
            key={i}
            onClick={onSelect?.bind(null, item, tag, type)}
            onMouseOver={onHover?.bind(null, item, tag, type)}
            className={optionClassName ?? className}
          >
            {render?.(item, tag, type) ?? defaultRender(item, tag, type, label)}
          </li>
        ))}
    </ul>
  );
};

export default OptionsList;
