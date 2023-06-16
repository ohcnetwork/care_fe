import { useCallback, useRef, useState } from "react";
import useCanvas from "../../Common/hooks/useCanvas";
import { ChannelOptions, VitalsValueBase as VitalsValue } from "./types";
import VentilatorDeviceClient, {
  VentilatorData,
  VentilatorVitalsWaveformData,
} from "./VentilatorDeviceClient";
import VentilatorVitalsRenderer from "./VentilatorWaveformsRenderer";
import { getChannel } from "./utils";

export const MONITOR_RATIO = {
  w: 13,
  h: 11,
};
const MONITOR_SCALE = 38;
const MONITOR_WAVEFORMS_CANVAS_SIZE = {
  width: MONITOR_RATIO.h * MONITOR_SCALE,
  height: MONITOR_RATIO.h * MONITOR_SCALE,
};
// const MONITOR_SIZE = {
//   width: MONITOR_RATIO.w * MONITOR_SCALE,
//   height: MONITOR_RATIO.h * MONITOR_SCALE,
// };

export default function useVentilatorVitalsMonitor() {
  const waveformForegroundCanvas = useCanvas();
  const waveformBackgroundCanvas = useCanvas();

  // Non waveform data states.
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [peep, setPeep] = useState<VitalsValue>();
  const [respRate, setRespRate] = useState<VitalsValue>();
  const [inspTime, setInspTime] = useState<VitalsValue>();
  const [fio2, setFio2] = useState<VitalsValue>();

  // Waveform data states.
  const device = useRef<VentilatorDeviceClient>();
  const renderer = useRef<VentilatorVitalsRenderer | null>(null);

  const pressureOptionsRef = useRef<ChannelOptions>();
  const flowOptionsRef = useRef<ChannelOptions>();
  const volumeOptionsRef = useRef<ChannelOptions>();

  const connect = useCallback(
    (socketUrl: string) => {
      setIsOnline(false);
      device.current?.disconnect();

      device.current = new VentilatorDeviceClient(socketUrl);
      device.current.connect();

      function obtainRenderer() {
        if (
          !pressureOptionsRef.current ||
          !flowOptionsRef.current ||
          !volumeOptionsRef.current
        )
          return;

        setIsOnline(true);

        renderer.current = new VentilatorVitalsRenderer({
          foregroundRenderContext: waveformForegroundCanvas.contextRef.current!,
          backgroundRenderContext: waveformBackgroundCanvas.contextRef.current!,
          size: MONITOR_WAVEFORMS_CANVAS_SIZE,
          animationInterval: 50,
          pressure: pressureOptionsRef.current,
          flow: flowOptionsRef.current,
          volume: volumeOptionsRef.current,
        });

        const _renderer = renderer.current;
        device.current!.on(
          "pressure-waveform",
          ingestTo(_renderer, "pressure")
        );
        device.current!.on("flow-waveform", ingestTo(_renderer, "flow"));
        device.current!.on("volume-waveform", ingestTo(_renderer, "volume"));

        const hook = (set: (data: any) => void) => (d: VentilatorData) =>
          set(d);
        device.current!.on("PEEP", hook(setPeep));
        device.current!.on("R.Rate", hook(setRespRate));
        device.current!.on("Insp-Time", hook(setInspTime));
        device.current!.on("FiO2", hook(setFio2));
      }

      device.current.once("pressure-waveform", (observation) => {
        pressureOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData
        );
        obtainRenderer();
      });

      device.current.once("flow-waveform", (observation) => {
        flowOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData
        );
        obtainRenderer();
      });

      device.current.once("volume-waveform", (observation) => {
        volumeOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData
        );
        obtainRenderer();
      });
    },
    [waveformForegroundCanvas.contextRef, waveformBackgroundCanvas]
  );

  return {
    connect,
    waveformCanvas: {
      foreground: waveformForegroundCanvas,
      background: waveformBackgroundCanvas,
      size: MONITOR_WAVEFORMS_CANVAS_SIZE,
    },
    data: {
      peep,
      respRate,
      inspTime,
      fio2,
    },
    device,
    isOnline,
  };
}

const ingestTo = (
  vitalsRenderer: VentilatorVitalsRenderer,
  channel: "pressure" | "flow" | "volume"
) => {
  return (observation: VentilatorData) => {
    vitalsRenderer.append(
      channel,
      (observation as VentilatorVitalsWaveformData).data
        .split(" ")
        .map((x) => parseInt(x)) || []
    );
  };
};
