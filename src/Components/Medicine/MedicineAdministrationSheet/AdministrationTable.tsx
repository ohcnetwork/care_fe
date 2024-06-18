import { useTranslation } from "react-i18next";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import useRangePagination from "../../../Common/hooks/useRangePagination";
import { classNames, formatDateTime } from "../../../Utils/utils";
import ButtonV2 from "../../Common/components/ButtonV2";
import { Prescription } from "../models";
import MedicineAdministrationTableRow from "./AdministrationTableRow";

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
        <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium text-black">
          <tr>
            <th className="sticky left-0 z-20 bg-gray-50 py-3 pl-4 text-left">
              <div className="flex justify-between gap-2">
                <span className="text-sm">{t("medicine")}</span>
                <span className="hidden px-2 text-center text-xs leading-none lg:block">
                  <p>Dosage &</p>
                  <p>
                    {prescriptions[0]?.dosage_type !== "PRN"
                      ? "Frequency"
                      : "Indicator"}
                  </p>
                </span>
              </div>
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
                      ? "text-base font-bold text-gray-800"
                      : "text-sm font-semibold text-gray-700",
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

        <tbody className="divide-y divide-gray-200">
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
