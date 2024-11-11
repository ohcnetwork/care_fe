import { Transition } from "@headlessui/react";
import { useEffect, useState } from "react";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { classNames } from "@/Utils/utils";

export type StreamStatus = "playing" | "stop" | "loading" | "offline";

export type FeedAlertState =
  | StreamStatus
  | "moving"
  | "zooming"
  | "saving_preset"
  | "host_unreachable";

interface Props {
  state?: FeedAlertState;
}

const ALERT_ICON_MAP: Partial<Record<FeedAlertState, IconName>> = {
  playing: "l-play-circle",
  stop: "l-stop-circle",
  offline: "l-exclamation-triangle",
  loading: "l-spinner",
  // moving: "l-expand-from-corner",
  zooming: "l-search",
  saving_preset: "l-save",
  host_unreachable: "l-exclamation-triangle",
};

export default function FeedAlert({ state }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!state) return;

    setShow(true);

    if (state !== "loading") {
      const timeout = setTimeout(() => setShow(false), 4000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [state, setShow]);

  return (
    <Transition
      show={!!state && show}
      enter="ease-out duration-200"
      enterFrom="opacity-0 translate-y-5"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-5"
    >
      <div className="absolute right-8 top-4 z-20 flex items-center gap-1.5 rounded bg-white/20 px-2 py-1 text-white">
        {state && ALERT_ICON_MAP[state] && (
          <CareIcon
            className={classNames(
              "text-base",
              state === "loading" && "animate-spin",
            )}
            icon={ALERT_ICON_MAP[state]!}
          />
        )}
        <span className="text-xs font-medium capitalize">
          {state?.replace("_", " ")}
        </span>
      </div>
    </Transition>
  );
}
