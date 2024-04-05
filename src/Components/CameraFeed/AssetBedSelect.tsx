import { Fragment } from "react";
import useSlug from "../../Common/hooks/useSlug";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { AssetBedModel, AssetData } from "../Assets/AssetTypes";
import { BedModel } from "../Facility/models";
import { Listbox, Transition } from "@headlessui/react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useQueryParams } from "raviger";

interface Props {
  asset?: AssetData;
  bed?: BedModel;
  facilityId: string;
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

  const [qParams] = useQueryParams();
  const { data: patientBedData, loading: patientDataLoad } = useQuery(
    routes.listPatientAssetBeds,
    {
      pathParams: { facility_external_id: props.facilityId },
      query: {
        asset_class: "ONVIF",
        location: qParams.location,
        bed_is_occupied: true,
      },
    }
  );
  //Find the patient data for the bed
  const updatedData = data?.results.map((obj) => {
    if (
      patientBedData?.results?.findIndex(
        (p) => p.bed.id === obj.bed_object.id
      ) !== -1
    ) {
      return {
        ...obj,
        patient:
          patientBedData?.results[
            patientBedData?.results?.findIndex(
              (p) => p.bed.id === obj.bed_object.id
            )
          ].patient,
      };
    } else return obj;
  });
  const selected = props.value;

  return (
    <Listbox
      value={selected}
      onChange={props.onChange}
      disabled={loading && patientDataLoad}
    >
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default pr-6 text-right text-xs text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-zinc-700 sm:text-sm">
          <span className="block truncate">
            {selected?.bed_object.name ?? "No Preset"}
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
            {updatedData?.map((obj) => (
              <Listbox.Option
                key={obj.id}
                title={`${obj.patient?.name ?? "No patient"} `}
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
                      {obj.bed_object.name}: {obj.meta.preset_name}
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
