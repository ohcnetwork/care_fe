import { ReactNode } from "react";
import useAppHistory from "../../Common/hooks/useAppHistory";
import ButtonV2 from "../../Components/Common/components/ButtonV2";
import CareIcon from "../icons/CareIcon";
import { classNames } from "../../Utils/utils";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export default function PrintPreview(props: Props) {
  const { goBack } = useAppHistory();

  return (
    <div className="mx-auto my-8 w-[48rem]">
      <div className="top-0 z-20 flex justify-end gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6">
        <ButtonV2 disabled={props.disabled} onClick={() => window.print()}>
          <CareIcon icon="l-print" className="text-lg" />
          Print
        </ButtonV2>
        <ButtonV2 variant="secondary" onClick={() => goBack()}>
          <CareIcon icon="l-times" className="text-lg" /> Close
        </ButtonV2>
      </div>

      <div className="bg-white p-6 text-sm shadow-2xl transition-all duration-200 ease-in-out">
        <div
          id="section-to-print"
          className={classNames("w-full p-4", props.className)}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}
