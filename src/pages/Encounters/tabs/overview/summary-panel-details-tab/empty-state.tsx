import CareIcon from "@/CAREUI/icons/CareIcon";

export const EmptyState = ({ message }: { message: string }) => (
  <div className={"flex flex-row items-center justify-start"}>
    <CareIcon icon="l-info-circle" className="size-8 text-gray-400" />
    <span className="text-sm text-gray-500 font-medium">{message}</span>
  </div>
);
