import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ZoomProvider, ZoomTransform } from "@/CAREUI/interactive/Zoom";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import useAppHistory from "@/hooks/useAppHistory";
import useAutoPrint, { AutoPrintOptions } from "@/hooks/useAutoPrint";
import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface WatermarkProps {
  text: string;
  color?: "red" | "gray" | "yellow";
}

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
  showBackButton?: boolean;
  watermark?: WatermarkProps;
  autoPrint?: AutoPrintOptions;
};

export default function PrintPreview(props: Props) {
  const initialScale = useBreakpoints({ default: 0.44, md: 1 });
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  useShortcutSubContext();

  const { isPrinting } = useAutoPrint({
    ...props.autoPrint,
    enabled: (props.autoPrint?.enabled ?? false) && !props.disabled,
  });

  return (
    <div className="flex items-center justify-center">
      <Page
        title={props.title}
        options={
          <div className="flex items-center gap-2">
            {props.showBackButton !== false && (
              <Button
                variant="outline"
                onClick={() => goBack()}
                data-shortcut-id="go-back"
              >
                <CareIcon icon="l-arrow-left" className="text-lg" />
                {t("back")}
              </Button>
            )}
            <Button
              variant="primary"
              disabled={props.disabled || isPrinting}
              onClick={print}
            >
              <CareIcon icon="l-print" className="text-lg" />
              {t("print")}
              <ShortcutBadge actionId="print-button" className="bg-white" />
            </Button>
          </div>
        }
      >
        <div className="mx-auto my-4 max-w-[95vw] print:max-w-none sm:my-8">
          <ZoomProvider initialScale={initialScale}>
            <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out print:transform-none max-w-[calc(100vw-1rem)]">
              <div
                id="section-to-print"
                className={cn("w-full relative", props.className)}
              >
                {props.watermark && (
                  <div
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-30",
                      "text-6xl font-bold uppercase tracking-widest opacity-20 select-none pointer-events-none z-10 whitespace-nowrap",
                      props.watermark.color === "red" && "text-red-600",
                      props.watermark.color === "gray" && "text-gray-600",
                      props.watermark.color === "yellow" && "text-yellow-600",
                      !props.watermark.color && "text-red-600",
                    )}
                  >
                    {props.watermark.text}
                  </div>
                )}
                {props.children}
              </div>
            </ZoomTransform>
          </ZoomProvider>
        </div>
      </Page>
    </div>
  );
}
