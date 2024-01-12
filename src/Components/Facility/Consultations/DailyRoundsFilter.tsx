import { Popover, Transition } from "@headlessui/react";
import ButtonV2 from "../../Common/components/ButtonV2";
import { Fragment } from "react";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import FilterIcon from "../../../../public/images/icons/icons8-tick.svg";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DailyRoundTypes, DailyRoundsModel } from "../../Patient/models";
import { FieldChangeEvent } from "../../Form/FormFields/Utils";

type FilterState = {
  rounds_type?: DailyRoundsModel["rounds_type"];
  taken_at_after?: string;
  taken_at_before?: string;
};

interface Props {
  onApply: (filter: FilterState) => void;
}

export default function DailyRoundsFilter(props: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterState>({});

  const field = (name: keyof FilterState) => ({
    name,
    value: filter[name],
    onChange: (e: FieldChangeEvent<unknown>) =>
      setFilter({ ...filter, [e.name]: e.value }),
    labelClassName: "text-sm",
    errorClassName: "hidden",
  });

  const countDefinedProperties = (obj) => {
    return Object.values(obj).filter((val) => val !== undefined).length;
  };

  return (
    <div className="flex flex-row-reverse items-center gap-4 md:flex-row">
      <Popover className="relative ">
        <Popover.Button>
          <ButtonV2 variant="secondary" className="mr-5 border">
            <CareIcon className="care-l-filter" />

            {filter == undefined ||
            filter == null ||
            countDefinedProperties(filter) == 0 ? (
              t("filter")
            ) : (
              <div>
                <img src={FilterIcon} alt="Filter Icon" />
              </div>
            )}
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
                  <span className="block text-sm text-gray-800">
                    {t("filter_by")}
                  </span>
                </div>
              </div>
              <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
                <SelectFormField
                  {...field("rounds_type")}
                  label={t("Round Type")}
                  options={DailyRoundTypes}
                  placeholder={t("show_all")}
                  optionLabel={(o) => t(o)}
                  optionValue={(o) => o}
                />
                <TextFormField
                  {...field("taken_at_after")}
                  label="Measured after"
                  type="datetime-local"
                  max={dayjs().format("YYYY-MM-DDTHH:mm")}
                />
                <TextFormField
                  {...field("taken_at_before")}
                  label="Measured before"
                  type="datetime-local"
                  max={dayjs().format("YYYY-MM-DDTHH:mm")}
                />

                <Popover.Button>
                  <ButtonV2
                    variant="secondary"
                    onClick={() => {
                      setFilter({});
                      props.onApply({});
                    }}
                    border
                    className="w-full"
                  >
                    {t("clear")}
                  </ButtonV2>
                </Popover.Button>
                <Popover.Button>
                  <ButtonV2
                    variant="primary"
                    onClick={() => props.onApply(filter)}
                    border
                    className="w-full"
                  >
                    {t("apply")}
                  </ButtonV2>
                </Popover.Button>
              </div>
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
}
