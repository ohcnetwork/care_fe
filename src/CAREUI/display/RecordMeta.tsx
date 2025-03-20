import { ReactNode } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  formatDateTime,
  formatName,
  isUserOnline,
  relativeTime,
} from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

interface Props {
  time?: string;
  prefix?: ReactNode;
  className?: string;
  inlineClassName?: string;
  user?: UserBase;
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
        <span className="whitespace-break-spaces">
          {formatDateTime(time).replace(";", "")}
        </span>
        {user && !inlineUser && (
          <span className="flex items-center gap-1">
            by
            <CareIcon icon="l-user" />
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
        {user && !inlineUser && <CareIcon icon="l-user" />}
        {user && inlineUser && (
          <span className="font-medium">{formatName(user)}</span>
        )}
      </div>
    );
  }

  return <div className={className}>{child}</div>;
};

export default RecordMeta;
