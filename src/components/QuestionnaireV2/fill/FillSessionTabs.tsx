import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { FillShell } from "./FillShell";

const FILL_TAB_TRIGGER_CLASSES =
  "h-11 shrink-0 rounded-t-lg rounded-b-none border-gray-300 bg-gray-50 px-2.5 py-2 text-xs data-[state=inactive]:text-gray-700! data-[state=inactive]:hover:bg-white data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-none focus-visible:z-10 focus-visible:ring-inset sm:px-4 sm:text-sm";

interface FillSessionTabsProps {
  patientId?: string;
  facilityId?: string;
  dirty: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Preserve the answer stores across tab switches and load history only on demand. */
export function FillSessionTabs({
  patientId,
  facilityId,
  dirty,
  onClose,
  children,
}: FillSessionTabsProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"questionnaire" | "history">("questionnaire");
  const [historyMounted, setHistoryMounted] = useState(false);
  const title = (
    <>
      {t("questionnaire_one")}
      {dirty && (
        <Badge
          size="xs"
          className="ml-1 rounded-sm border-transparent bg-indigo-100 px-1.5 py-0 text-indigo-900"
        >
          {t("draft")}
        </Badge>
      )}
    </>
  );
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (value === "history") setHistoryMounted(true);
        setTab(value as typeof tab);
      }}
    >
      <FillShell
        onClose={onClose}
        tabs={
          patientId ? (
            <TabsList className="flex h-auto items-end justify-start gap-1 rounded-none bg-transparent p-0 sm:gap-1.5">
              <TabsTrigger
                value="questionnaire"
                className={FILL_TAB_TRIGGER_CLASSES}
              >
                {title}
              </TabsTrigger>
              <TabsTrigger value="history" className={FILL_TAB_TRIGGER_CLASSES}>
                {t("patient_clinical_history")}
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="flex items-center py-1.5 text-sm font-medium text-gray-900">
              {title}
            </div>
          )
        }
      >
        <TabsContent
          value="questionnaire"
          forceMount
          className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          {children}
        </TabsContent>
        {patientId && (
          <TabsContent
            value="history"
            forceMount={historyMounted || undefined}
            className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 data-[state=inactive]:hidden md:px-6"
          >
            {historyMounted && (
              <ClinicalHistoryTab
                patientId={patientId}
                facilityId={facilityId}
              />
            )}
          </TabsContent>
        )}
      </FillShell>
    </Tabs>
  );
}
