import { formatDateTime } from "@/Utils/utils";

export default function AdministrationEventSeperator({ date }: { date: Date }) {
  // Show date if it's 00:00
  if (date.getHours() === 0) {
    return (
      <div className="mx-auto flex h-[58px] w-10 flex-col items-center justify-center bg-secondary-50 text-center text-xs font-bold text-secondary-600 transition-all duration-200 ease-in-out group-hover:bg-primary-500 group-hover:text-white">
        <span className="-rotate-90 uppercase duration-500 ease-in-out">
          <p> {formatDateTime(date, "DD/MM")}</p>
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[58px] flex-col items-center justify-center text-center text-xs font-bold text-secondary-500 transition-all duration-200 ease-in-out">
      <span className="font-bold duration-500 ease-in-out">
        {/* <p>{formatDateTime(date, "HH")}</p> */}
      </span>
    </div>
  );
}
