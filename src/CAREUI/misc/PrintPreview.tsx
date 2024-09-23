import { ReactNode } from "react";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";
import Page from "../../Components/Common/components/Page";
import useBreakpoints from "../../Common/hooks/useBreakpoints";
import { useTranslation } from "react-i18next";
import { ZoomControls, ZoomProvider, ZoomTransform } from "../interactive/Zoom";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
};

export default function PrintPreview(props: Props) {
  const normalScale = useBreakpoints({ default: 0.44, md: 1 });
  const { t } = useTranslation();

  return (
    <Page title={props.title}>
      <div className="mx-auto my-8 w-[50rem]">
        <div className="top-0 z-20 flex gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6 xl:top-8 xl:justify-end">
          <ButtonV2 disabled={props.disabled} onClick={print}>
            <CareIcon icon="l-print" className="text-lg" />
            {t("print")}
          </ButtonV2>
        </div>

        <ZoomProvider initialScale={normalScale}>
          <ZoomTransform className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out lg:origin-top print:transform-none">
            <div
              id="section-to-print"
              className={classNames("w-full", props.className)}
            >
              {props.children}
            </div>
          </ZoomTransform>

          <ZoomControls disabled={props.disabled} />
        </ZoomProvider>
      </div>
    </Page>
  );
}
