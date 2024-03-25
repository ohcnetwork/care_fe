import { Dialog, Transition } from "@headlessui/react";
import { classNames } from "../../Utils/utils";
import { Fragment } from "react";
import { Submit } from "../../Components/Common/components/ButtonV2";
import { useTranslation } from "react-i18next";

type DialogProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  titleAction?: React.ReactNode;
  fixedWidth?: boolean;
  handleOk: () => void;
  label: string;
  disabled: boolean;
};

const CreateItems = (props: DialogProps) => {
  const { t } = useTranslation();
  const {
    title,
    description,
    show,
    onClose,
    children,
    className,
    fixedWidth = true,
    handleOk,
    label,
    disabled,
  } = props;
  return (
    <div className="h-max">
      <Transition appear show={show} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className={"flex min-h-fit justify-center p-4 text-center"}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={classNames(
                    className,
                    fixedWidth && "w-full max-w-md",
                    "mb-12 mt-12 transform rounded-2xl bg-white p-3 text-left align-middle shadow-xl transition-all"
                  )}
                >
                  <Dialog.Title
                    as="h4"
                    className="flex w-full flex-col text-lg font-medium leading-6 text-gray-900"
                  >
                    <div className="flex w-full items-center justify-between">
                      <h4>{title}</h4>
                      <Submit
                        onClick={handleOk}
                        label={t(label)}
                        disabled={disabled}
                      />
                    </div>
                    <p className="m-2 text-sm text-gray-600">{description}</p>
                    {props.titleAction}
                  </Dialog.Title>
                  <div>{children}</div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CreateItems;
