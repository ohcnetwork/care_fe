import careConfig from "@careConfig";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";

import { useTimer } from "@/hooks/useTimer";

type State = "watching" | "prompted" | "timed-out";

const useStillWatching = () => {
  const { idleTimeout, promptDuration } = careConfig.stillWatching;
  const [state, setState] = useState<State>("watching");
  const [sequence, setSequence] = useState(1);

  const timer = useTimer(true);

  const remainingTime = Math.ceil(
    (idleTimeout + promptDuration) * Math.min(sequence, 3) - timer.seconds,
  );

  useEffect(() => {
    if (remainingTime < 0) {
      setState("timed-out");
      timer.stop();
      return;
    }
    if (remainingTime < promptDuration) {
      setState("prompted");
      return;
    }
  }, [promptDuration, remainingTime]);

  return {
    state,
    remainingTime,
    reset: (hardReset?: boolean) => {
      if (hardReset) {
        setSequence((seq) => seq + 1);
      }
      timer.reset();
      setState("watching");
      timer.start();
    },
  };
};

export default function StillWatching(props: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { state, remainingTime, reset } = useStillWatching();

  return (
    <div onClick={() => reset()}>
      <ConfirmDialog
        show={state === "prompted"}
        title={t("are_you_still_watching")}
        description={t("stream_stop_due_to_inativity")}
        action={
          <>
            <CareIcon icon="l-play-circle" className="text-lg" />
            {t("continue_watching")} ({remainingTime}s.)
          </>
        }
        onConfirm={() => reset(true)}
        onClose={() => reset(true)}
      />
      {state === "timed-out" ? (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-secondary-400">
          <span className="text-center text-xl font-bold text-secondary-700">
            {t("stream_stopped_due_to_inativity")}
          </span>
          <ButtonV2 onClick={() => reset(true)}>
            <CareIcon icon="l-play-circle" className="text-lg" />
            {t("resume")}
          </ButtonV2>
        </div>
      ) : (
        props.children
      )}
    </div>
  );
}
