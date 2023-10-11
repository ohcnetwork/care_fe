import { formatDateTime } from "../../../Utils/utils";

export default function AdministrationEventSeperator({ date }: { date: Date }) {
  // Show date if it's 00:00
  if (date.getHours() !== 0) {
    return;
  }

  return (
    <div className="mx-auto flex h-[58px] flex-col items-center justify-center bg-gray-300 text-center text-xs font-bold text-gray-600 transition-all duration-200 ease-in-out group-hover:bg-primary-500 group-hover:text-white">
      <span className="-rotate-90 uppercase duration-500 ease-in-out">
        <p> {formatDateTime(date, "DD/MM")}</p>
      </span>
    </div>
  );
}
