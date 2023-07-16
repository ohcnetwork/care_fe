import { useState } from "react";
import { BedModel } from "../../Facility/models";
import { flushSync } from "react-dom";
import ButtonV2, { Submit } from "../../Common/components/ButtonV2";
import TextFormField from "../../Form/FormFields/TextFormField";
import Card from "../../../CAREUI/display/Card";
import ConfirmDialog from "../../Common/ConfirmDialog";
import CareIcon from "../../../CAREUI/icons/CareIcon";
type direction = "left" | "right" | "up" | "down" | null;

interface CameraBoundaryConfigureProps {
  addBoundaryPreset(e: any): void;
  updateBoundaryPreset(action: any): void;
  deleteBoundaryPreset(): void;
  boundaryPreset: any;
  bed: BedModel;
  toUpdateBoundary: boolean;
  setToUpdateBoundary(toUpdate: boolean): void;
  scrollToUpdateBoundary(): void;
}

interface UpdateCameraBoundaryConfigureProps {
  cameraPTZ: any;
  direction: direction;
  setDirection(direction: direction): void;
  changeDirectionalBoundary(action: "expand" | "shrink"): void;
  updateBoundaryPreset(e: any): void;
  updateBoundaryRef: any;
  previewBoundary: () => void;
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
      {!boundaryPreset && bed?.id && (
        <div className="flex flex-col justify-between">
          <div className="text-lg font-semibold">Add Boundary Preset</div>
          <form onSubmit={addBoundaryPreset} className="mt-2">
            <label id="asset-type">Name</label>
            <TextFormField
              name="boundary_preset_name"
              id="boundary-preset-name"
              value={"hello"}
              onChange={(e) => console.log(e)}
              className=""
              error=""
            />
            <div className="flex justify-start mt-4">
              <Submit label="Add Boundary" />
            </div>
          </form>
        </div>
      )}
      {boundaryPreset && bed?.id && (
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-lg font-semibold">Boundary Preset</div>
            <div className="mt-2">
              <label id="asset-name">Name</label>
              <div className="text-lg">{boundaryPreset.meta.preset_name}</div>
            </div>
          </div>
          {toUpdateBoundary ? (
            <div>
              {/* <div className="flex justify-start gap-4 mt-2">
                <div>
                  <ButtonV2
                    variant="primary"
                    onClick={() => {
                      updateBoundaryPreset("confirm");
                    }}
                    id="confirm-update-boundary-preset"
                  >
                    Confirm
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    variant="secondary"
                    border={true}
                    onClick={() => {
                      updateBoundaryPreset("cancel");
                      setToUpdate(false);
                    }}
                    id="cancel-modify-boundary-preset"
                  >
                    Cancel
                  </ButtonV2>
                </div>
              </div> */}
            </div>
          ) : (
            <>
              <div className="flex justify-start mt-4 gap-4">
                <div>
                  <ButtonV2
                    variant="primary"
                    onClick={() => {
                      flushSync(() => {
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
  } = props;

  return (
    <div className="mt-4 max-w-lg" ref={updateBoundaryRef}>
      <Card>
        <div className="flex flex-col space-y-4">
          <div>
            <label id="asset-name">Name</label>
            <div className="text-lg font-semibold">Boundary Preset</div>
          </div>
          <div className="grid gap-2 grid-cols-3">
            <div className="grid grid-cols-3">
              {[
                false,
                "up",
                false,
                "left",
                false,
                "right",
                false,
                "down",
                false,
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
            <div className="flex flex-col justify-end gap-2">
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
                        {/* <span className="sr-only">{option.label}</span> */}
                        {option.icon ? (
                          <CareIcon className={`care-${option.icon}`} />
                        ) : (
                          <span className="px-2 font-bold h-full w-8 flex items-center justify-center ">
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
            <div className="flex flex-col justify-center gap-2">
              <div>
                <ButtonV2
                  size="small"
                  variant="primary"
                  onClick={() => {
                    changeDirectionalBoundary("expand");
                  }}
                >
                  Expand
                </ButtonV2>
              </div>
              <div>
                <ButtonV2
                  size="small"
                  variant="primary"
                  onClick={() => {
                    changeDirectionalBoundary("shrink");
                  }}
                >
                  Shrink
                </ButtonV2>
              </div>
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
            >
              Preview
            </ButtonV2>
            <ButtonV2
              variant="primary"
              size="small"
              onClick={() => {
                updateBoundaryPreset("confirm");
              }}
              id="confirm-update-boundary-preset"
            >
              Confirm
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="small"
              border={true}
              onClick={() => {
                updateBoundaryPreset("cancel");
              }}
              id="cancel-modify-boundary-preset"
            >
              Cancel
            </ButtonV2>
          </div>
        </div>
      </Card>
    </div>
  );
}
