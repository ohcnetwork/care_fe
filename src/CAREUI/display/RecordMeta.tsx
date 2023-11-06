import CareIcon from "../icons/CareIcon";
import { formatDateTime, isUserOnline, relativeTime } from "../../Utils/utils";
import { ReactNode } from "react";

interface Props {
  time?: string;
  prefix?: ReactNode;
  className?: string;
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
const RecordMeta = ({ time, user, prefix, className, inlineUser }: Props) => {
  const isOnline = user && isUserOnline(user);

  let child = (
    <div className="tooltip">
      <span className="underline">{relativeTime(time)}</span>
      <span className="tooltip-text tooltip-bottom flex -translate-x-1/2 gap-1 text-xs font-medium tracking-wider">
        {formatDateTime(time)}
        {user && !inlineUser && (
          <span className="flex items-center gap-1">
            by
            <CareIcon className="care-l-user" />
            {user.first_name} {user.last_name}
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
      <div className="flex items-center gap-1">
        {prefix}
        {child}
        {user && inlineUser && <span>by</span>}
        {user && <CareIcon className="care-l-user" />}
        {user && inlineUser && (
          <span className="font-medium">
            {user.first_name} {user.last_name}
          </span>
        )}
      </div>
    );
  }

  return <div className={className}>{child}</div>;
};

export default RecordMeta;
