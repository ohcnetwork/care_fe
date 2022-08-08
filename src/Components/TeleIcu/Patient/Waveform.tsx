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
  const data = wave.data.split(" ").map(Number); // y-axis data
  const [viewableData, setViewableData] = useState<number[]>([]); // viewable data in the stream
  const [queueData, setQueueData] = useState<number[]>([]); // overall data in queue
  const [xData, setXData] = useState<number[]>([]); // x-axis data (just numbers from 1 to yData length)

  const viewable = 800; // points visible at once
  const seconds = 5000; // number of seconds to stream a data layer
  const length = data.length; // length of the data layer
  const tpf = seconds / length; // time per frame

  useEffect(() => {

    // run this everytime we get new data

    const wave = props.wave;
    const data = wave.data.split(" ").map(Number);

    setQueueData(queueData.concat(data)); // add new data to the queue

    // set up the x-axis data according to the viewable data length
    let newX = [];
    for (let i = 0; i < viewable; i++) {
      newX[i] = i + 1;
    }
    setXData(newX);

  }, [props]);

  useEffect(() => {
    /*
    *   Set the viewable data to the first viewable points of the queue data
    */

    setViewableData(queueData.slice(0, viewable));
  }, [queueData]);

  useEffect(() => {

    /*
    *   This is the main loop that updates the viewable data.
    */

    let timeout = setTimeout(() => {
      setQueueData(queueData.slice(1)); // remove the first point from the queue
    }, tpf); // do this every tpf seconds

    return () => clearTimeout(timeout);
  }, [viewableData]);

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
