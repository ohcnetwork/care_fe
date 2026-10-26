import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClinicalHistoryAccess } from "@/pages/Patient/History/clinicalHistoryTabs";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { FillShell } from "./FillShell";

const FILL_TAB_TRIGGER_CLASSES =
  "h-11 shrink-0 rounded-t-lg rounded-b-none border-gray-300 bg-gray-50 px-2.5 py-2 text-xs not-data-active:text-gray-700! not-data-active:hover:bg-white data-active:border-b-white data-active:bg-white data-active:text-gray-950 data-active:shadow-none focus-visible:z-10 focus-visible:ring-inset sm:px-4 sm:text-sm";

interface FillSessionTabsProps {
  patientId?: string;
  facilityId?: string;
  dirty?: boolean;
  formTitle?: ReactNode;
  contained?: boolean;
  historyAccess?: ClinicalHistoryAccess;
  /** Scoped supporting records, independent of access to the full patient chart. */
  referenceTab?: { title: ReactNode; content: ReactNode };
  onClose: () => void;
  onMinimize?: () => void;
  exitDisabled?: boolean;
  minimizeDisabled?: boolean;
  children: ReactNode;
}

/** Preserve the answer stores across tab switches and load history only on demand. */
export function FillSessionTabs({
  patientId,
  facilityId,
  dirty = false,
  formTitle,
  contained = false,
  historyAccess,
  referenceTab,
  onClose,
  onMinimize,
  exitDisabled,
  minimizeDisabled,
  children,
}: FillSessionTabsProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"questionnaire" | "history" | "reference">(
    "questionnaire",
  );
  const [historyMounted, setHistoryMounted] = useState(false);
  const [referenceMounted, setReferenceMounted] = useState(false);
  const historyAvailable =
    !!patientId &&
    (!historyAccess || historyAccess.responses || historyAccess.clinicalData);
  // Drop mounted history immediately if chart access is lost. Restoring
  // access should return to the request until history is selected again.
  if (!historyAvailable && historyMounted) {
    if (tab === "history") setTab("questionnaire");
    setHistoryMounted(false);
  }
  if (!referenceTab && referenceMounted) {
    if (tab === "reference") setTab("questionnaire");
    setReferenceMounted(false);
  }
  const title = (
    <>
      {formTitle ?? t("questionnaire_one")}
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
      value={
        (tab === "history" && !historyAvailable) ||
        (tab === "reference" && !referenceTab)
          ? "questionnaire"
          : tab
      }
      className={cn(contained && "h-full min-h-0 gap-0")}
      onValueChange={(value) => {
        if (value === "history") {
          if (!historyAvailable) return;
          setHistoryMounted(true);
        }
        if (value === "reference") {
          if (!referenceTab) return;
          setReferenceMounted(true);
        }
        setTab(value as typeof tab);
      }}
    >
      <FillShell
        contained={contained}
        onClose={onClose}
        onMinimize={onMinimize}
        exitDisabled={exitDisabled}
        minimizeDisabled={minimizeDisabled}
        tabs={
          patientId || referenceTab ? (
            <TabsList className="flex h-auto items-end justify-start gap-1 rounded-none bg-transparent p-0 sm:gap-1.5">
              <TabsTrigger
                value="questionnaire"
                className={FILL_TAB_TRIGGER_CLASSES}
              >
                {title}
              </TabsTrigger>
              {historyAvailable && (
                <TabsTrigger
                  value="history"
                  className={FILL_TAB_TRIGGER_CLASSES}
                  disabled={exitDisabled}
                >
                  {t("patient_clinical_history")}
                </TabsTrigger>
              )}
              {referenceTab && (
                <TabsTrigger
                  value="reference"
                  className={FILL_TAB_TRIGGER_CLASSES}
                  disabled={exitDisabled}
                >
                  {referenceTab.title}
                </TabsTrigger>
              )}
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
          className="flex min-h-0 flex-1 flex-col data-hidden:hidden"
        >
          {children}
        </TabsContent>
        {patientId && historyAvailable && (
          <TabsContent
            value="history"
            forceMount={historyMounted || undefined}
            className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 data-hidden:hidden md:px-6"
          >
            {historyMounted && (
              <ClinicalHistoryTab
                patientId={patientId}
                facilityId={facilityId}
                access={historyAccess}
              />
            )}
          </TabsContent>
        )}
        {referenceTab && (
          <TabsContent
            value="reference"
            forceMount={referenceMounted || undefined}
            className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 data-hidden:hidden md:px-6"
          >
            {referenceMounted && referenceTab.content}
          </TabsContent>
        )}
      </FillShell>
    </Tabs>
  );
}
