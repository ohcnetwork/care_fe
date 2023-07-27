import { useState } from "react";
import { BedModel } from "../../Facility/models";
import ButtonV2 from "../../Common/components/ButtonV2";
import ConfirmDialog from "../../Common/ConfirmDialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { direction } from "../../Facility/Consultations/LiveFeed";
interface CameraBoundaryConfigureProps {
  addBoundaryPreset: () => void;
  deleteBoundaryPreset: () => void;
  boundaryPreset: any;
  bed: BedModel;
  toUpdateBoundary: boolean;
  setToUpdateBoundary: (toUpdate: boolean) => void;
  loadingAddBoundaryPreset: boolean;
  toAddPreset: boolean;
  setDirection: (direction: direction) => void;
  isPreview: boolean;
  previewBoundary: () => void;
}

interface UpdateCameraBoundaryConfigureProps {
  direction: direction;
  setDirection(direction: direction): void;
  setToUpdateBoundary: (toUpdate: boolean) => void;
  updateBoundaryInfo: Record<string, boolean>;
  setUpdateBoundaryInfo: (info: Record<string, boolean>) => void;
}
export default function CameraBoundaryConfigure(
  props: CameraBoundaryConfigureProps
) {
  const {
    addBoundaryPreset,
    deleteBoundaryPreset,
    boundaryPreset,
    bed,
    toUpdateBoundary,
    setToUpdateBoundary,
    loadingAddBoundaryPreset,
    toAddPreset,
    setDirection,
    isPreview,
    previewBoundary,
  } = props;
  const [toDeleteBoundary, setToDeleteBoundary] = useState<any>(null);
  return (
    <>
      {toDeleteBoundary && (
        <ConfirmDialog
          show
          title="Are you sure you want to delete the boundary preset?"
          description={
            <span>
              <p>
                Boundary preset:{" "}
                <strong>{toDeleteBoundary.meta.preset_name}</strong>
              </p>
              <p>
                Bed: <strong>{toDeleteBoundary.bed_object.name}</strong>
              </p>
            </span>
          }
          action="Delete"
          variant="danger"
          onClose={() => setToDeleteBoundary(null)}
          onConfirm={() => {
            deleteBoundaryPreset();
            setToDeleteBoundary(null);
          }}
        />
      )}
      {bed?.id && (
        <div className="my-4 flex flex-col">
          <div className="flex-initial">
            <div className="text-md font-semibold">
              {`${!boundaryPreset ? "Add" : ""}`} Boundary Preset
            </div>
            <div className="">
              <label id="asset-name">Name</label>
              <div className="text-md">{`${
                !boundaryPreset ? bed?.name : boundaryPreset?.meta?.preset_name
              } ${!boundaryPreset ? "boundary" : ""}`}</div>
            </div>
          </div>
          {!boundaryPreset ? (
            <div className="mt-1 flex-initial">
              <ButtonV2
                variant="primary"
                onClick={addBoundaryPreset}
                disabled={loadingAddBoundaryPreset}
                id="add-boundary-preset"
                size="small"
              >
                <CareIcon className="care-l-plus-circle" />
                Add
              </ButtonV2>
            </div>
          ) : (
            <>
              {!toUpdateBoundary && (
                <div className="mt-1 flex flex-initial justify-start gap-1">
                  <button
                    className="items-center rounded-md  bg-green-200 p-2 py-1 text-sm text-green-800 hover:bg-green-800 hover:text-green-200 "
                    onClick={() => {
                      setToUpdateBoundary(true);
                      setDirection("left");
                    }}
                    id="update-boundary-preset"
                    disabled={toAddPreset || isPreview}
                  >
                    <CareIcon className="care-l-pen" />
                  </button>
                  <button
                    className="items-center gap-2 rounded-md bg-red-200 p-2 py-1 text-sm text-red-800 hover:bg-red-800 hover:text-red-200"
                    onClick={() => {
                      setToDeleteBoundary(boundaryPreset);
                    }}
                    id="delete-boundary-preset"
                    disabled={isPreview}
                  >
                    <CareIcon className="care-l-trash" />
                  </button>
                  <button
                    className="items-center gap-2 rounded-md bg-gray-200 p-2 py-1 text-sm text-gray-800 hover:bg-gray-800 hover:text-gray-200"
                    onClick={() => {
                      previewBoundary();
                    }}
                    id="delete-boundary-preset"
                    disabled={isPreview}
                  >
                    <CareIcon className="care-l-eye" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export function UpdateCameraBoundaryConfigure(
  props: UpdateCameraBoundaryConfigureProps
) {
  const {
    direction,
    setDirection,
    setToUpdateBoundary,
    updateBoundaryInfo,
    setUpdateBoundaryInfo,
  } = props;

  const translation: Record<string, string> = {
    left: "Left",
    right: "Right",
    up: "Top",
    down: "Bottom",
  };

  const handlePrevButtonClick = () => {
    switch (direction) {
      case "left":
        setToUpdateBoundary(false);
        setDirection(null);
        setUpdateBoundaryInfo({
          left: false,
          right: false,
          up: false,
          down: false,
        });
        break;

      case "right":
        setDirection("left");
        break;

      case "up":
        setDirection("right");
        break;

      case "down":
        setDirection("up");
        break;

      default:
        break;
    }
  };

  const showUpdateBoundaryInfo = (dir: string, updated: boolean) => {
    if (dir == direction) {
      return (
        <div className="rounded-md bg-purple-100 py-1 text-center text-purple-700">
          updating
        </div>
      );
    }
    if (updated) {
      return (
        <div className="rounded-md bg-green-100 py-1 text-center text-green-700">
          updated
        </div>
      );
    }
    return (
      <div className="rounded-md bg-gray-100 py-1 text-center text-gray-700">
        not updated
      </div>
    );
  };

  const handleNextButtonClick = () => {
    switch (direction) {
      case "left":
        setDirection("right");
        break;
      case "right":
        setDirection("up");
        break;
      case "up":
        setDirection("down");
        break;
      case "down":
        setDirection(null);
        setToUpdateBoundary(false);
        setUpdateBoundaryInfo({
          left: false,
          right: false,
          up: false,
          down: false,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="mt-4 flex flex-col flex-wrap">
      <div className="text-l  flex-1 bg-gray-200  p-4 text-center text-gray-800">
        Updating boundary
      </div>
      <div className="flex flex-1 flex-col gap-2 py-4">
        {["left", "right", "up", "down"].map((dir) => {
          return (
            <div className="flex flex-1 flex-row justify-between gap-2">
              <div>{translation[dir]}</div>
              <div className="w-28">
                {showUpdateBoundaryInfo(dir, updateBoundaryInfo[dir])}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-1 flex-row gap-1">
        <button
          className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
          onClick={handlePrevButtonClick}
        >
          {direction === "left" ? "Cancel" : "Previous"}
        </button>
        <button
          className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
          onClick={handleNextButtonClick}
        >
          {direction === "down" ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
