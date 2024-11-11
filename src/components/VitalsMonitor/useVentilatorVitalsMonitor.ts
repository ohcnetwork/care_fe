import { useCallback, useRef, useState } from "react";

import VentilatorDeviceClient, {
  VentilatorData,
  VentilatorVitalsWaveformData,
} from "@/components/VitalsMonitor/VentilatorDeviceClient";
import VentilatorVitalsRenderer from "@/components/VitalsMonitor/VentilatorWaveformsRenderer";
import {
  ChannelOptions,
  IVitalsComponentProps,
  VitalsValueBase as VitalsValue,
} from "@/components/VitalsMonitor/types";
import {
  getChannel,
  getVitalsCanvasSizeAndDuration,
} from "@/components/VitalsMonitor/utils";

import useCanvas from "@/hooks/useCanvas";

export default function useVentilatorVitalsMonitor(
  config?: IVitalsComponentProps["config"],
) {
  const waveformForegroundCanvas = useCanvas();
  const waveformBackgroundCanvas = useCanvas();
  const rendererConfig = config ?? getVitalsCanvasSizeAndDuration();

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
          !volumeOptionsRef.current ||
          !waveformForegroundCanvas.contextRef.current ||
          !waveformBackgroundCanvas.contextRef.current
        )
          return;

        setIsOnline(true);

        renderer.current = new VentilatorVitalsRenderer({
          foregroundRenderContext: waveformForegroundCanvas.contextRef.current,
          backgroundRenderContext: waveformBackgroundCanvas.contextRef.current,
          animationInterval: 50,
          pressure: pressureOptionsRef.current,
          flow: flowOptionsRef.current,
          volume: volumeOptionsRef.current,
          ...rendererConfig,
        });

        const _renderer = renderer.current;
        device.current?.on(
          "pressure-waveform",
          ingestTo(_renderer, "pressure"),
        );
        device.current?.on("flow-waveform", ingestTo(_renderer, "flow"));
        device.current?.on("volume-waveform", ingestTo(_renderer, "volume"));

        const hook = (set: (data: any) => void) => (d: VentilatorData) =>
          set(d);
        device.current?.on("PEEP", hook(setPeep));
        device.current?.on("R.Rate", hook(setRespRate));
        device.current?.on("Insp-Time", hook(setInspTime));
        device.current?.on("FiO2", hook(setFio2));
      }

      device.current.once("pressure-waveform", (observation) => {
        pressureOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData,
        );
        obtainRenderer();
      });

      device.current.once("flow-waveform", (observation) => {
        flowOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData,
        );
        obtainRenderer();
      });

      device.current.once("volume-waveform", (observation) => {
        volumeOptionsRef.current = getChannel(
          observation as VentilatorVitalsWaveformData,
        );
        obtainRenderer();
      });
    },
    [waveformForegroundCanvas.contextRef, waveformBackgroundCanvas],
  );

  return {
    connect,
    waveformCanvas: {
      foreground: waveformForegroundCanvas,
      background: waveformBackgroundCanvas,
      size: rendererConfig.size,
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
  channel: "pressure" | "flow" | "volume",
) => {
  return (observation: VentilatorData) => {
    vitalsRenderer.append(
      channel,
      (observation as VentilatorVitalsWaveformData).data
        .split(" ")
        .map((x) => parseInt(x)) || [],
    );
  };
};
