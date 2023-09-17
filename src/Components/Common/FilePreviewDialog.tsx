import CircularProgress from "./components/CircularProgress";
import { useTranslation } from "react-i18next";
import { StateInterface } from "../Patient/FileUpload";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import ButtonV2 from "./components/ButtonV2";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import CareIcon from "../../CAREUI/icons/CareIcon";

export const zoom_values = [
  "h-1/6 w-1/6 my-40",
  "h-2/6 w-2/6 my-32",
  "h-3/6 w-3/6 my-24",
  "h-4/6 w-4/6 my-20",
  "h-5/6 w-5/6 my-16",
  "h-full w-full my-12",
];

type FilePreviewProps = {
  title?: ReactNode;
  description?: ReactNode;
  show: boolean;
  onClose: () => void;
  file_state: StateInterface;
  setFileState: Dispatch<SetStateAction<StateInterface>>;
  downloadURL?: string;
  fileUrl: string;
  className?: string;
  titleAction?: ReactNode;
  fixedWidth?: boolean;
};

const FilePreviewDialog = (props: FilePreviewProps) => {
  const { show, onClose, file_state, setFileState, downloadURL, fileUrl } =
    props;
  const { t } = useTranslation();

  const handleZoomIn = () => {
    const checkFull = file_state.zoom === zoom_values.length;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom + 1 : file_state.zoom,
    });
  };

  const handleZoomOut = () => {
    const checkFull = file_state.zoom === 1;
    setFileState({
      ...file_state,
      zoom: !checkFull ? file_state.zoom - 1 : file_state.zoom,
    });
  };

  const handleRotate = (rotation: number) => {
    setFileState((prev: any) => ({
      ...prev,
      rotation: prev.rotation + rotation,
    }));
  };

  const [, setOpen] = useState(false);

  return (
    <SlideOver
      onCloseClick={onClose}
      open={show}
      setOpen={setOpen}
      title={file_state.name}
      slideFrom="bottom"
      dialogClass="h-full"
    >
      {fileUrl && fileUrl.length > 0 ? (
        <div className="flex">
          <div className="h-[80vh] w-full">
            {file_state.isImage ? (
              <img
                src={fileUrl}
                alt="file"
                className={
                  "mx-auto object-contain " + zoom_values[file_state.zoom]
                }
                style={{
                  transform: `rotate(${file_state.rotation}deg)`,
                }}
              />
            ) : (
              <iframe
                title="Source Files"
                src={fileUrl}
                className="mx-auto h-5/6 w-5/6 border-2 border-black bg-white md:my-6 md:w-4/6"
              />
            )}
            <div className="relative bottom-5 flex items-center justify-center gap-3">
              {file_state.isImage && (
                <>
                  {[
                    [
                      t("Zoom In"),
                      "search-plus",
                      handleZoomIn,
                      file_state.zoom === zoom_values.length,
                    ],
                    [
                      t("Zoom Out"),
                      "search-minus",
                      handleZoomOut,
                      file_state.zoom === 1,
                    ],
                    [
                      t("Rotate Left"),
                      "corner-up-left",
                      () => handleRotate(-90),
                      false,
                    ],
                    [
                      t("Rotate Right"),
                      "corner-up-right",
                      () => handleRotate(90),
                      false,
                    ],
                  ].map((button, index) => (
                    <ButtonV2
                      key={index}
                      onClick={button[2] as () => void}
                      disabled={button[3] as boolean}
                      variant="secondary"
                      border={true}
                    >
                      <CareIcon className={`care-l-${button[1]} mr-2`} />
                      {button[0] as string}
                    </ButtonV2>
                  ))}
                </>
              )}
              {downloadURL && downloadURL.length > 0 && (
                <ButtonV2 variant="primary">
                  <a
                    href={downloadURL}
                    className="text-white"
                    download={`${file_state.name}.${file_state.extension}`}
                  >
                    <CareIcon className="care-l-file-download mr-2" />
                    Download
                  </a>
                </ButtonV2>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <CircularProgress />
          </div>
        </div>
      )}
    </SlideOver>
  );
};

export default FilePreviewDialog;
