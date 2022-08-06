import { useEffect, useState } from "react";
import { LinePlot } from "../../Facility/Consultations/components/LinePlot";

export type WaveformType = {
  data: string;
  "data-baseline": number;
  "data-high-limit": number;
  "data-low-limit": number;
  "date-time": string;
  device_id: string;
  observation_id: "waveform";
  "patient-id": number;
  "patient-name": string;
  resolution: `${number}uV`;
  "sampling rate": `${number}/sec`;
  "wave-name": string;
};

export default function Waveform(props: { wave: WaveformType }) {
  const wave = props.wave;
  const data = wave.data.split(" ").map(Number);
  const [viewableData, setViewableData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);

  const viewable = 800;
  const seconds = 5000;
  const length = data.length;
  const tpf = seconds / length;

  const [pointer, setPointer] = useState(viewable);

  useEffect(() => {
    let timeout = setTimeout(() => {
      if (!data[pointer + 1]) {
        return;
      }
      let newArr = viewableData.slice(1);
      newArr.push(data[pointer + 1]);
      setViewableData(newArr);
      setPointer(pointer + 1);
    }, tpf);

    return () => clearTimeout(timeout);
  }, [viewableData]);

  useEffect(() => {
    const wave = props.wave;
    const data = wave.data.split(" ").map(Number);

    setViewableData(data.slice(0, viewable));
    setPointer(viewable);

    let newX = [];
    for (let i = 0; i < viewable; i++) {
      newX[i] = i + 1;
    }
    setXData(newX);
  }, [props]);

  return (
    <div className="w-full">
      <LinePlot
        title="ECG"
        name="ECG"
        xData={xData}
        yData={viewableData}
        low={wave["data-low-limit"]}
        high={wave["data-high-limit"]}
        classes="h-full"
        type="WAVEFORM"
      />
    </div>
  );
}
