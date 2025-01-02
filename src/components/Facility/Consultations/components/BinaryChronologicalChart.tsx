import CareIcon from "@/CAREUI/icons/CareIcon";

import { formatDateTime } from "@/Utils/utils";

export default function BinaryChronologicalChart(props: {
  data: {
    value: boolean | undefined;
    timestamp: string;
    notes?: string;
  }[];
  trueName?: string;
  falseName?: string;
  title: string;
}) {
  const { data, title, trueName = "true", falseName = "false" } = props;

  return (
    <div className="overflow-x-auto bg-white">
      <h3 className="mb-2 px-3 text-sm">{title}</h3>
      <div className="m-2 flow-root h-64 overflow-y-scroll">
        <ul role="list" className="">
          {data.map((entry, i) => (
            <li key={i}>
              <div className="relative pb-8">
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-secondary-200"
                  aria-hidden="true"
                />
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                        entry.value ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {entry.value ? (
                        <CareIcon icon="l-check-circle" className="text-xl" />
                      ) : (
                        <CareIcon icon="l-times-circle" className="text-xl" />
                      )}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p
                        className={`text-sm ${
                          entry.value ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        <span className="mr-5">
                          {entry.value ? trueName : falseName}
                        </span>
                        <span>{entry.notes}</span>
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-secondary-500">
                      <p>{formatDateTime(entry.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
