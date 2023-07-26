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
}

interface UpdateCameraBoundaryConfigureProps {
  cameraPTZ: any;
  direction: direction;
  setDirection(direction: direction): void;
  changeDirectionalBoundary(action: "expand" | "shrink"): void;
  updateBoundaryPreset(action: "confirm" | "cancel"): void;
  previewBoundary: () => void;
  isPreview: boolean;
  boundaryPreset: any;
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
                    }}
                    id="update-boundary-preset"
                    disabled={toAddPreset}
                  >
                    <CareIcon className="care-l-pen" />
                  </button>
                  <button
                    className="items-center gap-2 rounded-md bg-red-200 p-2 py-1 text-sm text-red-800 hover:bg-red-800 hover:text-red-200"
                    onClick={() => setToDeleteBoundary(boundaryPreset)}
                    id="delete-boundary-preset"
                  >
                    <CareIcon className="care-l-trash" />
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
  // const {
  //   // cameraPTZ,
  //   // direction,
  //   // setDirection,
  //   // changeDirectionalBoundary,
  //   // updateBoundaryPreset,
  //   // previewBoundary,
  //   // isPreview,
  //   // boundaryPreset,
  // } = props;
  console.log(props);

  return (
    <div className="mt-4 flex flex-col flex-wrap">
      <div className="flex-1 rounded-lg  bg-gray-300 p-4  text-center text-2xl font-bold text-gray-700 hover:text-gray-800">
        Update Preset
      </div>
      <div className="flex flex-1 flex-col gap-2 py-4">
        {["left", "right", "top", "bottom"].map((dir) => {
          return (
            <div className="flex flex-1 flex-row justify-between gap-2">
              <div>{dir}</div>
              <div>Not updated</div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-1 flex-row gap-1">
        <button className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800">
          <i className="fas fa-arrow-left"></i>
        </button>
        <button className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800">
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
