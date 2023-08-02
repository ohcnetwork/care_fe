import CareIcon from "../icons/CareIcon";

export default function CountBlock(props: {
  count: number;
  text: string;
  loading: boolean;
  icon: string;
  color?: string;
  containerClass?: string;
}) {
  const {
    count,
    text,
    loading,
    icon,
    color = "primary",
    containerClass,
  } = props;

  return (
    <div className={"flex-1 rounded-lg bg-white p-4 shadow " + containerClass}>
      <dl className="">
        <div
          className={`bg-${color}-100 flex h-10 w-10 items-center justify-center rounded-lg text-xl`}
        >
          <CareIcon className={`care-l-${icon} text-${color}-600`} />
        </div>
        <div>
          <dt className="my-2 truncate text-sm font-semibold text-gray-700">
            {text}
          </dt>
          {loading ? (
            <dd className="h-10 w-full max-w-[100px] animate-pulse rounded-lg bg-gray-300" />
          ) : (
            <dd id="count" className="text-5xl font-black leading-9">
              {count}
            </dd>
          )}
        </div>
      </dl>
    </div>
  );
}
