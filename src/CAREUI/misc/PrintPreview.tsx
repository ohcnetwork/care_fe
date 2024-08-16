import { ReactNode, useState } from "react";
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

const zoom_values = [
  "scale-50",
  "scale-75",
  "scale-100",
  "scale-125",
  "scale-150",
  "scale-175",
  "scale-200",
];

export default function PrintPreview(props: Props) {
  const [zoom, setZoom] = useState(2); // Initial zoom index to 'scale-100'

  const handleZoomIn = () => {
    setZoom((prevZoom) => (prevZoom < zoom_values.length - 1 ? prevZoom + 1 : prevZoom));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => (prevZoom > 0 ? prevZoom - 1 : prevZoom));
  };

  return (
    <Page title={props.title}>
      <div className="mx-auto my-8 w-full max-w-[50rem] px-4">
        <div className="top-0 z-20 flex justify-between items-center gap-2 bg-secondary-100 px-2 py-4 xl:absolute xl:right-6 xl:top-8">
          <ButtonV2 disabled={props.disabled} onClick={() => window.print()}>
            <CareIcon icon="l-print" className="text-lg" />
            Print
          </ButtonV2>
          <div className="hidden md:flex gap-4"> {/* Hide on mobile, show on medium screens and up */}
            <ButtonV2 onClick={handleZoomOut} disabled={zoom === 0}>
              <CareIcon icon="l-search-minus" className="text-lg" />
              Zoom Out
            </ButtonV2>
            <span>{zoom_values[zoom].split('-')[1]}%</span>
            <ButtonV2 onClick={handleZoomIn} disabled={zoom === zoom_values.length - 1}>
              <CareIcon icon="l-search-plus" className="text-lg" />
              Zoom In
            </ButtonV2>
          </div>
        </div>

        <div
          className={`bg-white p-10 text-sm shadow-2xl transition-transform duration-200 ease-in-out ${zoom_values[zoom]}`} // Apply zoom scaling
          style={{ transform: 'none' }} // This will ensure transform isn't applied during printing
        >
          <div
            id="section-to-print"
            className={classNames("w-full", props.className)}
          >
            {props.children}
          </div>
        </div>
      </div>
    </Page>
  );
}
