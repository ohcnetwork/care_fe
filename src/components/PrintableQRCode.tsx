"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { QRPrint } from "./QRPrint";

interface PrintableQRCodeProps {
  value: string;
  title?: string;
  subtitle?: string;
  identifier?: string;
  size?: number;
  printSize?: number;
}

export function PrintableQRCode({
  value,
  title,
  subtitle,
  identifier,
  size = 100,
  printSize = 80,
}: PrintableQRCodeProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Calculate logo size as 25% of QR code size
  const logoSize = Math.floor(size * 0.25);

  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex gap-6">
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
          <div>
            {title && (
              <div className="text-lg font-semibold pt-2.5">{title}</div>
            )}
            {subtitle && (
              <div className="text-sm text-gray-600">{subtitle}</div>
            )}
            {identifier && (
              <div className="font-semibold uppercase text-sm text-gray-700">
                {identifier}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          type="button"
          onClick={() => setShowPrintDialog(true)}
        >
          {t("PRINTABLE_QR_CODE__print_button")}
        </Button>
      </div>

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="md:min-w-4xl w-auto overflow-x-auto md:overflow-hidden">
          <QRPrint
            value={value}
            title={title}
            subtitle={subtitle}
            identifier={identifier}
            size={size}
            printSize={printSize}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
