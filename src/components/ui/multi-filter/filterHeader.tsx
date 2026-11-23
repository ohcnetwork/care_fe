import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

function FilterHeader({
  label,
  onBack,
}: {
  label: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("back")}
        onClick={onBack}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default FilterHeader;
