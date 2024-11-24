import { ReactNode } from "react";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";
import Page from "@/components/Common/components/Page";
import useBreakpoints from "@/common/hooks/useBreakpoints";
import { useTranslation } from "react-i18next";
import { ZoomControls, ZoomProvider, ZoomTransform } from "../interactive/Zoom";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
  onClose?: boolean;
  closeFeature?: (value: boolean) => void;
};

export default function PrintPreview(props: Props) {
  const normalScale = useBreakpoints({ default: 0.44, md: 1 });
  const { t } = useTranslation();

  return (
    <Page title={props.title}>
      <div className="mx-auto my-8 max-w-full px-4 lg:w-[50rem]">
        <div className="mb-3 flex flex-wrap justify-end gap-2">
          <ButtonV2 disabled={props.disabled} onClick={print}>
            <CareIcon icon="l-print" className="text-lg" />
            {t("print")}
          </ButtonV2>
          {props.onClose && (
            <ButtonV2
              variant="secondary"
              onClick={() => props.closeFeature && props.closeFeature(false)}
            >
              <CareIcon icon="l-times" className="mr-2 text-base" />{" "}
              {t("close")}
            </ButtonV2>
          )}
        </div>

        <ZoomProvider initialScale={normalScale}>
          <ZoomTransform className="origin-top-left bg-white p-4 text-sm shadow-2xl transition-all duration-200 ease-in-out lg:origin-top lg:p-10 print:transform-none">
            <div
              id="section-to-print"
              className={classNames("w-full", props.className)}
            >
              {props.children}
            </div>
          </ZoomTransform>

          <div className="hidden sm:block">
            <ZoomControls disabled={props.disabled} />
          </div>
        </ZoomProvider>
      </div>
    </Page>
  );
}
