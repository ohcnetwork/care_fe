import { TriangleAlert } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import Callout from "@/CAREUI/display/Callout";

interface UpsertLimitCalloutProps {
  children: ReactNode;
}

export default function UpsertLimitCallout({
  children,
}: UpsertLimitCalloutProps) {
  const { t } = useTranslation();

  return (
    <Callout
      variant="warning"
      badge={
        <>
          <TriangleAlert className="size-4 shrink-0" />
          <span className="sr-only">{t("warning")}</span>
        </>
      }
    >
      {children}
    </Callout>
  );
}
