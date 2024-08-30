import React from "react";

export default function RemainingTime({ time }: { time: number }) {
  const [remaining, setRemaining] = React.useState(time - new Date().getTime());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(time - new Date().getTime());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [time]);

  const seconds = remaining / 1e3;

  if (seconds < 0) {
    return "0s.";
  }

  return `${seconds.toFixed(0)}s.`;
}
