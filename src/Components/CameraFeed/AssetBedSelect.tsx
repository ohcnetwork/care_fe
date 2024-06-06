import { Fragment } from "react";
import { AssetBedModel } from "../Assets/AssetTypes";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";

interface Props {
  options: AssetBedModel[];
  value?: AssetBedModel;
  label?: (value: AssetBedModel) => string;
  onChange?: (value: AssetBedModel) => void;
}

export default function CameraPresetSelect(props: Props) {
  const label = props.label ?? defaultLabel;
  return (
    <>
      <div className="hidden gap-4 whitespace-nowrap pr-2 lg:flex lg:gap-2">
        {/* Desktop View */}
        {props.options
          .slice(0, props.options.length > 5 ? 4 : 5)
          .map((option) => (
            <button
              className={classNames(
                "min-w-16 max-w-40 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border-2 px-2 py-0.5 text-base transition-all duration-200 ease-in-out hover:bg-zinc-600",
                props.value?.id === option.id
                  ? "border-white bg-zinc-100 font-bold text-black"
                  : "border-zinc-700 font-medium text-zinc-300",
              )}
              onClick={() => props.onChange?.(option)}
            >
              {label(option)}
            </button>
          ))}
        {props.options.length > 5 && (
          <CameraPresetDropdown
            {...props}
            placeholder="More preset"
            options={props.options.slice(4)}
            value={props.options.slice(4).find((o) => o.id === props.value?.id)}
          />
        )}
      </div>
      <div className="w-full lg:hidden">
        {/* Mobile View */}
        <CameraPresetDropdown {...props} placeholder="Select preset" />
      </div>
    </>
  );
}

export const CameraPresetDropdown = (
  props: Props & { placeholder: string },
) => {
  const selected = props.value;

  const options = props.options.filter(({ meta }) => meta.type !== "boundary");

  const label = props.label ?? defaultLabel;

  return (
    <Listbox
      value={selected}
      onChange={props.onChange}
      disabled={options.length === 0}
    >
      <div className="relative flex-1">
        <Listbox.Button
          className={classNames(
            "relative min-w-32 max-w-40 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border-2 px-2 py-0.5 pr-8 text-left text-base transition-all duration-200 ease-in-out hover:bg-zinc-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-zinc-700",
            selected
              ? "border-white bg-zinc-100 font-bold text-black"
              : "border-zinc-700 font-medium text-zinc-300",
          )}
        >
          <span className="block truncate">
            {options.length === 0
              ? "No presets"
              : selected
                ? label(selected)
                : props.placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 mr-1 mt-1 flex items-center">
            <CareIcon icon="l-angle-down" className="text-xl text-zinc-400" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-b-lg bg-zinc-900/75 py-1 text-base shadow-lg ring-1 ring-white/5 backdrop-blur-sm focus:outline-none md:max-h-60">
            {options?.map((obj) => (
              <Listbox.Option
                key={obj.id}
                className={({ active }) =>
                  `relative cursor-default select-none px-2 py-1 ${
                    active ? "bg-zinc-700 text-white" : "text-zinc-400"
                  }`
                }
                value={obj}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate text-sm md:text-base ${
                        selected ? "font-bold text-white" : "font-normal"
                      }`}
                    >
                      {label(obj)}
                    </span>
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};

const defaultLabel = ({ bed_object, meta }: AssetBedModel) => {
  return `${bed_object.name}: ${meta.preset_name}`;
};
