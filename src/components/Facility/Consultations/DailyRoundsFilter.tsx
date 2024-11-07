import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import DateFormField from "@/components/Form/FormFields/DateFormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import { FieldChangeEvent } from "@/components/Form/FormFields/Utils";
import { DailyRoundTypes, DailyRoundsModel } from "@/components/Patient/models";

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

  const isFilterApplied = Object.values(filter ?? {}).some(
    (val) => val !== undefined,
  );

  return (
    <Popover className="relative mt-3">
      <PopoverButton>
        <ButtonV2
          variant={isFilterApplied ? "primary" : "secondary"}
          className="border p-3"
        >
          <CareIcon icon="l-filter" />
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
        <PopoverPanel className="absolute right-0 z-30 mt-1 w-80 px-4 sm:px-0 md:w-96 lg:max-w-3xl">
          <div className="rounded-lg shadow-lg ring-1 ring-secondary-400">
            <div className="rounded-t-lg bg-secondary-100 px-6 py-4">
              <div className="flow-root rounded-md">
                <span className="block text-sm text-secondary-800">
                  {t("filter_by")}
                </span>
              </div>
            </div>
            <div className="relative flex flex-col gap-4 rounded-b-lg bg-white p-6">
              <SelectFormField
                {...field("rounds_type")}
                label={t("LOG_UPDATE_FIELD_LABEL__rounds_type")}
                options={DailyRoundTypes}
                placeholder={t("show_all")}
                optionLabel={(o) => t(`ROUNDS_TYPE__${o}`)}
                optionValue={(o) => o}
              />
              <DateFormField
                {...field("taken_at_after")}
                label="Measured after"
                value={
                  field("taken_at_after").value
                    ? new Date(field("taken_at_after").value as string)
                    : new Date()
                }
                onChange={(e) =>
                  field("taken_at_after").onChange({
                    ...e,
                    value: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                  })
                }
                max={new Date()}
                errorClassName="hidden"
                allowTime
              />
              <DateFormField
                {...field("taken_at_before")}
                label="Measured before"
                value={
                  field("taken_at_before").value
                    ? new Date(field("taken_at_before").value as string)
                    : new Date()
                }
                onChange={(e) =>
                  field("taken_at_before").onChange({
                    ...e,
                    value: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                  })
                }
                max={new Date()}
                errorClassName="hidden"
                allowTime
              />

              <PopoverButton>
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
              </PopoverButton>
              <PopoverButton>
                <ButtonV2
                  variant="primary"
                  onClick={() => props.onApply(filter)}
                  border
                  className="w-full"
                >
                  {t("apply")}
                </ButtonV2>
              </PopoverButton>
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}
