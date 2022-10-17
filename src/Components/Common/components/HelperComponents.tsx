import { Transition, TransitionEvents } from "@headlessui/react";
import { Fragment, ReactNode } from "react";

type DropdownMenuTransitionProps = {
  show?: boolean | undefined;
  children: ReactNode;
} & TransitionEvents;

export const DropdownMenuTransition = ({
  show,
  children,
  ...transitionEvents
}: DropdownMenuTransitionProps) => (
  <Transition
    show={show}
    as={Fragment}
    leave="transition ease-in duration-200"
    enter="transition ease-out duration-100"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
    {...transitionEvents}
  >
    {children}
  </Transition>
);
