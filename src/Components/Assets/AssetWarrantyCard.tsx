import moment from "moment";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { AssetData } from "./AssetTypes";

export default function AssetWarrantyCard(props: { asset: AssetData }) {
  const { asset } = props;

  const details = {
    "Serial Number": asset.serial_number,
    Expiry:
      asset.warranty_amc_end_of_validity &&
      moment(asset.warranty_amc_end_of_validity).format("DD/MM/YYYY"),
    Vendor: asset.vendor_name,
  };

  return (
    <div className="warranty-card md:rounded-xl relative overflow-hidden z-10 hover:scale-[1.01] hover:from-primary-600 hover:to-primary-700 text-white p-6 md:w-full lg:w-[300px] xl:w-96 h-full w-screen transition-all flex flex-col">
      <div className="text-right font-bold text-lg italic mb-3">
        {asset.manufacturer}
      </div>
      <div className="flex flex-col md:flex-row lg:flex-col justify-between gap-6 h-full">
        <div className="flex flex-col gap-4 border-b md:border-r md:border-b-0 lg:border-r-0 lg:border-b border-white/40 h-full w-full lg:w-auto">
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
        <div className="shrink-0">
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
                {item[1] && (
                  <>
                    <div className="w-16 text-gray-200 italic">{item[0]} :</div>
                    <a
                      href={
                        (item[0] === "Email" ? "mailto:" : "tel:") + item[1]
                      }
                      className="text-primary-300 hover:text-primary-400 border-b border-primary-300"
                    >
                      <CareIcon className={"h-5 mr-1 care-l-" + item[2]} />
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
