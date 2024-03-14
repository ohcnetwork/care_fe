import { classNames } from "../../Utils/utils";
import CareIcon, { IconName } from "../icons/CareIcon";

interface Props {
  count: number;
  text: string;
  loading: boolean;
  icon: IconName;
  className?: string;
}

export default function CountBlock(props: Props) {
  return (
    <div className={classNames("flex items-center", props.className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-base xl:text-xl">
        <CareIcon icon={props.icon} className="text-primary-600" />
      </div>
      <div className="flex justify-between">
        <div className="truncate px-2 text-sm font-semibold text-gray-900 xl:text-base">
          {props.text}
        </div>
        {props.loading ? (
          <div className="h-10 w-full max-w-[100px] animate-pulse rounded-lg bg-gray-300" />
        ) : (
          <div
            id="count"
            className="rounded-[99px] bg-primary-300 px-2 py-0.5 text-xs font-black xl:text-sm"
          >
            {props.count}
          </div>
        )}
      </div>
    </div>
  );
}
