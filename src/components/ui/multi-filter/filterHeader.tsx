import { ChevronLeft, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** Title row shared by filter pickers: back, field icon and name, close. */
function FilterHeader({
  label,
  icon,
  onBack,
  onClose,
}: {
  label: string;
  icon?: ReactNode;
  onBack?: () => void;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="filter-header"
      className="flex items-center gap-1 px-2 pt-2"
    >
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("back")}
          onClick={onBack}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2 px-1 text-sm font-semibold [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("close")}
          onClick={onClose}
        >
          <XIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default FilterHeader;
