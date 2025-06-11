import careConfig from "@careConfig";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

interface QRPrintProps {
  value: string;
  title?: string;
  subtitle?: string;
  identifier?: string;
  size?: number;
  printSize?: number;
}

export function QRPrint({
  value,
  title,
  subtitle,
  identifier,
  size = 100,
  printSize = 80,
}: QRPrintProps) {
  const { t } = useTranslation();

  // Calculate logo size as 25% of QR code size
  const logoSize = Math.floor(size * 0.25);

  return (
    <PrintPreview title={title || t("qr_code")} showBackButton={false}>
      <div className="h-full py-2 max-w-sm mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-2 border-b border-gray-200">
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                  {t("qr_code")}
                </h2>
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* QR Code Content */}
          <div className="flex gap-4">
            <div className="shrink-0">
              <QRCodeSVG
                value={value}
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

          {/* Footer */}
          <div className="mt-8 space-y-1 pt-2 text-[10px] text-gray-500 flex justify-between">
            <p>
              {t("generated_on")} {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
}
