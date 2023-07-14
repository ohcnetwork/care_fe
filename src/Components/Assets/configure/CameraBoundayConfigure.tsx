import { useState } from "react";
import { BedModel } from "../../Facility/models";
import ButtonV2, { Submit } from "../../Common/components/ButtonV2";
import { SelectFormField } from "../../Form/FormFields/SelectFormField";
import TextFormField from "../../Form/FormFields/TextFormField";
import Card from "../../../CAREUI/display/Card";
type direction = "left" | "right" | "up" | "down";

interface CameraBoundaryConfigureProps {
  addBoundaryPreset(e: any): void;
  updateBoundaryPreset(e: any): void;
  deleteBoundaryPreset(e: any): void;
  boundaryPreset: any;
  bed: BedModel;
  direction: direction;
  setDirection(direction: direction): void;
}

// interface UpdateCameraBoundaryConfigureProps {
//   placeholder: any;
// }
export default function CameraBoundaryConfigure(
  props: CameraBoundaryConfigureProps
) {
  const {
    addBoundaryPreset,
    updateBoundaryPreset,
    deleteBoundaryPreset,
    boundaryPreset,
    bed,
    direction,
    setDirection,
  } = props;
  const [toUpdate, setToUpdate] = useState<boolean>(false);
  return (
    <>
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
          {toUpdate ? (
            <div>
              <SelectFormField
                className="mt-2"
                name="direction"
                id="direction"
                label="Direction"
                required={true}
                options={["left", "right", "up", "down"]}
                optionLabel={(option) => option}
                value={direction}
                onChange={(option) => setDirection(option.value)}
                error=""
              />
              <div className="flex justify-start gap-4 mt-2">
                <div>
                  <ButtonV2
                    variant="primary"
                    onClick={updateBoundaryPreset}
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
                      setToUpdate(false);
                    }}
                    id="cancel-modify-boundary-preset"
                  >
                    Cancel
                  </ButtonV2>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-start mt-4 gap-4">
                <div>
                  <ButtonV2
                    variant="primary"
                    onClick={() => {
                      setToUpdate(true);
                    }}
                    id="update-boundary-preset"
                  >
                    Update
                  </ButtonV2>
                </div>
                <div>
                  <ButtonV2
                    variant="danger"
                    onClick={deleteBoundaryPreset}
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

export function UpdateCameraBoundaryConfigure() {
  // props: UpdateCameraBoundaryConfigureProps,
  return (
    <Card>
      <div className="gid gap-2 grid-cols-1">
        <div>Boundary preset name</div>
        <div className="grid gap-2 grid-cols-3">
          <div>direction buttons</div>
          <div>precision, zoom in and out</div>
          <div>expand and contract</div>
        </div>
        <div>confirm/cancel</div>
      </div>
    </Card>
  );
}
