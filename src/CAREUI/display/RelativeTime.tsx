import { useEffect, useState } from "react";
import moment from "moment";

interface Props {
  time?: string;
  prefix?: React.ReactNode;
  className?: string;
}

/**
 * A generic component to display relative time along with a tooltip and a user
 * if provided.
 */
const RelativeTime = ({ time, prefix, className }: Props) => {
  const [relativeTime, setRelativeTime] = useState(moment(time).fromNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setRelativeTime(moment(time).fromNow());
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  let child = (
    <div className="tooltip">
      <span className="underline">{relativeTime}</span>
      <span className="tooltip-text font-medium tracking-wider text-xs -translate-x-1/3">
        {moment(time).format("hh:mm A; DD/MM/YYYY")}
      </span>
    </div>
  );

  if (prefix) {
    child = (
      <div className="flex items-center gap-1">
        {prefix}
        {child}
      </div>
    );
  }

  return <div className={className}>{child}</div>;
};

export default RelativeTime;
