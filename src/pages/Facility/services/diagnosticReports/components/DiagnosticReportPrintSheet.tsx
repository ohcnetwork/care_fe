import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import {
  DIAGNOSTIC_REPORT_STATUS_COLORS,
  DiagnosticReportRead,
} from "@/types/emr/diagnosticReport/diagnosticReport";

interface DiagnosticReportPrintSheetProps {
  reports: DiagnosticReportRead[];
  facilityId: string;
  patientId: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DiagnosticReportPrintSheet({
  reports,
  facilityId,
  patientId,
  children,
  open,
  onOpenChange,
}: DiagnosticReportPrintSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(
    new Set(),
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setCategoryFilter("all");
    }
  };

  const toggleReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const selectAll = () => {
    const allIds = reports.map((report) => report.id);
    setSelectedReports(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedReports(new Set());
  };

  // Handle category filter change - auto-select all reports of that category
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    if (value === "all") {
      // Don't change selection when "all" is selected
      return;
    }
    // Auto-select all reports of the selected category (using service_request.category which matches Classification enum)
    const reportsOfCategory = reports.filter(
      (report) => report.service_request?.category === value,
    );
    const newSelected = new Set(selectedReports);
    reportsOfCategory.forEach((report) => {
      newSelected.add(report.id);
    });
    setSelectedReports(newSelected);
  };

  const handlePrint = () => {
    if (selectedReports.size === 0) return;

    const ids = Array.from(selectedReports).join(",");
    handleOpenChange(false);
    navigate(
      `/facility/${facilityId}/patient/${patientId}/diagnostic_reports/print?ids=${ids}`,
    );
  };

  // Filter reports based on category filter for display (using service_request.category which matches Classification enum)
  const filteredReports =
    categoryFilter === "all"
      ? reports
      : reports.filter(
          (report) => report.service_request?.category === categoryFilter,
        );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("print_multiple")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 my-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {t("filter_by_category")}:
            </span>
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("all_categories")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_categories")}</SelectItem>
                {Object.values(Classification).map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {t("select_all")}
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                {t("clear_selection")}
              </Button>
            </div>
            <span className="text-sm text-gray-600">
              {t("selected_reports_count", { count: selectedReports.size })}
            </span>
          </div>

          {/* Print Button */}
          <Button
            disabled={selectedReports.size === 0}
            onClick={handlePrint}
            className="w-full"
          >
            <CareIcon icon="l-print" className="mr-2 h-4 w-4" />
            {t("print_selected")}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
          {filteredReports.length === 0 ? (
            <EmptyState
              icon={
                <CareIcon
                  icon="l-file-medical-alt"
                  className="text-primary size-6"
                />
              }
              title={t("no_diagnostic_reports_found")}
              description={t("no_diagnostic_reports_found_description")}
            />
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`report-${report.id}`}
                      checked={selectedReports.has(report.id)}
                      onCheckedChange={() => toggleReport(report.id)}
                      className="mt-1"
                    />
                    <div className="flex flex-1 justify-between items-start">
                      <label
                        htmlFor={`report-${report.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">
                          {report.code?.display || t("diagnostic_report")}
                        </div>
                        {report.code?.code && (
                          <div className="text-xs text-gray-500">
                            {report.code.code}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-1">
                          {report.category?.display || "-"}
                        </div>
                      </label>
                      <Badge
                        variant={DIAGNOSTIC_REPORT_STATUS_COLORS[report.status]}
                        className="capitalize shrink-0"
                      >
                        {t(report.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
