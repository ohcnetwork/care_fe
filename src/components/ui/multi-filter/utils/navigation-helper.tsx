import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerDownLeft,
  Space,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import useBreakpoints from "@/hooks/useBreakpoints";

export default function NavigationHelper({
  isActiveFilter,
}: {
  isActiveFilter?: boolean;
}) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ sm: false, default: true });

  if (isMobile) return null;

  return (
    <>
      <Separator orientation="horizontal" className="bg-gray-200 h-px" />
      <div className="flex items-center justify-between gap-2 p-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <KbdGroup>
            {isActiveFilter && (
              <Kbd>
                <ArrowLeft aria-hidden="true" />
              </Kbd>
            )}
            <Kbd>
              <ArrowDown aria-hidden="true" />
            </Kbd>
            <Kbd>
              <ArrowUp aria-hidden="true" />
            </Kbd>
            {!isActiveFilter && (
              <Kbd>
                <ArrowRight aria-hidden="true" />
              </Kbd>
            )}
          </KbdGroup>
          <span>{t("navigate")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Kbd>
            {isActiveFilter ? (
              <Space aria-hidden="true" />
            ) : (
              <CornerDownLeft aria-hidden="true" />
            )}
          </Kbd>
          <span>{isActiveFilter ? t("select") : t("open")}</span>
        </div>
      </div>
    </>
  );
}
