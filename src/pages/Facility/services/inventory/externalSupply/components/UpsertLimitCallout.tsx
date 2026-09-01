import { TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

import Callout from "@/CAREUI/display/Callout";

interface UpsertLimitCalloutProps {
  children: ReactNode;
}

export default function UpsertLimitCallout({
  children,
}: UpsertLimitCalloutProps) {
  return (
    <Callout
      variant="warning"
      badge={<TriangleAlert className="size-4 shrink-0" />}
    >
      <span className="flex items-center gap-2">{children}</span>
    </Callout>
  );
}
