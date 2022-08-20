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
  const [queueData, setQueueData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);

  const viewable = 600;
  const tpf = 3500 / data.length;

  useEffect(() => {
    setQueueData(queueData.concat(data));
    setXData(Array.from(Array(viewable).keys()));

    let seconds = 1;

    console.log("Data recieved");

    let timer = setInterval(() => {
      console.log(seconds);
      seconds++;
    }, 1000);

    return () => clearInterval(timer);
  }, [props]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      setQueueData(queueData.slice(1));
    }, tpf);
    return () => clearTimeout(timeout);
  }, [queueData]);

  return (
    <div className="w-full">
      <LinePlot
        title="ECG"
        name="ECG"
        xData={xData}
        yData={queueData.slice(0, viewable)}
        low={wave["data-low-limit"]}
        high={wave["data-high-limit"]}
        classes="h-full"
        type="WAVEFORM"
      />
    </div>
  );
}
