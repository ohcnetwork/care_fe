import { Transition, TransitionEvents } from "@headlessui/react";
import { ReactNode } from "react";

type DropdownMenuTransitionProps = {
  show?: boolean | undefined;
  children: ReactNode;
} & TransitionEvents;

export const DropdownTransition = ({
  show,
  children,
  ...transitionEvents
}: DropdownMenuTransitionProps) => (
  <Transition
    show={show}
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
