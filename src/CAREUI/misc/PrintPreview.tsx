import { ReactNode } from "react";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";
import Page from "../../Components/Common/components/Page";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title: string;
};

export default function PrintPreview(props: Props) {
  return (
    <Page title={props.title}>
      <div className="my-8 md:mx-auto md:w-[50rem]">
        <div className="top-0 z-20 flex flex-wrap justify-end gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6 xl:top-8"></div>

        <div className="bg-white  text-sm shadow-2xl transition-all duration-200 ease-in-out md:p-10">
          <div className="flex justify-end p-5">
            <ButtonV2 disabled={props.disabled} onClick={() => window.print()}>
              <CareIcon icon="l-print" className="text-lg" />
              Print
            </ButtonV2>
          </div>
          <div
            id="section-to-print"
            className={classNames(
              "w-full scale-75 md:scale-100",
              props.className,
            )}
          >
            {props.children}
          </div>
        </div>
      </div>
    </Page>
  );
}
