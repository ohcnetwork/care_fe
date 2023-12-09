import { Popover, Transition } from "@headlessui/react";
import ButtonV2 from "../../Common/components/ButtonV2";
import { FieldLabel } from "../../Form/FormFields/FormField";
import { LocationSelect } from "../../Common/LocationSelect";
import Pagination from "../../Common/Pagination";
import useFilters from "../../../Common/hooks/useFilters";
import { Fragment } from "react";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import useSlug from "../../../Common/hooks/useSlug";
import { classNames } from "../../../Utils/utils";

interface Props {
  perPageLimit: number;
  isFullscreen: boolean;
  setFullscreen: (state: boolean) => void;
  totalCount: number;
}

const LiveMonitoringFilters = (props: Props) => {
  const facilityId = useSlug("facility");
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: props.perPageLimit,
  });

  return (
    <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
      <Popover className="relative">
        <Popover.Button>
          <ButtonV2 variant="secondary" border>
            <CareIcon className="care-l-setting text-lg" />
            Settings and Filters
          </ButtonV2>
        </Popover.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Popover.Panel className="absolute z-30 mt-1 w-80 -translate-x-1/3 px-4 sm:px-0 md:w-96 md:-translate-x-1/2 lg:max-w-3xl">
            <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
              <div className="rounded-t-lg bg-gray-100 px-6 py-4">
                <div className="flow-root rounded-md">
                  <span className="block text-sm text-gray-800">
                    <span className="font-bold ">{props.totalCount}</span>{" "}
                    Camera(s) present
                  </span>
                </div>
              </div>
              <div className="relative flex flex-col gap-8 rounded-b-lg bg-white p-6">
                <div>
                  <FieldLabel className="text-sm">
                    Filter by Location
                  </FieldLabel>
                  <div className="flex w-full items-center gap-2">
                    <LocationSelect
                      className="w-full"
                      key={qParams.location}
                      name="location"
                      setSelected={(location) =>
                        location
                          ? updateQuery({ location })
                          : removeFilter("location")
                      }
                      selected={qParams.location}
                      showAll={false}
                      multiple={false}
                      facilityId={facilityId}
                      errors=""
                      errorClassName="hidden"
                    />
                  </div>
                </div>
                {/* <CheckBoxFormField
                  name="in_use_by_consultation"
                  label="Hide cameras without patient"
                  value={qParams.in_use_by_consultation === "true"}
                  onChange={({ name, value }) => {
                    if (value) {
                      updateQuery({ [name]: value });
                    } else {
                      removeFilter(name);
                    }
                  }}
                  labelClassName="text-sm"
                  errorClassName="hidden"
                />
                <CheckBoxFormField
                  name="is_working"
                  label="Camera is Working"
                  value={
                    qParams.is_working === "true" ||
                    qParams.is_working === undefined
                  }
                  onChange={({ name, value }) => {
                    if (value) {
                      updateQuery({ [name]: value });
                    } else {
                      removeFilter(name);
                    }
                  }}
                  labelClassName="text-sm"
                  errorClassName="hidden"
                /> */}
                <ButtonV2
                  variant="secondary"
                  border
                  onClick={() => props.setFullscreen(!props.isFullscreen)}
                  className="tooltip !h-11"
                >
                  <CareIcon
                    className={classNames(
                      props.isFullscreen
                        ? "care-l-compress-arrows"
                        : "care-l-expand-arrows-alt",
                      "text-lg"
                    )}
                  />
                  {props.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </ButtonV2>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>

      <Pagination
        className=""
        cPage={qParams.page}
        defaultPerPage={props.perPageLimit}
        data={{ totalCount: props.totalCount }}
        onChange={(page) => updatePage(page)}
      />
    </div>
  );
};

export default LiveMonitoringFilters;
