import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

export type SlideFromEdges = "left" | "top" | "right" | "bottom";

export type SlideOverProps = {
  open: boolean;
  setOpen: (state: boolean) => void;
  children: React.ReactNode;
  slideFrom?: SlideFromEdges;
  dialogClass?: string;
  title?: string;
  onlyChild?: boolean;
};

export default function SlideOver({
  open,
  setOpen,
  children,
  slideFrom = "right",
  dialogClass,
  title,
  onlyChild = false,
}: SlideOverProps) {
  const directionClasses = {
    left: {
      stick: "left-0 top-0 h-full",
      animateStart: "-translate-x-20",
      animateEnd: "translate-x-0",
      proportions: " cui-slideover-x",
    },
    right: {
      stick: "right-0 top-0 h-full",
      animateStart: "translate-x-20",
      animateEnd: "-translate-x-0",
      proportions: "cui-slideover-x",
    },
    top: {
      stick: "top-0 left-0 w-full",
      animateStart: "-translate-y-20",
      animateEnd: "translate-y-0",
      proportions: "cui-slideover-y",
    },
    bottom: {
      stick: "bottom-0 left-0 w-full",
      animateStart: "translate-y-20",
      animateEnd: "-translate-y-0",
      proportions: "cui-slideover-y",
    },
  };

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
        <Transition.Child
          as={Fragment}
          enter="transition-all"
          enterFrom={directionClasses[slideFrom].animateStart + " opacity-0"}
          enterTo={directionClasses[slideFrom].animateEnd + " opacity-100"}
          leave="transition-all"
          leaveFrom={directionClasses[slideFrom].animateEnd + " opacity-100"}
          leaveTo={directionClasses[slideFrom].animateStart + " opacity-0"}
        >
          <Dialog.Panel
            className={`fixed pointer-events-auto ${
              directionClasses[slideFrom].stick
            } ${onlyChild || "md:p-2"}`}
          >
            {onlyChild ? (
              children
            ) : (
              <div
                className={
                  "bg-white md:rounded-xl flex flex-col " +
                  directionClasses[slideFrom].proportions +
                  " " +
                  dialogClass
                }
              >
                <div className="flex items-center p-2 gap-2 pt-4">
                  <button
                    className="w-8 h-8 rounded-lg flex justify-center items-center text-2xl hover:bg-black/20"
                    onClick={() => setOpen(false)}
                  >
                    <i className="uil uil-arrow-left" />
                  </button>
                  <div>
                    <h1 className="text-xl font-black">{title}</h1>
                  </div>
                </div>
                <div className="overflow-auto flex-1 p-4">{children}</div>
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
}
