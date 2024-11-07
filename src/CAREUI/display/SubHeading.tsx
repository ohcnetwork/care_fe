import { ReactNode } from "react";

import RecordMeta from "@/CAREUI/display/RecordMeta";
import CareIcon from "@/CAREUI/icons/CareIcon";

interface Props {
  title: ReactNode;
  lastModified?: string;
  className?: string;
  options?: ReactNode;
}

export default function SubHeading(props: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between py-2">
      <div className="flex items-center">
        <span className="text-lg font-semibold leading-relaxed text-secondary-900">
          {props.title}
        </span>
        {props.lastModified && (
          <div className="ml-3 flex flex-row gap-2 text-xs font-medium text-secondary-600">
            <CareIcon icon="l-history-alt" className="text-sm" />
            <RecordMeta time={props.lastModified} prefix="Last modified" />
          </div>
        )}
      </div>
      {props.options && (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          {props.options}
        </div>
      )}
    </div>
  );
}
