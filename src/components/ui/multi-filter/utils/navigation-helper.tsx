import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Separator } from "@/components/ui/separator";
import useBreakpoints from "@/hooks/useBreakpoints";

export default function NavigationHelper({
  isActiveFilter,
}: {
  isActiveFilter?: boolean;
}) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ sm: false, default: true });

  return (
    <>
      {isMobile ? (
        <></>
      ) : (
        <>
          <Separator orientation="horizontal" className="bg-border h-px" />
          <div className="flex justify-between">
            <div className="flex gap-1 my-2 mx-2">
              {isActiveFilter && (
                <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                  <CareIcon icon="l-arrow-left" className="h-4 w-4" />
                </div>
              )}
              <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                <CareIcon icon="l-arrow-down" className="h-4 w-4" />
              </div>
              <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                <CareIcon icon="l-arrow-up" className="h-4 w-4" />
              </div>
              {!isActiveFilter && (
                <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                  <CareIcon icon="l-arrow-right" className="h-4 w-4" />
                </div>
              )}
              <span className="text-xs text-muted-foreground self-center">
                {t("navigate")}
              </span>
            </div>
            {isActiveFilter ? (
              <div className="flex gap-1 my-2 mx-2">
                <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                  <CareIcon icon="l-space-key" className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground self-center">
                  {t("select")}
                </span>
              </div>
            ) : (
              <div className="flex gap-1 my-2 mx-2">
                <div className="bg-muted-background shadow-full rounded-md px-1 border border-strong-border">
                  <CareIcon icon="l-enter" className="h-4 w-4" />
                </div>
                <span className="text-xs text-muted-foreground self-center">
                  {t("open")}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
