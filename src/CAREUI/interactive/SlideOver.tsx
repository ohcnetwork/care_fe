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
};

export default function SlideOver({
  open,
  setOpen,
  children,
  slideFrom = "right",
  dialogClass,
  title,
}: SlideOverProps) {
  const directionClasses = {
    left: {
      stick: "left-0",
      animateStart: "-translate-x-20",
      animateEnd: "translate-x-0",
    },
    right: {
      stick: "right-0",
      animateStart: "translate-x-20",
      animateEnd: "-translate-x-0",
    },
    top: {
      stick: "top-0",
      animateStart: "-translate-y-20",
      animateEnd: "translate-y-0",
    },
    bottom: {
      stick: "bottom-0",
      animateStart: "translate-y-20",
      animateEnd: "-translate-y-0",
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`pointer-events-none fixed md:p-2 ${directionClasses[slideFrom].stick} flex w-full h-full`}
            >
              <Transition.Child
                as={Fragment}
                enter="transition"
                enterFrom={
                  directionClasses[slideFrom].animateStart + " opacity-0"
                }
                enterTo={
                  directionClasses[slideFrom].animateEnd + " opacity-100"
                }
                leave="transition"
                leaveFrom={
                  directionClasses[slideFrom].animateEnd + " opacity-100"
                }
                leaveTo={
                  directionClasses[slideFrom].animateStart + " opacity-0"
                }
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-fit h-full">
                  <div
                    className={
                      "bg-white w-full md:w-[300px] md:rounded-xl h-full flex flex-col " +
                      dialogClass
                    }
                  >
                    <div className="flex items-center p-2 gap-2">
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
                    <div className="overflow-auto flex-1 p-3">{children}</div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
