import { useEffect, useState } from "react";

/**
 * Custom hook to manage a timer in MM:SS format. This can be useful for tracking time during recording sessions, user actions, or any other timed event.
 *
 * @returns {Object} A set of properties and methods to control and display the timer:
 *
 * @property {number} seconds - The total elapsed time in seconds.
 * @property {JSX.Element} time - A JSX element displaying the current time in MM:SS format.
 * @property {function} start - Function to start the timer.
 * @property {function} stop - Function to stop the timer.
 *
 * @example
 * const { time, start, stop } = useTimer();
 *
 * // To start the timer:
 * start();
 *
 * // To stop the timer:
 * stop();
 *
 * // To display the timer in your component:
 * <div>{time}</div>
 */
export const useTimer = () => {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 10);
    } else {
      setTime(0);
    }
    return () => clearInterval(interval);
  }, [running]);

  return {
    seconds: time,
    time: (
      <span>
        {("0" + Math.floor((time / 6000) % 60)).slice(-2)}:
        {("0" + Math.floor((time / 100) % 60)).slice(-2)}
      </span>
    ),
    start: () => setRunning(true),
    stop: () => setRunning(false),
  };
};
