import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

import { CounterData } from "@/types/billing/cash/cashSession";

import CounterSelectorSheet from "./CounterSelectorSheet";

interface NoSessionViewProps {
  facilityId: string;
  counters: CounterData[];
}

export default function NoSessionView({
  facilityId,
  counters,
}: NoSessionViewProps) {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="py-2">
      <EmptyState
        icon={
          <CareIcon icon="l-money-bill" className="text-primary-500 size-8" />
        }
        title={t("no_active_session")}
        description={t("no_active_session_description")}
        action={
          <Button onClick={() => setIsSheetOpen(true)}>
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("start_session")}
          </Button>
        }
      />

      <CounterSelectorSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        facilityId={facilityId}
        counters={counters}
        onSessionCreated={() => setIsSheetOpen(false)}
      />
    </div>
  );
}
