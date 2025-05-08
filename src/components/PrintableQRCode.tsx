"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

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

  // Calculate logo size as 25% of QR code size
  const logoSize = Math.floor(size * 0.25);

  const handlePrint = () => {
    if (!qrCodeRef.current) return;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error(t("PRINTABLE_QR_CODE__print_error"));
      return;
    }

    // Clone the QR code element
    const qrCodeClone = qrCodeRef.current.cloneNode(true) as HTMLElement;

    // Generate the print-friendly HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("PRINTABLE_QR_CODE__print_title", { title: title || "Print" })}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .container {
              width: 50mm; /* Test tube label width */
              height: 25mm; /* Test tube label height */
              margin: 0;
              padding: 2mm;
              box-sizing: border-box;
              background: white;
              display: flex;
              align-items: center;
            }
            .content {
              display: flex;
              gap: 2mm;
              align-items: center;
              width: 100%;
            }
            .qr-code {
              flex-shrink: 0;
            }
            .qr-code svg {
              width: ${printSize}px !important;
              height: ${printSize}px !important;
              background: white;
            }
            .info {
              flex-grow: 1;
              text-align: left;
            }
            .title {
              font-size: 10pt;
              font-weight: 500;
              margin: 0 0 1mm 0;         
            }
            .subtitle {
              font-size: 8pt;
              margin: 0 0 1mm 0;
              white-space: nowrap;
            }
            .identifier {
              font-family: monospace;
              font-size: 7pt;
              margin: 0;
              word-break: break-all;
            }
            @media print {
              @page {
                size: 65mm 25mm;
                margin: 0;
              }
              html, body {
                width: 58mm;
                height: 25mm;
              }
              .container {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="qr-code">
                ${qrCodeClone.innerHTML}
              </div>
              <div class="info">
                ${title ? `<div class="title">${title}</div>` : ""}
                ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
                ${identifier ? `<div class="identifier">${identifier}</div>` : ""}
              </div>
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    // Write the content and trigger print
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
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
          {title && <div className="text-lg font-semibold pt-2.5">{title}</div>}
          {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
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
        onClick={handlePrint}
      >
        {t("PRINTABLE_QR_CODE__print_button")}
      </Button>
    </div>
  );
}
