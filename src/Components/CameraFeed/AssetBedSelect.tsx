import { Fragment } from "react";
import { AssetBedModel } from "../Assets/AssetTypes";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { classNames } from "../../Utils/utils";
import { dropdownOptionClassNames } from "../Form/MultiSelectMenuV2";

interface Props {
  disabled?: boolean;
  options: AssetBedModel[];
  value?: AssetBedModel;
  label?: (value: AssetBedModel) => string;
  onChange?: (value: AssetBedModel) => void;
}

export default function CameraPresetSelect(props: Props) {
  const label = props.label ?? defaultLabel;
  return (
    <>
      {/* Desktop View */}
      <div className="hidden gap-4 whitespace-nowrap pr-2 lg:flex lg:gap-1.5">
        {props.options
          .slice(0, props.options.length > 5 ? 4 : 5)
          .map((option) => {
            const selected = props.value?.id === option.id;

            return (
              <button
                className={classNames(
                  "flex min-w-16 max-w-40 items-center justify-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded border px-1.5 py-0.5 text-sm font-medium transition-all duration-500 ease-in-out hover:bg-white hover:text-black",
                  selected ? "border-current" : "border-zinc-500 text-zinc-500",
                )}
                onClick={() => props.onChange?.(option)}
              >
                {label(option)}
                {selected && (
                  <CareIcon
                    icon="l-check"
                    className="rounded-full bg-primary-500 text-base text-white"
                  />
                )}
              </button>
            );
          })}
        {props.options.length > 5 && (
          <CameraPresetDropdown
            {...props}
            placeholder="More preset"
            options={props.options.slice(4)}
            value={props.options.slice(4).find((o) => o.id === props.value?.id)}
          />
        )}
      </div>

      {/* Mobile View */}
      <div className="w-full lg:hidden">
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
      disabled={options.length === 0 || props.disabled}
    >
      <div className="relative flex-1">
        <Listbox.Button
          className={({ open }) =>
            classNames(
              "relative flex min-w-40 max-w-56 items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap rounded border px-1.5 py-1 pr-8 text-left text-sm font-medium transition-all duration-500 ease-in-out",
              selected ? "border-current" : "border-zinc-300 text-zinc-500",
              open && "rounded-b-none ring-1 ring-gray-400",
            )
          }
        >
          <span className="block truncate">
            {options.length === 0
              ? "No presets"
              : selected
                ? label(selected)
                : props.placeholder}
          </span>
          {selected && (
            <CareIcon
              icon="l-check"
              className="absolute inset-y-0 right-7 mt-1.5 rounded-full bg-primary-500 text-base text-white"
            />
          )}
          <span className="pointer-events-none absolute inset-y-0 right-0 mr-1 mt-1 flex items-center">
            <CareIcon icon="l-angle-down" className="text-xl text-zinc-400" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-20 max-h-48 w-full overflow-auto rounded-b-lg bg-white py-1 text-base shadow-lg ring-1 ring-gray-500 focus:outline-none md:max-h-60">
            {options?.map((obj) => (
              <Listbox.Option
                key={obj.id}
                className={(args) =>
                  classNames(dropdownOptionClassNames(args), "px-2 py-1.5")
                }
                value={obj}
              >
                <span>{label(obj)}</span>
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
