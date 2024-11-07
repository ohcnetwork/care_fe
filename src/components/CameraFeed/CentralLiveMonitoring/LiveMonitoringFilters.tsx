import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import { LocationSelect } from "@/components/Common/LocationSelect";
import Pagination from "@/components/Common/Pagination";
import { FieldLabel } from "@/components/Form/FormFields/FormField";

import useFilters from "@/hooks/useFilters";
import useSlug from "@/hooks/useSlug";

interface Props {
  perPageLimit: number;
  isFullscreen: boolean;
  setFullscreen: (state: boolean) => void;
  totalCount: number;
}

const LiveMonitoringFilters = (props: Props) => {
  const { t } = useTranslation();
  const facilityId = useSlug("facility");
  const { qParams, updateQuery, removeFilter, updatePage } = useFilters({
    limit: props.perPageLimit,
  });

  return (
    <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
      <Popover className="relative">
        <PopoverButton>
          <ButtonV2 variant={qParams.location ? "primary" : "secondary"} border>
            <CareIcon icon="l-setting" className="text-lg" />
            {t("settings_and_filters")}
          </ButtonV2>
        </PopoverButton>
        <Transition
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel className="absolute z-30 mt-1 w-80 -translate-x-1/3 px-4 sm:px-0 md:w-96 md:-translate-x-1/2 lg:max-w-3xl">
            <div className="rounded-lg shadow-lg ring-1 ring-secondary-400">
              <div className="rounded-t-lg bg-secondary-100 px-6 py-4">
                <div className="flow-root rounded-md">
                  <span className="block text-sm text-secondary-800">
                    <span className="font-bold">{props.totalCount}</span>{" "}
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
                <ButtonV2
                  variant="secondary"
                  border
                  onClick={() => props.setFullscreen(!props.isFullscreen)}
                  className="tooltip !h-11"
                >
                  <CareIcon
                    icon={
                      props.isFullscreen
                        ? "l-compress-arrows"
                        : "l-expand-arrows-alt"
                    }
                    className="text-lg"
                  />
                  {props.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </ButtonV2>
              </div>
            </div>
          </PopoverPanel>
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
