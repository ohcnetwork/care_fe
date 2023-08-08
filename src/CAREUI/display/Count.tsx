import CareIcon from "../icons/CareIcon";

interface Props {
  count: number;
  text: string;
  loading: boolean;
  icon: string;
}

export default function CountBlock({ count, text, loading, icon }: Props) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <dl>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-xl">
          <CareIcon className={`care-l-${icon} text-primary-600`} />
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
