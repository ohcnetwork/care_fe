import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2 from "./components/ButtonV2";
type Callback = () => void;
type Props = {
  onClose: Callback;
  onClear: Callback;
  onApply: Callback;
};

const FilterButtons = ({ onClose, onClear, onApply }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center mb-4 w-full max-w-sm fixed -ml-4 pl-2 md:pl-4 pr-4 md:pr-8 z-10 -mt-8 pt-8 pb-4 bg-gray-50">
      <ButtonV2 variant="secondary" ghost onClick={onClose}>
        <CareIcon className="care-l-times text-lg hidden sm:block" />
        <span>{t("Cancel")}</span>
      </ButtonV2>
      <ButtonV2 variant="danger" ghost onClick={onClear}>
        <CareIcon className="care-l-filter-slash text-lg" />
        <span>{t("Clear Filters")}</span>
      </ButtonV2>
      <div className="flex-1" />
      <ButtonV2 onClick={onApply}>{t("Apply")}</ButtonV2>
    </div>
  );
};

export default FilterButtons;
