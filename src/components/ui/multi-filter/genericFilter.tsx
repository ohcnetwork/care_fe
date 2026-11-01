import { type VariantProps } from "class-variance-authority";
import { useTranslation } from "react-i18next";

import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const GenericSelectedBadge = ({
  selectedValue,
  selectedLength,
  className,
  variant,
}: {
  selectedValue: string;
  selectedLength: number;
  className?: string;
  variant?: VariantProps<typeof badgeVariants>["variant"];
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
      <Badge
        variant={variant || "outline"}
        className={cn(
          "min-w-0 max-w-full overflow-hidden rounded-sm",
          className,
        )}
      >
        <span className="block min-w-0 truncate whitespace-nowrap">
          {t(selectedValue)}
        </span>
      </Badge>
      {selectedLength > 1 && (
        <Badge variant="neutral" size="sm" counter className="shrink-0">
          +{selectedLength - 1}
        </Badge>
      )}
    </div>
  );
};
