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
    <div className="mt-2 flex flex-col flex-wrap">
      <div className="text-md flex-1 bg-gray-200  p-2 text-center">
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
        <div className="flex flex-row justify-center gap-2">
          <button
            className="flex-1 rounded-md  bg-gray-200 p-2  text-center font-bold text-gray-800 hover:bg-gray-500 hover:text-white"
            disabled={isLoading}
            onClick={() => {
              setToAddPreset(false);
              setNewPreset("");
            }}
          >
            Cancel
          </button>
          <button
            className="tex-gray-800 flex-1  rounded-md bg-green-200  p-2 text-center font-bold hover:bg-green-500 hover:text-white"
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
    </div>
  );
}
