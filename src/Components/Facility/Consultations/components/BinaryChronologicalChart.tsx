import moment from "moment";
import CareIcon from "../../../../CAREUI/icons/CareIcon";

export default function BinaryChronologicalChart(props: {
  data: {
    value: boolean;
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
      <h3 className="text-sm px-3 mb-2">{title}</h3>
      <div className="flow-root m-2 overflow-y-scroll h-64">
        <ul role="list" className="">
          {data.map((entry, i) => (
            <li key={i}>
              <div className="relative pb-8">
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                        entry.value ? " text-green-500 " : " text-red-500 "
                      }`}
                    >
                      {entry.value ? (
                        <CareIcon className="care-l-check-circle text-xl" />
                      ) : (
                        <CareIcon className="care-l-times-circle text-xl" />
                      )}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p
                        className={`text-sm ${
                          entry.value ? " text-green-500 " : " text-red-500 "
                        }`}
                      >
                        <span className="mr-5">
                          {entry.value ? trueName : falseName}
                        </span>
                        <span>{entry.notes}</span>
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      <p>{moment(entry.timestamp).format("lll")}</p>
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
