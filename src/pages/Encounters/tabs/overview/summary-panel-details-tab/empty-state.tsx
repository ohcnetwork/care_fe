import CareIcon from "@/CAREUI/icons/CareIcon";

export const EmptyState = ({ message }: { message: string }) => (
  <div className={"flex flex-row items-center justify-start"}>
    <CareIcon
      icon="l-info-circle"
      className="size-8 text-placeholder-foreground"
    />
    <span className="text-sm text-muted-foreground font-medium">{message}</span>
  </div>
);
