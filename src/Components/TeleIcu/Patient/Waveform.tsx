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

export default function Waveform(props: { wave: WaveformType, color?: string, title: string }) {
  const wave = props.wave;
  const data = wave.data.split(" ").map(Number);
  const [queueData, setQueueData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);

  const viewable = 600;
  const tpf = 4000 / data.length;

  useEffect(() => {
    setQueueData(queueData.concat(data));
    setXData(Array.from(Array(viewable).keys()));
    
    /*// Uncoment to see data intervals
    let seconds = 1;
    console.log("Data recieved");
    let timer = setInterval(() => {
      console.log(seconds);
      seconds++;
    }, 1000);
    return () => clearInterval(timer);
    */
    //console.log("min", Math.min(...queueData), "max", Math.max(...queueData));
    //console.log("low-limit", wave["data-low-limit"], "high-limit", wave["data-high-limit"]);
  }, [props]);

  useEffect(() => {
    
    let timeout = setTimeout(() => {
      setQueueData(queueData.slice(1));
    }, tpf);
    return () => clearTimeout(timeout);
  }, [queueData]);

  return (
    <div className="w-full relative">
      <div className="text-gray-400 absolute top-0 left-5 text-xs">
        {props.title}
      </div>
      <LinePlot
        title={props.title}
        name={props.title}
        xData={xData}
        yData={queueData.slice(0, viewable)}
        low={Math.min(...queueData)}
        high={Math.max(...queueData)}
        classes="h-[90px]"
        type="WAVEFORM"
        color={props.color || "green"}
      />
    </div>
  );
}
