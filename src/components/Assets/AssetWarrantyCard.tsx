import { t } from "i18next";
import { useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { AssetData } from "@/components/Assets/AssetTypes";

import { formatDate } from "@/Utils/utils";

export default function AssetWarrantyCard(props: { asset: AssetData }) {
  const { asset } = props;

  const details = {
    "Serial Number": asset.serial_number,
    "Warranty/AMC Expiry":
      asset.warranty_amc_end_of_validity &&
      formatDate(asset.warranty_amc_end_of_validity),
    Vendor: asset.vendor_name,
  };

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <div className="warranty-card relative z-10 flex h-full w-screen flex-col overflow-hidden p-6 text-white transition-all hover:scale-[1.01] hover:from-primary-600 hover:to-primary-700 md:w-full md:rounded-xl xl:w-96">
      <div className="mb-3 text-right text-lg font-bold italic">
        {asset.manufacturer}
      </div>
      <div className="flex h-full flex-col justify-between gap-2 md:flex-row xl:flex-col">
        <div className="flex h-full w-full flex-col gap-4 md:border-r xl:w-auto xl:border-r-0">
          {Object.keys(details).map((key) => (
            <div className="">
              <div className="mb-1 text-xs uppercase italic tracking-widest text-secondary-200">
                {key}
              </div>
              <div className="flex items-center gap-2 font-semibold">
                {details[key as keyof typeof details] || "--"}
                {key === "Serial Number" && (
                  <button className="tooltip tooltip-bottom">
                    <CopyToClipboard
                      text={details[key as keyof typeof details] || "--"}
                      onCopy={() => setIsCopied(true)}
                    >
                      {isCopied ? (
                        <span className="text-sm text-white">
                          {t("copied_to_clipboard")}
                        </span>
                      ) : (
                        <CareIcon icon="l-copy" className="text-lg" />
                      )}
                    </CopyToClipboard>
                    <span className="tooltip-text">Copy to clipboard</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mb-2 hidden h-px w-full bg-white/40 xl:block" />
        <div className="shrink-0">
          <div>
            <div className="mb-1 text-xs uppercase italic tracking-widest text-secondary-200">
              Customer Support Details
            </div>
            <div className="font-semibold">{asset.support_name || "--"}</div>
          </div>
          <div className="mt-3">
            {[
              ["Phone", asset.support_phone, "l-phone"],
              ["Email", asset.support_email, "l-envelope"],
            ].map((item) => (
              <div className="flex items-center">
                {item[1] && (
                  <>
                    <div className="w-16 italic text-secondary-200">
                      {item[0]} :
                    </div>
                    <a
                      href={
                        (item[0] === "Email" ? "mailto:" : "tel:") + item[1]
                      }
                      className="border-b border-primary-300 text-primary-300 hover:text-primary-400"
                    >
                      <CareIcon icon={item[2] as IconName} className="mr-1" />
                      {item[1]}
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
