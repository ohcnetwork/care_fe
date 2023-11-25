import { Popover, Transition } from "@headlessui/react";
import ButtonV2 from "../../Common/components/ButtonV2";
import { Fragment } from "react";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DailyRoundsFilterModel } from "../models";

export const DailyRoundsFilter = (props: {
  setFilter: (data: DailyRoundsFilterModel) => void;
}) => {
  const [filter, setFilter] = useState({
    roundType: "",
    fromDateTime: "",
    toDateTime: "",
  });

  const clearFilter = () => {
    const clearedFilter = {
      roundType: "",
      fromDateTime: "",
      toDateTime: "",
    };

    setFilter(clearedFilter);

    props.setFilter(clearedFilter);
  };

  const { t } = useTranslation();
  return (
    <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
      <Popover className="relative ">
        <Popover.Button>
          <ButtonV2 variant="secondary" className="mr-5 border">
            <CareIcon className="care-l-filter" />
            Filter
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
          <Popover.Panel className="absolute right-0 z-30 mt-1 w-80 px-4 sm:px-0 md:w-96 lg:max-w-3xl">
            <div className="rounded-lg shadow-lg ring-1 ring-gray-400">
              <div className="rounded-t-lg bg-gray-100 px-6 py-4">
                <div className="flow-root rounded-md">
                  <span className="block text-sm text-gray-800">Filter by</span>
                </div>
              </div>
              <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
                <SelectFormField
                  options={["NORMAL", "VENTILATOR", "ICU", "AUTOMATED"]}
                  name="ordering"
                  label={t("Round Type")}
                  optionLabel={(o) => o}
                  optionValue={(o) => o}
                  labelClassName="text-sm"
                  errorClassName="hidden"
                  value={filter.roundType}
                  onChange={({ value }) =>
                    setFilter({
                      ...filter,
                      roundType: value,
                    })
                  }
                />
                <div>
                  <TextFormField
                    id={"2"}
                    name="hihih"
                    labelClassName="hihi"
                    required
                    className="w-full"
                    label="Measured at"
                    type="datetime-local"
                    onChange={() => console.log("hi")}
                    max={dayjs().format("YYYY-MM-DDTHH:mm")}
                  />
                  <TextFormField
                    id={"11"}
                    name="hihih"
                    onChange={() => console.log("hi")}
                    required
                    className="w-full"
                    label="From"
                    type="datetime-local"
                    max={dayjs().format("YYYY-MM-DDTHH:mm")}
                  />
                </div>
                <Popover.Button>
                  <ButtonV2
                    variant="secondary"
                    onClick={() => clearFilter()}
                    border
                    className="tooltip !h-11 w-full"
                  >
                    Clear Filter
                  </ButtonV2>
                </Popover.Button>

                <Popover.Button>
                  <ButtonV2
                    variant="primary"
                    onClick={() => {
                      props.setFilter(filter);
                    }}
                    border
                    className="tooltip !h-11 w-full"
                  >
                    Apply Filter
                  </ButtonV2>
                </Popover.Button>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
};
