import { ReactNode } from "react";
import ButtonV2 from "@/components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";
import Page from "@/components/Common/components/Page";
import { useTranslation } from "react-i18next";
import { ZoomControls, ZoomProvider, ZoomTransform } from "../interactive/Zoom";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
};

export default function PrintPreview({
  children,
  disabled,
  className,
  title,
}: Props) {
  const { t } = useTranslation();

  return (
    <Page title={title}>
      <div className="mx-auto my-4 w-full max-w-3xl px-4 sm:my-6 md:my-8">
        <div className="mb-4 flex justify-end sm:mb-6 md:absolute md:right-6 md:top-12">
          <ButtonV2 disabled={disabled} onClick={() => window.print()}>
            <CareIcon icon="l-print" className="mr-2 text-lg" />
            <span className="hidden sm:inline">{t("print")}</span>
          </ButtonV2>
        </div>

        <ZoomProvider>
          <ZoomTransform className="origin-top-left bg-white p-4 text-sm shadow-lg transition-all duration-200 ease-in-out sm:p-6 md:p-8 lg:p-10 lg:shadow-2xl print:transform-none">
            <div
              id="section-to-print"
              className={classNames("w-full", className)}
            >
              {children}
            </div>
          </ZoomTransform>

          <div className="mt-4 sm:mt-6">
            <ZoomControls disabled={disabled} />
          </div>
        </ZoomProvider>
      </div>
    </Page>
  );
}
