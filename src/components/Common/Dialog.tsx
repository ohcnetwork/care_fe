import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

import { classNames } from "@/Utils/utils";

type DialogProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
  fixedWidth?: boolean;
};

const DialogModal = (props: DialogProps) => {
  const {
    title,
    description,
    show,
    onClose,
    children,
    className,
    fixedWidth = true,
  } = props;
  return (
    <div>
      <Transition appear show={show}>
        <Dialog as="div" className="relative z-30" onClose={onClose}>
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel
                  className={classNames(
                    className,
                    fixedWidth && "w-full max-w-md",
                    "transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all",
                  )}
                >
                  <DialogTitle
                    as="h4"
                    className="flex w-full flex-col text-lg font-medium leading-6 text-secondary-900"
                  >
                    <div className="w-full">
                      <h4>{title}</h4>
                      <p className="mt-2 text-sm text-secondary-600">
                        {description}
                      </p>
                    </div>
                    {props.titleAction}
                  </DialogTitle>
                  {children}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default DialogModal;
