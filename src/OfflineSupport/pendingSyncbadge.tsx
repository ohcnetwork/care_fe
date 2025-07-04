import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export const PendingSyncBadge = () => {
  const { t } = useTranslation();

  return (
    <Badge
      variant="outline"
      className="ml-2 py-0 border-2 border-yellow-400 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:text-yellow-900"
    >
      <h3 className="text-xs font-medium">{t("Pending_sync")}</h3>
    </Badge>
  );
};
