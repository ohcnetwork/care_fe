import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  asset?: any[];
  value?: any;
  onChange?: (value: any) => void;
}

export default function CameraPresetSelect(props: Props) {
  const selected = props.value;
  const selectedPresetValue = (presetObject: any) => {
    return { name: "preset", value: presetObject?.meta?.preset_name };
  };

  return (
    <Listbox value={selected} onChange={props.onChange}>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default pr-6 text-right text-xs text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-zinc-700 sm:text-sm">
          <span className="block truncate">
            {selected?.meta?.preset_name ?? "No Preset"}
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
            {props.asset?.map((obj) => (
              <Listbox.Option
                key={obj.id}
                className={({ active }) =>
                  `relative cursor-default select-none px-2 py-1 ${
                    active ? "bg-zinc-700 text-white" : "text-zinc-400"
                  }`
                }
                value={selectedPresetValue(obj)}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate text-xs md:text-sm ${
                        selected ? "font-bold text-white" : "font-normal"
                      }`}
                    >
                      {obj.meta.preset_name}
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
