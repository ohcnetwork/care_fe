import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClinicalHistoryAccess } from "@/pages/Patient/History/clinicalHistoryTabs";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { FillShell } from "./FillShell";

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

const sessionTabClassName = cn(
  "shrink-0 px-4 py-2.5 text-sm font-medium focus-visible:z-10 focus-visible:ring-inset",
  "group-data-[variant=browser]/tabs-list:border-gray-300 group-data-[variant=browser]/tabs-list:bg-gray-100 group-data-[variant=browser]/tabs-list:text-gray-600",
  "group-data-[variant=browser]/tabs-list:data-active:border-gray-300 group-data-[variant=browser]/tabs-list:data-active:border-b-white group-data-[variant=browser]/tabs-list:data-active:bg-white group-data-[variant=browser]/tabs-list:data-active:text-gray-900",
);

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
  const tabClassName = contained
    ? "shrink-0 focus-visible:z-10 focus-visible:ring-inset"
    : sessionTabClassName;
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
          size={contained ? "xs" : "sm"}
          className={cn(
            "ml-1 rounded-sm border-transparent bg-indigo-100 px-1.5 text-indigo-900",
            contained && "py-0",
          )}
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
            <TabsList
              variant="browser"
              className={contained ? undefined : "gap-2 border-gray-300"}
            >
              <TabsTrigger value="questionnaire" className={tabClassName}>
                {title}
              </TabsTrigger>
              {historyAvailable && (
                <TabsTrigger
                  value="history"
                  className={tabClassName}
                  disabled={exitDisabled}
                >
                  {t("patient_clinical_history")}
                </TabsTrigger>
              )}
              {referenceTab && (
                <TabsTrigger
                  value="reference"
                  className={tabClassName}
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
