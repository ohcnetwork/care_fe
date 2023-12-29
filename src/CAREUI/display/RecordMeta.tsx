import CareIcon from "../icons/CareIcon";
import {
  formatDate,
  formatName,
  formatTime,
  isUserOnline,
  relativeTime,
} from "../../Utils/utils";
import { ReactNode } from "react";

interface Props {
  time?: string;
  prefix?: ReactNode;
  className?: string;
  inlineClassName?: string;
  user?: {
    first_name: string;
    last_name: string;
    last_login: string | undefined;
  };
  inlineUser?: boolean;
}

/**
 * A generic component to display relative time along with a tooltip and a user
 * if provided.
 */
const RecordMeta = ({
  time,
  user,
  prefix,
  className,
  inlineClassName,
  inlineUser,
}: Props) => {
  const isOnline = user && isUserOnline(user);

  let child = (
    <div className="tooltip">
      <span className="underline">{relativeTime(time)}</span>
      <span className="tooltip-text tooltip-bottom flex -translate-x-1/2 gap-1 text-xs font-medium tracking-wider">
        {formatTime(time)} <br />
        {formatDate(time)}
        {user && !inlineUser && (
          <span className="flex items-center gap-1">
            by
            <CareIcon className="care-l-user" />
            {formatName(user)}
            {isOnline && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary-400" />
            )}
          </span>
        )}
      </span>
    </div>
  );

  if (prefix || user) {
    child = (
      <div className={`flex items-center gap-1 ${inlineClassName}`}>
        {prefix}
        {child}
        {user && inlineUser && <span>by</span>}
        {user && !inlineUser && <CareIcon className="care-l-user" />}
        {user && inlineUser && (
          <span className="font-medium">{formatName(user)}</span>
        )}
      </div>
    );
  }

  return <div className={className}>{child}</div>;
};

export default RecordMeta;
