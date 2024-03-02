interface Props {
  count?: number;
  text?: string;
  loading: boolean;
  className?: string;
}

export default function CountBlock(props: Props) {
  return (
    <dl>
      <div className="flex items-center gap-2">
        <div className="mr-2">
          {/* <dt className="my-2 truncate text-sm font-semibold text-gray-700">
            {props.text}
          </dt> */}
          {props.loading ? (
            <dd className="h-10 w-full max-w-[100px] animate-pulse rounded-lg bg-gray-300" />
          ) : (
            <dd
              id="count"
              className="rounded-l-3xl rounded-r-3xl bg-[#98c7b9] px-2 text-sm font-black leading-9"
            >
              {props.count}
            </dd>
          )}
        </div>
      </div>
    </dl>
  );
}
