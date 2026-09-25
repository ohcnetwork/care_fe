"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PrintPreviewDialog } from "@/CAREUI/misc/PrintPreviewDialog";
import { Button } from "@/components/ui/button";

interface PrintableQRCodeProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  printSize?: number;
}

export function PrintableQRCode({
  value,
  title,
  subtitle,
  size = 100,
}: PrintableQRCodeProps) {
  const [printOpen, setPrintOpen] = useState(false);
  const { t } = useTranslation();

  // Calculate logo size as 25% of QR code size
  const logoSize = Math.floor(size * 0.25);

  const content = (
    <div className="flex print:scale-60 print:justify-start flex-col sm:flex-row print:flex-row print:items-start justify-between items-center sm:items-start gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start print:flex-row print:items-start">
        <div className="shrink-0">
          <QRCodeSVG
            value={value}
            size={size}
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
        <div className="text-center print:text-left sm:text-left">
          {title && <div className="text-lg font-semibold pt-2.5">{title}</div>}
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
          {value && (
            <div className="font-semibold uppercase text-sm text-gray-700">
              {value}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {content}
        <Button
          variant="outline"
          size="sm"
          className="w-auto print:hidden"
          type="button"
          onClick={() => setPrintOpen(true)}
        >
          {t("PRINTABLE_QR_CODE__print_button")}
        </Button>
      </div>
      <PrintPreviewDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        title={t("qr_codes")}
        templateSlug="qr_codes"
      >
        {content}
      </PrintPreviewDialog>
    </>
  );
}
