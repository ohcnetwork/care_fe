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
    <div
      className={classNames("rounded-lg bg-white p-4 shadow", props.className)}
    >
      <dl>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-xl">
          <CareIcon icon={props.icon} className="text-primary-600" />
        </div>
        <div>
          <dt className="my-2 truncate text-sm font-semibold text-gray-700">
            {props.text}
          </dt>
          {props.loading ? (
            <dd className="h-10 w-full max-w-[100px] animate-pulse rounded-lg bg-gray-300" />
          ) : (
            <dd id="count" className="text-5xl font-black leading-9">
              {props.count}
            </dd>
          )}
        </div>
      </dl>
    </div>
  );
}
