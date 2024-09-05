import { ReactNode, useState } from "react";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";
import Page from "../../Components/Common/components/Page";
import useBreakpoints from "../../Common/hooks/useBreakpoints";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
};

export default function PrintPreview(props: Props) {
  const normalScale = useBreakpoints({ default: 0.44, md: 1 });
  const [scale, setScale] = useState(normalScale);

  return (
    <Page title={props.title}>
      <div className="mx-auto my-8 w-[50rem]">
        <div className="top-0 z-20 flex gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6 xl:top-8 xl:justify-end">
          <ButtonV2 disabled={props.disabled} onClick={() => print()}>
            <CareIcon icon="l-print" className="text-lg" />
            Print
          </ButtonV2>
        </div>

        <div
          className="origin-top-left bg-white p-10 text-sm shadow-2xl transition-all duration-200 ease-in-out lg:origin-top print:transform-none"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <div
            id="section-to-print"
            className={classNames("w-full", props.className)}
          >
            {props.children}
          </div>
        </div>

        <div className="absolute bottom-8 right-8 flex flex-col items-center justify-center gap-1 rounded-full border border-secondary-400 bg-white p-0.5 shadow-lg md:flex-row-reverse md:gap-2">
          <ButtonV2
            disabled={props.disabled}
            circle
            variant="secondary"
            size="small"
            shadow={false}
            className="p-2.5"
            onClick={() => setScale((scale) => scale * 1.25)}
          >
            <CareIcon icon="l-search-plus" className="text-lg" />
          </ButtonV2>
          <span className="text-sm font-semibold text-secondary-800">
            {Math.round(scale * 100)}%
          </span>
          <ButtonV2
            disabled={props.disabled}
            circle
            variant="secondary"
            size="small"
            shadow={false}
            className="p-2.5"
            onClick={() => setScale((scale) => scale / 1.25)}
          >
            <CareIcon icon="l-search-minus" className="text-lg" />
          </ButtonV2>
        </div>
      </div>
    </Page>
  );
}
