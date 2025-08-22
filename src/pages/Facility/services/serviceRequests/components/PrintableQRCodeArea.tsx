import careConfig from "@careConfig";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { SpecimenRead } from "@/types/emr/specimen/specimen";

interface PrintableQRCodeAreaProps {
  specimens: SpecimenRead[];
  logoSize: number;
  printSize: number;
  showDetails?: boolean;
}

export function PrintableQRCodeArea({
  specimens,
  logoSize,
  printSize,
  showDetails = true,
}: PrintableQRCodeAreaProps) {
  const { t } = useTranslation();

  return (
    <div id="section-to-print" className="w-full print:py-10">
      {/* Header */}
      <div className="flex justify-between items-start pb-2 border-b border-gray-200 print:border-gray-300">
        <div className="space-y-4 flex-1">
          <div>
            <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1 print:text-black">
              {t("qr_codes")}
            </h2>
          </div>
        </div>
        <img
          src={careConfig.mainLogo?.dark}
          alt="Care Logo"
          className="h-10 w-auto object-contain ml-6 print:block"
        />
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 mt-8">
        {specimens.map((specimen) => (
          <div key={specimen.id} className="page-break-inside-avoid">
            <div className="flex gap-6 p-4 rounded-lg border border-gray-200 print:border-gray-300">
              <div className={cn("shrink-0", !showDetails && "mx-auto")}>
                <QRCodeSVG
                  value={specimen.accession_identifier || specimen.id}
                  size={printSize}
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
                  {specimen.specimen_type?.display && (
                    <div className="text-lg font-semibold pt-2.5 print:text-base">
                      {specimen.specimen_type.display}
                    </div>
                  )}
                  {specimen.specimen_definition?.title && (
                    <div className="text-sm text-gray-600 print:text-xs">
                      {specimen.specimen_definition.title}
                    </div>
                  )}
                  {specimen.id && (
                    <div className="font-semibold uppercase text-sm text-gray-700 print:text-xs">
                      {specimen.accession_identifier || specimen.id}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 space-y-1 pt-2 text-[10px] text-gray-500 flex justify-between print:text-gray-600">
        <p>
          {t("generated_on")} {new Date().toLocaleDateString()}
        </p>
        <p className="print:hidden">
          {t("total_qr_codes")}: {specimens.length}
        </p>
      </div>
    </div>
  );
}
