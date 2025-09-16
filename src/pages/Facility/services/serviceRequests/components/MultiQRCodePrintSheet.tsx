import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  SPECIMEN_STATUS_COLORS,
  SpecimenRead,
} from "@/types/emr/specimen/specimen";

import { PrintableQRCodeArea } from "./PrintableQRCodeArea";

interface MultiQRCodePrintSheetProps {
  specimens: SpecimenRead[];
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MultiQRCodePrintSheet({
  specimens,
  children,
  open,
  onOpenChange,
}: MultiQRCodePrintSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSpecimens, setSelectedSpecimens] = useState<Set<string>>(
    new Set(),
  );
  const [localSpecimens, setLocalSpecimens] =
    useState<SpecimenRead[]>(specimens);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const qrCodeSize = 120;
  const logoSize = Math.floor(qrCodeSize * 0.25);
  const printSize = 80;

  // Update local specimens when props change
  useEffect(() => {
    setLocalSpecimens(specimens);
    // Auto-select all specimens when they are updated/created
    if (specimens.length > 0 && selectedSpecimens.size === 0) {
      setSelectedSpecimens(new Set(specimens.map((s) => s.id)));
    }
  }, [specimens]);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const toggleSpecimen = (specimenId: string) => {
    const newSelected = new Set(selectedSpecimens);
    if (newSelected.has(specimenId)) {
      newSelected.delete(specimenId);
    } else {
      newSelected.add(specimenId);
    }
    setSelectedSpecimens(newSelected);
  };

  const selectAll = () => {
    const allIds = localSpecimens.map((specimen) => specimen.id);
    setSelectedSpecimens(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedSpecimens(new Set());
  };

  const handlePrint = () => {
    setIsPrinting(true);
    handleOpenChange(false);
  };

  // Get selected specimen data for print view
  const selectedSpecimenData = Array.from(selectedSpecimens)
    .map((id) => localSpecimens.find((s) => s.id === id))
    .filter(Boolean) as SpecimenRead[];

  // useEffect to trigger window.print when isPrinting is true
  useEffect(() => {
    if (isPrinting && selectedSpecimenData.length > 0) {
      const timeoutId = setTimeout(() => {
        window.print();
        setIsPrinting(false); // Reset after print dialog is shown/closed
      }, 200); // Small delay to ensure DOM is updated
      return () => clearTimeout(timeoutId);
    }
  }, [isPrinting, selectedSpecimenData]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("print_qr_codes")}</SheetTitle>
          </SheetHeader>

          <div className="flex items-center justify-between my-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {t("select_all")}
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                {t("clear_selection")}
              </Button>
            </div>
            <Button
              disabled={selectedSpecimens.size === 0}
              onClick={handlePrint}
            >
              <CareIcon icon="l-print" className="mr-2 h-4 w-4" />
              {t("print_selected")}
            </Button>
          </div>

          {localSpecimens.length > 0 && (
            <div className="mb-4 p-3 border rounded-lg">
              <p className="text-sm font-medium mb-2">
                {t("show_patient_details_and_specimen_id")}
              </p>
              <RadioGroup
                value={showDetails ? "yes" : "no"}
                onValueChange={(value) => setShowDetails(value === "yes")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="option-yes" />
                  <Label htmlFor="option-yes">{t("yes")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="option-no" />
                  <Label htmlFor="option-no">{t("no")}</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            {localSpecimens.length === 0 ? (
              <EmptyState
                icon="l-qrcode-scan"
                title={t("no_specimens_available")}
                description={t("no_specimens_available_description")}
              />
            ) : (
              <div className="space-y-4">
                {localSpecimens.map((specimen) => (
                  <div
                    key={specimen.id}
                    className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`specimen-${specimen.accession_identifier || specimen.id}`}
                        checked={selectedSpecimens.has(specimen.id)}
                        onCheckedChange={() => toggleSpecimen(specimen.id)}
                      />
                      <div className="flex flex-1 justify-between items-start">
                        <div className="space-y-1">
                          <label
                            htmlFor={`specimen-${specimen.id}`}
                            className="text-base font-medium cursor-pointer"
                          >
                            {specimen.specimen_type?.display || t("specimen")}
                          </label>
                          <div className="text-sm text-gray-500">
                            {specimen.specimen_definition?.title}
                          </div>
                          <div className="text-xs text-gray-700 font-medium uppercase mt-1">
                            {specimen.accession_identifier || specimen.id}
                          </div>
                        </div>
                        <Badge
                          variant={SPECIMEN_STATUS_COLORS[specimen.status]}
                          className="capitalize"
                        >
                          {specimen.status}
                        </Badge>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mt-4",
                        "flex",
                        showDetails ? "gap-6" : "justify-center",
                        "p-4 rounded-lg border border-gray-200",
                      )}
                    >
                      <div
                        className={cn("shrink-0", !showDetails && "mx-auto")}
                      >
                        <QRCodeSVG
                          value={specimen.accession_identifier || specimen.id}
                          size={qrCodeSize}
                          className="bg-white"
                          imageSettings={{
                            src: "/images/care_logo_mark.svg",
                            height: logoSize,
                            width: logoSize,
                            excavate: true,
                          }}
                          level="H"
                        />
                      </div>
                      {showDetails && (
                        <div>
                          <div className="text-lg font-semibold pt-2.5">
                            {specimen.specimen_type?.display || t("specimen")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {specimen.specimen_definition?.title}
                          </div>
                          <div className="font-semibold uppercase text-sm text-gray-700">
                            {specimen.accession_identifier || specimen.id}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {isPrinting && selectedSpecimenData.length > 0 && (
        <div className="print-only">
          <PrintableQRCodeArea
            specimens={selectedSpecimenData}
            logoSize={logoSize}
            printSize={printSize}
            showDetails={showDetails}
          />
        </div>
      )}
    </>
  );
}
