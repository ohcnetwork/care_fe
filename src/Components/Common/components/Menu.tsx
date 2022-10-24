import { Menu, Transition } from "@headlessui/react";
import { ExpandMore } from "@material-ui/icons";
import { Fragment } from "react";

export default function DropdownMenu(props: {
  title: string;
  icon: JSX.Element;
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <div className="text-right">
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className="inline-flex w-full lg:justify-between justify-center rounded-[4px] bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
          <div className="flex gap-2 items-center">
            {props.icon}
            {props.title}
          </div>

          <ExpandMore
            className="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
            aria-hidden="true"
          />
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
