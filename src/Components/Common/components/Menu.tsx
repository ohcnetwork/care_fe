import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function DropdownMenu(props: {
  title: string;
  icon: JSX.Element;
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <div className="text-right">
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className="flex w-full lg:justify-between justify-center items-center button-primary-default Button outline-offset-1 button-size-default button-shape-square">
          <div className="flex gap-2 items-center">
            {props.icon}
            {props.title}
          </div>

          <i className="ml-2 -mr-1 text-violet-200 hover:text-violet-100 uil uil-angle-down text-2xl font-bold"></i>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0  mt-2 py-1 min-w-full sm:min-w-[250px] origin-top-right rounded-[4px] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <>{props.children}</>
          </Menu.Items>
        </Transition>
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
