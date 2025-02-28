import { ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import {
  ZoomControls,
  ZoomProvider,
  ZoomTransform,
} from "@/CAREUI/interactive/Zoom";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";
import useBreakpoints from "@/hooks/useBreakpoints";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
};

export default function PrintPreview(props: Props) {
  const normalScale = useBreakpoints({ default: 1 });
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Page title={props.title}>
      <div className="mx-auto my-8 xl:w-[50rem] border rounded-xl border-gray-200 shadow-2xl overflow-hidden">
        <div className="sticky top-0 z-20 flex gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6 xl:top-8 xl:justify-end">
          <Button variant="outline" onClick={() => goBack()}>
            <CareIcon icon="l-arrow-left" className="text-lg" />
            {t("back")}
          </Button>
          <Button variant="primary" disabled={props.disabled} onClick={print}>
            <CareIcon icon="l-print" className="text-lg" />
            {t("print")}
          </Button>
        </div>

        <div
          ref={containerRef}
          role="region"
          aria-label={t("print_preview_content") || "Print preview content"}
          tabIndex={0}
        >
          <ZoomProvider
            initialScale={normalScale}
            minScale={0.25}
            maxScale={3}
            scaleRatio={1.15}
          >
            <div className="overflow-hidden h-full w-full">
              <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-transform duration-100 ease-in-out lg:origin-top print:transform-none">
                <div
                  id="section-to-print"
                  className={cn("w-full", props.className)}
                >
                  {props.children}
                </div>
              </ZoomTransform>
            </div>
            <ZoomControls disabled={props.disabled} minimal={true} />
          </ZoomProvider>
        </div>
      </div>
    </Page>
  );
}
