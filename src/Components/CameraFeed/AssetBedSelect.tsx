import { Fragment } from "react";
import { AssetBedModel } from "../Assets/AssetTypes";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  options: AssetBedModel[];
  value?: AssetBedModel;
  label?: (value: AssetBedModel) => string;
  onChange?: (value: AssetBedModel) => void;
}

export default function AssetBedSelect(props: Props) {
  const selected = props.value;

  const options = props.options.filter(({ meta }) => meta.type !== "boundary");

  const label = props.label ?? defaultLabel;

  return (
    <Listbox value={selected} onChange={props.onChange}>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default pr-6 text-right text-xs text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-zinc-700 sm:text-sm">
          <span className="block truncate">
            {selected ? label(selected) : "No Preset"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 mt-1 flex items-center">
            <CareIcon icon="l-angle-down" className="text-lg text-zinc-500" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-b-lg bg-zinc-900/75 py-1 text-base shadow-lg ring-1 ring-white/5 backdrop-blur-sm focus:outline-none sm:text-sm md:max-h-60">
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
                      className={`block truncate text-xs md:text-sm ${
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
}

const defaultLabel = ({ bed_object, meta }: AssetBedModel) => {
  return `${bed_object.name}: ${meta.preset_name}`;
};
