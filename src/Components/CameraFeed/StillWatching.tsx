import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../Common/ConfirmDialog";
import ButtonV2 from "../Common/components/ButtonV2";
import CareIcon from "../../CAREUI/icons/CareIcon";

/**
 * Calculates the linear backoff duration with saturation after a specified number of attempts.
 *
 * The function multiplies the `retryCount` by a `baseDelay` to calculate the backoff duration.
 * If the `retryCount` exceeds `maxRetries`, the delay saturates at `baseDelay * maxRetries`.
 *
 * @param {number} retryCount - The current attempt number (should be non-negative).
 * @param {number} [baseDelay=300000] - The base delay in milliseconds for each retry. Defaults to 5 minutes (300,000 ms).
 * @param {number} [maxRetries=3] - The number of retries after which the delay saturates. Defaults to 3.
 * @returns {number} The calculated delay duration in milliseconds.
 */
const calculateLinearBackoffWithSaturation = (
  retryCount: number,
  baseDelay = 3 * 60e3,
  maxRetries = 3,
) => {
  return baseDelay * Math.min(retryCount, maxRetries);
};

type Props = {
  children: React.ReactNode;
};

export default function StillWatching(props: Props) {
  const [state, setState] = useState<"watching" | "prompted" | "timed-out">(
    "watching",
  );
  const [sequence, setSequence] = useState(1);

  const getNextTimeout = useCallback(() => {
    return (
      new Date().getTime() + calculateLinearBackoffWithSaturation(sequence)
    );
  }, [sequence]);

  const [timeoutOn, setTimeoutOn] = useState(getNextTimeout);

  useEffect(() => {
    setTimeoutOn(getNextTimeout());
  }, [getNextTimeout]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remainingTime = timeoutOn - new Date().getTime();

      if (remainingTime < 0) {
        setState("timed-out");
        clearInterval(interval);
        return;
      }
      if (remainingTime < 30e3) {
        setState("prompted");
        return;
      }

      setState("watching");
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timeoutOn, state]);

  return (
    <div
      onClick={() => {
        if (state === "watching") {
          setTimeoutOn(getNextTimeout());
        }
      }}
    >
      <ConfirmDialog
        show={state === "prompted"}
        title="Are you still watching?"
        description="The stream will stop playing due to inactivity"
        action={
          <>
            <CareIcon icon="l-play-circle" className="text-lg" />
            Continue watching (<RemainingTime timeoutOn={timeoutOn} />
            s)
          </>
        }
        onConfirm={() => setSequence((seq) => seq + 1)}
        onClose={() => setSequence((seq) => seq + 1)}
      />
      {state === "timed-out" ? (
        <TimedOut onResume={() => setSequence((seq) => seq + 1)} />
      ) : (
        props.children
      )}
    </div>
  );
}

const RemainingTime = (props: { timeoutOn: number }) => {
  const [diff, setDiff] = useState(props.timeoutOn - new Date().getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(props.timeoutOn - new Date().getTime());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [props.timeoutOn]);

  return (diff / 1e3).toFixed(0);
};

const TimedOut = (props: { onResume: () => void }) => {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-secondary-400">
      <span className="text-xl font-bold text-secondary-700">
        Live feed has stopped streaming due to inactivity.
      </span>
      <ButtonV2 onClick={props.onResume}>
        <CareIcon icon="l-play-circle" className="text-lg" />
        Resume
      </ButtonV2>
    </div>
  );
};
