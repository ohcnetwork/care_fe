"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

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
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Calculate logo size as 25% of QR code size
  const logoSize = Math.floor(size * 0.25);

  return (
    <>
      <div
        id="single-print"
        className="flex print:scale-60 print:justify-start flex-col sm:flex-row print:flex-row print:items-start justify-between items-center sm:items-start gap-4 sm:gap-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start print:flex-row print:items-start">
          <div ref={qrCodeRef} className="shrink-0">
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
            {title && (
              <div className="text-lg font-semibold pt-2.5">{title}</div>
            )}
            {subtitle && (
              <div className="text-sm text-gray-600">{subtitle}</div>
            )}
            {value && (
              <div className="font-semibold uppercase text-sm text-gray-700">
                {value}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-auto print:hidden"
          type="button"
          onClick={() => print()}
        >
          {t("PRINTABLE_QR_CODE__print_button")}
        </Button>
      </div>
    </>
  );
}
