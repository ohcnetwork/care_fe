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
    const data = wave.data.split(" ");
    const yAxisData = (name: string) => {
        return Object.values(data)
          .map((p: any) => p[name])
          .reverse();
      };
    return (
        <div className="w-80">
            <LinePlot
                title="Waveform"
                name="waveform"
                xData={data}
                yData={yAxisData("Wave")}
                low={wave["data-low-limit"]}
                high={wave["data-high-limit"]}
            />
        </div>
    )
}