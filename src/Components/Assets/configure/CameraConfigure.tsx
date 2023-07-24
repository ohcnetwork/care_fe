import TextFormField from "../../Form/FormFields/TextFormField";

interface CameraConfigureProps {
  addPreset: () => void;
  setToAddPreset: (toAddPreset: boolean) => void;
  newPreset: string;
  setNewPreset(preset: string): void;
  isLoading: boolean;
}
export default function CameraConfigure(props: CameraConfigureProps) {
  const { addPreset, newPreset, setNewPreset, isLoading, setToAddPreset } =
    props;

  return (
    <div className="flex flex-col flex-wrap mt-2">
      <div className="flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800 text-2xl bg-gray-300 rounded-lg">
        Add preset
      </div>
      <div className="flex-1 py-4">
        <label id="location">Preset Name</label>
        <TextFormField
          name="name"
          id="location"
          type="text"
          value={newPreset}
          className=""
          onChange={(e) => setNewPreset(e.value)}
          error=""
        />
        <div className="flex flex-row gap-2 justify-center">
          <button
            className="flex-1 p-4  font-bold text-center  text-gray-800 hover:text-white hover:bg-gray-500 bg-gray-200 rounded-md"
            disabled={isLoading}
            onClick={() => {
              setToAddPreset(false);
              setNewPreset("");
            }}
          >
            Cancel
          </button>
          <button
            className="flex-1 p-4  font-bold text-center  tex-gray-800 hover:text-white hover:bg-green-500 bg-green-200 rounded-md"
            disabled={isLoading}
            onClick={async () => {
              await addPreset();
              setToAddPreset(false);
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* <Card className="mt-4">
        <LiveFeed
          middlewareHostname={facilityMiddlewareHostname}
          asset={getCameraConfig(asset)}
          showRefreshButton={true}
          refreshPresetsHash={refreshPresetsHash}
          boundaryPreset={boundaryPreset}
          setBoundaryPreset={setBoundaryPreset}
          updateBoundaryPreset={updateBoundaryPreset}
          toUpdateBoundary={toUpdateBoundary}
          updateBoundaryRef={updateBoundaryRef}
        />
      </Card> */}
    </div>
  );
}
