import { useTranslation } from "react-i18next";

import { BedCounts } from "./bedState";

export function BedCountsLabel({ counts }: { counts: BedCounts }) {
  const { t } = useTranslation();
  return (
    <p className="text-sm whitespace-nowrap text-muted-foreground">
      {t("bed_count", { count: counts.total })}
      {" · "}
      {t("free_bed_count", { count: counts.free })}
    </p>
  );
}
