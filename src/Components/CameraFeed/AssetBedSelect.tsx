import useSlug from "../../Common/hooks/useSlug";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import { BedModel } from "../Facility/models";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface Props {
  asset?: AssetData;
  bed?: BedModel;
  value?: AssetBedModel;
  onChange?: (value: AssetBedModel) => void;
}

export default function AssetBedSelect(props: Props) {
  const facility = useSlug("facility");

  const { data, loading } = useQuery(routes.listAssetBeds, {
    query: {
      limit: 100,
      facility,
      asset: props.asset?.id,
      bed: props.bed?.id,
    },
  });

  const selected = props.value;

  return (
    <Listbox value={selected} onChange={props.onChange} disabled={loading}>
      <div className="relative">
        <ListboxButton className="relative w-full cursor-default pr-6 text-right text-xs text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-zinc-700 sm:text-sm">
          <span className="block truncate">
            {selected?.bed_object.name ?? "No Preset"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 mt-1 flex items-center">
            <CareIcon icon="l-angle-down" className="text-lg text-zinc-500" />
          </span>
        </ListboxButton>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            as="ul"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-b-lg bg-zinc-900/75 py-1 text-base shadow-lg ring-1 ring-white/5 backdrop-blur-sm focus:outline-none sm:text-sm md:max-h-60"
          >
            {data?.results.map((obj) => (
              <ListboxOption
                as="li"
                key={obj.id}
                className={({ focus }) =>
                  `relative cursor-default select-none px-2 py-1 ${
                    focus ? "bg-zinc-700 text-white" : "text-zinc-400"
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
                      {obj.bed_object.name}: {obj.meta.preset_name}
                    </span>
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
