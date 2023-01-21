import { useEffect, useState } from "react";
import moment from "moment";

const RelativeTime = ({ time }: { time: string }) => {
  const [relativeTime, setRelativeTime] = useState(moment(time).fromNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(moment(time).fromNow());
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  return (
    <div className="tooltip">
      <span className="underline">{relativeTime}</span>
      <span className="tooltip-text">{time}</span>
    </div>
  );
};

export default RelativeTime;
