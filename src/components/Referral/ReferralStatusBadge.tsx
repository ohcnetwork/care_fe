import { useTranslation } from "react-i18next";

import { Badge } from "@/components/careui/badge";

import { ReferralStatus } from "@/types/emr/referral/referral";

const statusVariants = {
  pending: "warning",
  in_progress: "info",
  completed: "success",
  cancelled: "neutral",
  rejected: "destructive",
} as const;

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant={statusVariants[status]} size="sm" dot>
      {t(`referral_status_${status}`)}
    </Badge>
  );
}
