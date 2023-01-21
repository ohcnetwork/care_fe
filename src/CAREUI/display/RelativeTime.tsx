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
      <span className="tooltip-text font-medium tracking-wider text-xs -translate-x-1/3">
        {moment(time).format("hh:mm A; DD/MM/YYYY")}
      </span>
    </div>
  );
};

export default RelativeTime;
