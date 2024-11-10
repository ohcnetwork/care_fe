import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import MedicineAdministrationTableRow from "@/components/Medicine/MedicineAdministrationSheet/AdministrationTableRow";
import { Prescription } from "@/components/Medicine/models";

import useRangePagination from "@/hooks/useRangePagination";

import { classNames, formatDateTime } from "@/Utils/utils";

interface Props {
  prescriptions: Prescription[];
  pagination: ReturnType<typeof useRangePagination>;
  onRefetch: () => void;
  readonly: boolean;
}

export default function MedicineAdministrationTable({
  readonly,
  pagination,
  prescriptions,
  onRefetch,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap">
        <thead className="sticky top-0 z-10 bg-secondary-50 text-xs font-medium text-black">
          <tr>
            <th className="sticky left-0 z-20 bg-secondary-50 py-3 pl-4 text-left">
              <span className="text-sm">{t("medicine")}</span>
            </th>
            <th>
              <span className="hidden px-2 text-center text-xs leading-none lg:block">
                <p>{t("dosage")} &</p>
                <p>
                  {prescriptions[0]?.dosage_type !== "PRN"
                    ? t("frequency")
                    : t("indicator")}
                </p>
              </span>
            </th>

            <th>
              <ButtonV2
                size="small"
                circle
                ghost
                border
                className="mx-2 px-1"
                variant="secondary"
                disabled={!pagination.hasPrevious}
                onClick={pagination.previous}
                tooltip="Previous 24 hours"
                tooltipClassName="tooltip-bottom text-xs"
              >
                <CareIcon icon="l-angle-left-b" className="text-base" />
              </ButtonV2>
            </th>
            {pagination.slots?.map(({ start }, index) => (
              <>
                <th
                  key={`administration-interval-${index}`}
                  className={classNames(
                    "leading-none",
                    start.getHours() === 0
                      ? "text-base font-bold text-secondary-800"
                      : "text-sm font-semibold text-secondary-700",
                  )}
                >
                  {formatDateTime(
                    start,
                    start.getHours() === 0 ? "DD/MM" : "h a",
                  )}
                </th>
                <th key={`administration-slot-${index}`} className="flex w-6" />
              </>
            ))}
            <th>
              <ButtonV2
                size="small"
                circle
                ghost
                border
                className="mx-2 px-1"
                variant="secondary"
                disabled={!pagination.hasNext}
                onClick={pagination.next}
                tooltip="Next 24 hours"
                tooltipClassName="tooltip-bottom -translate-x-1/2 text-xs"
              >
                <CareIcon icon="l-angle-right-b" className="text-base" />
              </ButtonV2>
            </th>

            <th className="py-3 pr-2 text-right"></th>
          </tr>
        </thead>

        <tbody className="divide-y divide-secondary-200">
          {prescriptions.map((obj, index) => (
            <MedicineAdministrationTableRow
              key={obj.id}
              id={index.toString()}
              prescription={obj}
              intervals={pagination.slots!}
              refetch={onRefetch}
              readonly={readonly}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
