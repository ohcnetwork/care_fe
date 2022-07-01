import { useEffect, useState } from "react"
import { LinePlot } from "../../Facility/Consultations/components/LinePlot"

export type WaveformType = {
    data: string,
    "data-baseline": number
    "data-high-limit": number
    "data-low-limit": number
    "date-time": string
    device_id: string
    observation_id: "waveform"
    "patient-id": number
    "patient-name": string
    resolution: `${number}uV`
    "sampling rate": `${number}/sec`
    "wave-name": string
}

export default function Waveform(props : {wave : WaveformType}){
    const wave = props.wave;
    const data = wave.data.split(" ").map(Number);
    const [xData, setXData] = useState<number[]>([])
    const yAxisData = (name: string) => {
        const newObj = Object.values(data)
        .map((p: any) => p[name])
        .reverse();
        console.log(newObj, data);
        return data;
         
      };
    useEffect(()=>{
        const wave = props.wave;
        const data = wave.data.split(" ").map(Number);
        let newX = [];
        for (let i = 0; i < data.length; i++) {
            newX[i] = i+1;
        }
        setXData(newX);
    }, [props])
    
    return (
        <div className="w-[600px]">
            <LinePlot
                title="Waveform"
                name="waveform"
                xData={xData}
                yData={data}
                low={wave["data-low-limit"]}
                high={wave["data-high-limit"]}
            />
        </div>
    )
}