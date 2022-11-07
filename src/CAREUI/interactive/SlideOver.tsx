import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export type SlideFromEdges = "left" | "top" | "right" | "bottom";

export type SlideOverProps = {
  open: boolean;
  setOpen: (state: boolean) => void;
  children: React.ReactNode;
  slideFrom?: SlideFromEdges;
};

export default function SlideOver({
  open,
  setOpen,
  children,
  slideFrom = "right",
}: SlideOverProps) {
  const EdgeTransition = TransitionFrom[slideFrom];

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-all" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
              <EdgeTransition>
                <Dialog.Panel className="pointer-events-auto w-screen max-w-fit">
                  {children}
                </Dialog.Panel>
              </EdgeTransition>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

type TransitionFromProps = { children: React.ReactNode };

const TransitionFrom: Record<
  SlideFromEdges,
  ({ children }: TransitionFromProps) => JSX.Element
> = {
  top: ({ children }) => (
    <Transition.Child
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in duration-200"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      {children}
    </Transition.Child>
  ),
  left: ({ children }) => (
    <Transition.Child
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in duration-200"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      {children}
    </Transition.Child>
  ),
  bottom: ({ children }) => (
    <Transition.Child
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in duration-200"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      {children}
    </Transition.Child>
  ),
  right: ({ children }) => (
    <Transition.Child
      as={Fragment}
      enter="transform transition ease-out duration-200"
      enterFrom="-translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in duration-200"
      leaveFrom="translate-x-0"
      leaveTo="-translate-x-full"
    >
      {children}
    </Transition.Child>
  ),
};
