import CareIcon from "../icons/CareIcon";

export default function CountBlock(props: {
  count: number;
  text: string;
  loading: boolean;
  icon: string;
  color?: string;
}) {
  const { count, text, loading, icon, color = "primary" } = props;

  return (
    <div className="rounded-lg py-2 flex-1">
      <dl className="">
        <div
          className={`flex items-center justify-center rounded-lg text-xl w-10 h-10 bg-${color}-100`}
        >
          <CareIcon className={`care-l-${icon} text-${color}-600`} />
        </div>
        <div>
          <dt className="text-sm font-semibold text-gray-700 truncate my-2">
            {text}
          </dt>
          {loading ? (
            <dd className="rounded-lg w-full max-w-[100px] h-10 bg-gray-300 animate-pulse" />
          ) : (
            <dd className="text-5xl leading-9 font-black">{count}</dd>
          )}
        </div>
      </dl>
    </div>
  );
}
