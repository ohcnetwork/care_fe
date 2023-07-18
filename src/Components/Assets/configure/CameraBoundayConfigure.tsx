import React, { useState } from "react";
import { BedModel } from "../../Facility/models";
import { flushSync } from "react-dom";
import ButtonV2, { Submit } from "../../Common/components/ButtonV2";
import Card from "../../../CAREUI/display/Card";
import ConfirmDialog from "../../Common/ConfirmDialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { direction } from "../../Facility/Consultations/LiveFeed";

interface CameraBoundaryConfigureProps {
  addBoundaryPreset: (e: React.SyntheticEvent) => void;
  deleteBoundaryPreset: () => void;
  boundaryPreset: any;
  bed: BedModel;
  toUpdateBoundary: boolean;
  setToUpdateBoundary: (toUpdate: boolean) => void;
  scrollToUpdateBoundary: () => void;
  loadingAddBoundaryPreset?: boolean;
}

interface UpdateCameraBoundaryConfigureProps {
  cameraPTZ: any;
  direction: direction;
  setDirection(direction: direction): void;
  changeDirectionalBoundary(action: "expand" | "shrink"): void;
  updateBoundaryPreset(action: "confirm" | "cancel"): void;
  updateBoundaryRef: any;
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
    scrollToUpdateBoundary,
    loadingAddBoundaryPreset,
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
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-lg font-semibold">
              {`${!boundaryPreset ? "Add" : ""}`} Boundary Preset
            </div>
            <div className="mt-2">
              <label id="asset-name">Name</label>
              <div className="text-lg">{`${
                !boundaryPreset ? bed?.name : boundaryPreset?.meta?.preset_name
              } boundary`}</div>
            </div>
          </div>
          {!boundaryPreset ? (
            <div>
              <form onSubmit={addBoundaryPreset} className="mt-2">
                <Submit
                  label="Add Boundary"
                  disabled={loadingAddBoundaryPreset}
                />
              </form>
            </div>
          ) : (
            <>
              {!toUpdateBoundary && (
                <div className="flex justify-start mt-4 gap-4">
                  <div>
                    <ButtonV2
                      variant="primary"
                      onClick={() => {
                        flushSync(() => {
                          // check if setToUpdateBoundary is defined
                          setToUpdateBoundary(true);
                        });
                        scrollToUpdateBoundary();
                      }}
                      id="update-boundary-preset"
                    >
                      Update
                    </ButtonV2>
                  </div>
                  <div>
                    <ButtonV2
                      variant="danger"
                      onClick={() => {
                        setToDeleteBoundary(boundaryPreset);
                      }}
                      id="delete-boundary-preset"
                    >
                      Delete
                    </ButtonV2>
                  </div>
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
    cameraPTZ,
    direction,
    setDirection,
    changeDirectionalBoundary,
    updateBoundaryPreset,
    updateBoundaryRef,
    previewBoundary,
    isPreview,
    boundaryPreset,
  } = props;

  return (
    <div className="mt-4 flex" ref={updateBoundaryRef}>
      <Card className="flex-initial">
        <div className="flex flex-col space-y-4">
          <div>
            <label id="asset-name">Name</label>
            <div className="text-lg font-semibold">
              {boundaryPreset?.meta?.preset_name}
            </div>
          </div>
          <div className="flex space-x-8">
            <div className="flex-initial grid grid-cols-3">
              {[
                null,
                "up",
                null,
                "left",
                null,
                "right",
                null,
                "down",
                null,
              ].map((button, index) => {
                let out = <div className="w-[20px] h-[20px]" key={index}></div>;
                if (button) {
                  out = (
                    <ButtonV2
                      size="small"
                      circle={true}
                      variant={direction === button ? "primary" : "secondary"}
                      border={true}
                      key={index}
                      onClick={() => {
                        if (direction === button) {
                          setDirection(null);
                        } else {
                          setDirection(button as direction);
                        }
                      }}
                    >
                      {button}
                    </ButtonV2>
                  );
                }
                return out;
              })}
            </div>
            <div className="flex-initial flex flex-col justify-center space-y-2 items-center">
              {" "}
              {[cameraPTZ[4], cameraPTZ[5], cameraPTZ[6]].map(
                (option, index) => {
                  const shortcutKeyDescription =
                    option.shortcutKey &&
                    option.shortcutKey
                      .join(" + ")
                      .replace("Control", "Ctrl")
                      .replace("ArrowUp", "↑")
                      .replace("ArrowDown", "↓")
                      .replace("ArrowLeft", "←")
                      .replace("ArrowRight", "→");

                  return (
                    <div key={index}>
                      <button
                        className="bg-green-100 hover:bg-green-200 border border-green-100 p-2 tooltip"
                        onClick={option.callback}
                      >
                        <span className="sr-only">{option.label}</span>
                        {option.icon ? (
                          <CareIcon className={`care-${option.icon}`} />
                        ) : (
                          <span className="font-bold flex items-center justify-center ">
                            {option.value}x
                          </span>
                        )}
                        <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm font-semibold">{`${option.label}  (${shortcutKeyDescription})`}</span>
                      </button>
                    </div>
                  );
                }
              )}
            </div>
            <div className="flex-initial flex flex-col justify-center space-y-2 items-center">
              <ButtonV2
                size="small"
                variant="primary"
                onClick={() => {
                  changeDirectionalBoundary("expand");
                }}
                disabled={isPreview || !direction}
                className="w-full"
              >
                Expand
              </ButtonV2>

              <ButtonV2
                size="small"
                variant="primary"
                onClick={() => {
                  changeDirectionalBoundary("shrink");
                }}
                disabled={isPreview || !direction}
                className="w-full"
              >
                Shrink
              </ButtonV2>
            </div>
          </div>
          <div className="flex flex-row justify-center gap-2">
            <ButtonV2
              variant="primary"
              size="small"
              onClick={() => {
                previewBoundary();
              }}
              id="preview-update-boundary-preset"
              disabled={isPreview}
            >
              Preview
            </ButtonV2>
            <ButtonV2
              variant="primary"
              size="small"
              onClick={() => {
                updateBoundaryPreset("confirm");
                setDirection(null);
              }}
              id="confirm-update-boundary-preset"
              disabled={isPreview}
            >
              Confirm
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="small"
              border={true}
              onClick={() => {
                updateBoundaryPreset("cancel");
                setDirection(null);
              }}
              id="cancel-modify-boundary-preset"
              disabled={isPreview}
            >
              Cancel
            </ButtonV2>
          </div>
        </div>
      </Card>
    </div>
  );
}
