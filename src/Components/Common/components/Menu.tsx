import { Menu } from "@headlessui/react";
import { ButtonProps } from "./ButtonV2";
import { DropdownTransition } from "./HelperComponents";

export default function DropdownMenu(props: {
  title: string;
  icon: JSX.Element;
  children: JSX.Element | JSX.Element[];
  className?: string;
  buttonV2Props?: ButtonProps;
}) {
  return (
    <div className="text-right">
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button
          {...props.buttonV2Props}
          className={[
            "Button outline-offset-1",
            `button-size-${
              props.buttonV2Props?.size ? props.buttonV2Props?.size : "default"
            }`,
            `button-shape-${props.buttonV2Props?.circle ? "circle" : "square"}`,
            `button-${
              props.buttonV2Props?.variant
                ? props.buttonV2Props?.variant
                : "primary"
            }-${props.buttonV2Props?.ghost ? "ghost" : "default"}`,
            props.buttonV2Props?.shadow &&
              "shadow enabled:hover:shadow-lg enabled:hover:-translate-y-1",
            props.className,
          ].join(" ")}
        >
          <div className="flex gap-2 items-center">
            {props.icon}
            {props.title}
          </div>

          <i className="ml-2 -mr-1 text-violet-200 hover:text-violet-100 uil uil-angle-down text-2xl font-bold"></i>
        </Menu.Button>
        <DropdownTransition>
          <Menu.Items className="absolute right-0  mt-2 py-1 min-w-full sm:min-w-[250px] origin-top-right rounded-[4px] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <>{props.children}</>
          </Menu.Items>
        </DropdownTransition>
      </Menu>
    </div>
  );
}

export function DropdownItem(props: {
  children: JSX.Element | JSX.Element[];
  activeColor?: string;
}) {
  return (
    <Menu.Item>
      {({ active }) => (
        <div
          style={{
            background: `${
              active
                ? props.activeColor
                  ? props.activeColor + "1A"
                  : "#0D9F6E1A"
                : "#FFFFFF"
            }`,
            color: active
              ? props.activeColor
                ? props.activeColor
                : "#0D9F6E"
              : "#111827",
          }}
          className="rounded-[4px] m-2 px-4 py-2 text-sm cursor-pointer"
        >
          <>{props.children}</>
        </div>
      )}
    </Menu.Item>
  );
}
