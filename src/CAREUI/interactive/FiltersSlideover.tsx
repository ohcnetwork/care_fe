import { useTranslation } from "react-i18next";
import useFilters from "../../Common/hooks/useFilters";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import SlideOver from "./SlideOver";

type AdvancedFilter = ReturnType<typeof useFilters>["advancedFilter"];

interface Props {
  children: JSX.Element | JSX.Element[];
  advancedFilter: AdvancedFilter;
  onClear?: () => void;
  onApply?: () => void;
}

export default function FiltersSlideover({
  children,
  advancedFilter,
  onClear,
  onApply,
}: Props) {
  const { t } = useTranslation();
  return (
    <SlideOver
      {...advancedFilter}
      open={advancedFilter.show}
      setOpen={advancedFilter.setShow}
      title={
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{t("advanced_filters")}</span>
          <div className="flex items-center justify-end gap-1 mr-2">
            <ButtonV2 variant="danger" ghost onClick={onClear}>
              <CareIcon className="care-l-filter-slash text-lg" />
              <span>Clear</span>
            </ButtonV2>
            <ButtonV2 ghost onClick={onApply}>
              {t("Apply")}
            </ButtonV2>
          </div>
        </div>
      }
      dialogClass="w-full max-w-lg"
    >
      <div className="flex flex-col gap-4">{children}</div>
    </SlideOver>
  );
}
