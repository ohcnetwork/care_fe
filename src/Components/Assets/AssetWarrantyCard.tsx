import CareIcon from "../../CAREUI/icons/CareIcon";
import { AssetData } from "./AssetTypes";
import { classNames, formatDate } from "../../Utils/utils";

export default function AssetWarrantyCard(props: { asset: AssetData }) {
  const { asset } = props;

  const details = {
    "Serial Number": asset.serial_number,
    Expiry:
      asset.warranty_amc_end_of_validity &&
      formatDate(asset.warranty_amc_end_of_validity),
    Vendor: asset.vendor_name,
  };

  return (
    <div className="warranty-card relative z-10 flex h-full w-screen flex-col overflow-hidden p-6 text-white transition-all hover:scale-[1.01] hover:from-primary-600 hover:to-primary-700 md:w-full md:rounded-xl xl:w-96">
      <div className="mb-3 text-right text-lg font-bold italic">
        {asset.manufacturer}
      </div>
      <div className="flex h-full flex-col justify-between gap-6 md:flex-row xl:flex-col">
        <div className="flex h-full w-full flex-col gap-4 border-b border-white/40 md:border-b-0 md:border-r xl:w-auto xl:border-b xl:border-r-0">
          {Object.keys(details).map((key) => (
            <div className="">
              <div className="mb-1 text-xs uppercase italic tracking-widest text-gray-200">
                {key}
              </div>
              <div className="font-semibold">
                {details[key as keyof typeof details] || "--"}
              </div>
            </div>
          ))}
        </div>
        <div className="shrink-0">
          <div>
            <div className="mb-1 text-xs uppercase italic tracking-widest text-gray-200">
              Customer Support Details
            </div>
            <div className="font-semibold">{asset.support_name || "--"}</div>
          </div>
          <div className="mt-3">
            {[
              ["Phone", asset.support_phone, "phone"],
              ["Email", asset.support_email, "envelope"],
            ].map((item) => (
              <div className="flex items-center">
                {item[1] && (
                  <>
                    <div className="w-16 italic text-gray-200">{item[0]} :</div>
                    <a
                      href={
                        (item[0] === "Email" ? "mailto:" : "tel:") + item[1]
                      }
                      className="border-b border-primary-300 text-primary-300 hover:text-primary-400"
                    >
                      <CareIcon
                        className={classNames(`care-l-${item[2]}`, "mr-1")}
                      />
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
