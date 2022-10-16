import { useEffect, useRef, useState } from "react";
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

export default function Waveform(props: {
  wave: WaveformType,
  color?: string,
  title: string,
  metrics?: boolean,
  classes?: string,
  defaultSpace?: boolean
  wavetype?: "STREAM" | "REFRESH"
}) {

  const { wave, color, title, metrics, classes, defaultSpace, wavetype } = props;
  const data = wave.data.split(" ").map(Number);
  const [queueData, setQueueData] = useState<number[]>([]);
  const [refreshData, setRefreshData] = useState<number[]>([]);
  const [lastData, setLastData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);
  const [lastStream, setLastStream] = useState(0);
  const [rPointer, setRPointer] = useState(0);

  const viewable = wavetype === "STREAM" ? 400 : data.length;
  const tpf = Number(wave["sampling rate"].split("/")[0]) / 1000000;
  const rtpf = viewable / 300000;
  const streamLag = Number(tpf * (queueData.length - viewable) / 1000).toFixed(2);
  const initialRender = useRef(true);

  useEffect(() => {
    if(wavetype === "STREAM") {
      setQueueData(queueData.concat(data));
    }else{

      if(lastData.length === 0) {
        setLastData(data);
      }else{
        setRefreshData(data);
      }
      setRPointer(0);
    }
    setXData(Array.from(Array(viewable).keys()));

    let seconds = 1;
    setLastStream(0);
    let timer = setInterval(() => {
      setLastStream(seconds);
      seconds++;
    }, 1000);
    return () => clearInterval(timer);

  }, [props.wave]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      if(wavetype === "STREAM") {
        if (queueData.length > 30000) {
          setQueueData(queueData.slice(-viewable));
        } else {
          setQueueData(queueData.slice(1));
        }
      }
    }, tpf);
    return () => clearTimeout(timeout);
  }, [queueData]);

  useEffect(() => {
    let timeout : NodeJS.Timeout;
    if(initialRender.current) {
      initialRender.current = false;
    }else{
      timeout = setTimeout(() => {
        setRefreshData([...data.slice(0,rPointer-10) ,...Array(20).fill(null),  ...lastData.slice(rPointer-10)]);
        setRPointer(rPointer + 1);
      }, 2);
    }
    return () => clearTimeout(timeout);
  },[refreshData]);

  useEffect(()=>{
    if(refreshData.length === 0) {
      setRefreshData(data);
    }
  },[lastData]);

  useEffect(()=>{
    if(rPointer >= data.length) {
      setLastData(data);
      console.log("last data set");
      setRPointer(0);
    }
  }, [rPointer])

  return (
    <div className="w-full relative">
      <div className="text-gray-400 absolute top-0 left-5 text-xs">
        {title}
      </div>
      <LinePlot
        title={title}
        name={title}
        xData={xData}
        yData={
          wavetype === "STREAM" ? queueData.slice(0, viewable) : refreshData
        }
        yStart={Math.min(...( wavetype === "STREAM" ? queueData.slice(0, viewable) : refreshData))}
        yEnd={Math.max(...( wavetype === "STREAM" ? queueData.slice(0, viewable) : refreshData))}
        classes={classes || "h-[90px]"}
        type="WAVEFORM"
        color={color || "green"}
        defaultSpace={defaultSpace}
      />
      <div className="absolute bottom-0 right-5 w-full md:w-[70%]">
        {metrics && (
          <div className="flex flex-row flex-wrap justify-end gap-2 text-[10px] text-gray-400">
            <div>
              Lowest: {Math.min(...queueData.slice(0, viewable))}
            </div>
            <div>
              Highest: {Math.max(...queueData.slice(0, viewable))}
            </div>
            <div>
              Stream Length: {data.length}
            </div>
            <div>
              Buffer Length: {queueData.length}
            </div>
            <div>
              Flow Rate: {Number(tpf).toFixed(2)} ms
            </div>
            <div>
              Sampling Rate: {wave["sampling rate"]}
            </div>
            <div>
              Lag: {streamLag} sec
            </div>
            <div>
              Last response: {lastStream} sec ago
            </div>
            {queueData.length > viewable &&
              <button className="text-blue-400" onClick={() => setQueueData(queueData.slice((-1 * viewable)))}>
                Clear Buffer
              </button>
            }
          </div>
        )}
      </div>
    </div>
  );
}
