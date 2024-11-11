import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { CameraPreset } from "@/components/CameraFeed/routes";
import ButtonV2 from "@/components/Common/ButtonV2";
import { dropdownOptionClassNames } from "@/components/Form/MultiSelectMenuV2";

import { classNames } from "@/Utils/utils";

interface Props {
  disabled?: boolean;
  options: CameraPreset[];
  value?: CameraPreset;
  label?: (value: CameraPreset) => string;
  onChange?: (value: CameraPreset) => void;
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
              <ButtonV2
                key={option.id}
                variant={selected ? "primary" : "secondary"}
                className="min-w-16 max-w-40 text-ellipsis text-sm"
                onClick={() => props.onChange?.(option)}
                border
                size="small"
              >
                {label(option)}
                {selected && (
                  <CareIcon
                    icon="l-check"
                    className="rounded-full bg-primary-500 text-base text-white"
                  />
                )}
              </ButtonV2>
            );
          })}
        {props.options.length > 5 && (
          <CameraPresetDropdown
            {...props}
            placeholder="More presets"
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
  const label = props.label ?? defaultLabel;

  return (
    <Listbox
      value={selected}
      onChange={props.onChange}
      disabled={props.options.length === 0 || props.disabled}
    >
      <div className="relative flex-1">
        <ListboxButton
          className={classNames(
            "button-size-small button-shape-square relative inline-flex h-min min-w-32 cursor-pointer items-center gap-2 whitespace-pre pr-12 text-left text-sm font-medium shadow outline-offset-1 transition-all duration-200 ease-in-out enabled:hover:shadow-md disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500 md:min-w-40",
            selected
              ? "button-primary-default button-primary-border"
              : "button-secondary-default button-secondary-border",
          )}
        >
          <span className="block truncate">
            {props.options.length === 0
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
        </ListboxButton>
        <ListboxOptions
          modal={false}
          as="ul"
          className="absolute z-20 max-h-48 w-full overflow-auto rounded-b-lg bg-white py-1 text-base shadow-lg ring-1 ring-secondary-500 focus:outline-none md:max-h-60"
        >
          {props.options.map((obj) => (
            <ListboxOption
              as="li"
              key={obj.id}
              className={(args) =>
                classNames(dropdownOptionClassNames(args), "px-2 py-1.5")
              }
              value={obj}
            >
              <span>{label(obj)}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

const defaultLabel = (preset: CameraPreset) => {
  return `${preset.asset_bed.bed_object.name}: ${preset.name}`;
};
