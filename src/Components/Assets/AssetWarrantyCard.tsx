import { formatDate } from "../../Utils/utils";
import { AssetData } from "./AssetTypes";

export default function AssetWarrantyCard(props: { asset: AssetData }) {
  const { asset } = props;

  const details = {
    "Serial Number": asset.serial_number,
    Expiry: formatDate(asset.warranty_amc_end_of_validity),
    Vendor: asset.vendor_name,
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 hover:scale-[1.01] hover:from-primary-600 hover:to-primary-700 text-white p-6 sm:w-96 vs:w-80 h-full w-screen transition-all">
      <div className="flex flex-col justify-between gap-3 h-full">
        <div>
          <div className="text-right font-bold text-lg italic mb-3">
            {asset.manufacturer}
          </div>
          <div className="flex flex-col gap-4">
            {Object.keys(details).map((key) => (
              <div className="">
                <div className="italic text-gray-200 uppercase text-xs tracking-widest mb-1">
                  {key}
                </div>
                <div className="font-semibold">
                  {details[key as keyof typeof details] || "--"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-white/40" />
        <div>
          <div>
            <div className="italic text-gray-200 uppercase text-xs tracking-widest mb-1">
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
                <div className="w-16 text-gray-200 italic">{item[0]} :</div>
                <a
                  href={(item[0] === "Email" ? "mailto:" : "") + item[1]}
                  className="text-primary-300 hover:text-primary-400 border-b border-primary-300"
                >
                  <i className={"mr-1 uil uil-" + item[2]} />
                  {item[1] || "--"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
