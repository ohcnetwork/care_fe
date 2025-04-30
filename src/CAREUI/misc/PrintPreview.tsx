import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ZoomProvider, ZoomTransform } from "@/CAREUI/interactive/Zoom";

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
  const initialScale = useBreakpoints({ default: 0.44, md: 1 });
  const { goBack } = useAppHistory();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center">
      <Page
        title={props.title}
        options={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => goBack()}>
              <CareIcon icon="l-arrow-left" className="text-lg" />
              {t("back")}
            </Button>
            <Button variant="primary" disabled={props.disabled} onClick={print}>
              <CareIcon icon="l-print" className="text-lg" />
              {t("print")}
            </Button>
          </div>
        }
      >
        <div className="mx-auto my-4 max-w-[95vw] print:max-w-none sm:my-8">
          <ZoomProvider initialScale={initialScale}>
            <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out print:transform-none w-[50rem]">
              <div
                id="section-to-print"
                className={cn("w-full print:py-10", props.className)}
              >
                {props.children}
              </div>
            </ZoomTransform>
          </ZoomProvider>
        </div>
      </Page>
    </div>
  );
}
