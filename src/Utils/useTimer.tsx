import { useEffect, useState } from "react";

export const useTimer = () => {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (running) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 10);
    } else {
      clearInterval(interval);
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
