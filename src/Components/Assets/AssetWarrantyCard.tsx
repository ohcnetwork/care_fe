import { formatDate } from "../../Utils/utils";
import { AssetData } from "./AssetTypes";

interface AssetWarrantyCardProps {
  asset: AssetData;
  view: "front" | "back";
}

export default function AssetWarrantyCard(props: AssetWarrantyCardProps) {
  return props.view === "front"
    ? CardFrontView(props.asset)
    : CardBackView(props.asset);
}

function CardFrontView(asset: AssetData) {
  return (
    <div className="rounded-2xl bg-primary-600 hover:scale-[1.01] hover:bg-primary-500 text-white p-6 sm:w-96 sm:h-56 vs:w-80 vs:h-50 w-screen h-auto transition-all">
      <div className="flex justify-end px-2">
        {asset.manufacturer ? (
          <i className="font-bold vs:text-xl sm:text-2xl text-md">
            {asset.manufacturer}
          </i>
        ) : (
          <i className="vs:text-xl sm:text-2xl text-md text-gray-400">
            Manufacturer Unknown
          </i>
        )}
      </div>
      <div className="flex justify-center pt-6 flex-col">
        <span
          className={`uppercase tracking-widest font-bold vs:text-md sm:text-xl text-sm ${
            !asset.serial_number && "text-gray-400"
          }`}
        >
          {asset.serial_number || "--"}
        </span>
        <span className="tracking-wide sm:text-sm text-xs text-white/50">
          SERIAL NUMBER
        </span>
      </div>
      <div className="flex justify-between pt-6">
        <div className=" flex flex-col justify-start">
          <span
            className={`uppercase tracking-widest font-bold vs:text-md sm:text-xl text-sm ${
              !asset.warranty_amc_end_of_validity && "text-gray-400"
            }`}
          >
            {(asset.warranty_amc_end_of_validity &&
              formatDate(asset.warranty_amc_end_of_validity)) ||
              "--"}
          </span>
          <span className="tracking-wide sm:text-sm text-xs text-white/50">
            EXPIRY
          </span>
        </div>
        <div className=" flex flex-col items-end">
          <span
            className={`tracking-wide font-bold vs:text-md sm:text-xl text-sm ${
              !asset.serial_number && "text-gray-400"
            }`}
          >
            {asset.vendor_name || "--"}
          </span>
          <span className="tracking-wide sm:text-sm text-xs mr-2 text-white/50">
            VENDOR
          </span>
        </div>
      </div>
    </div>
  );
}

function CardBackView(asset: AssetData) {
  return (
    <div className="rounded-2xl bg-primary-600 hover:scale-[1.01] hover:bg-primary-500 text-white p-6 sm:w-96 sm:h-56 vs:w-80 vs:h-50 w-screen h-auto transition-all">
      <div className="flex flex-col px-2 items-center">
        <span className="tracking-wide sm:text-sm text-xs mb-6 justify-center text-white/50">
          CUSTOMER SUPPORT DETAILS
        </span>
        {/* Support Name */}
        {asset.support_name && (
          <span className="tracking-wide font-bold vs:text-md sm:text-lg text-sm mb-2">
            {asset.support_name}
          </span>
        )}
        {/* Support Phone */}
        {asset.support_phone ? (
          <a
            href={`tel:${asset.support_phone}`}
            className="group flex items-center justify-between text-white rounded hover:bg-black/20 py-2 px-3 transition-all"
          >
            <span className="tracking-wide font-medium sm:text-base text-sm text-gray-50">
              {asset.support_phone}
            </span>
            <div className="ml-3 text-gray-300  group-hover:text-gray-100 transition-all">
              <span className="sm:text-sm text-xs">CALL</span>
              <i className="fas fa-phone-alt ml-2" />
            </div>
          </a>
        ) : (
          <span className="tracking-wide sm:text-sm text-xs text-gray-400">
            No Support Number Provided
          </span>
        )}
        {/* Support Email */}
        {asset.support_email ? (
          <a
            href={`mailto:${asset.support_email}`}
            className="group flex items-center justify-between text-white rounded hover:bg-black/20 py-2 px-3 transition-all"
          >
            <span className="tracking-wide font-medium sm:text-base text-sm text-gray-50">
              {asset.support_email}
            </span>
            <div className="ml-3 text-gray-300 group-hover:text-gray-100 transition-all">
              <span className="sm:text-sm text-xs">MAIL</span>
              <i className="fas fa-envelope ml-2" />
            </div>
          </a>
        ) : (
          <span className="tracking-wide sm:text-sm text-xs text-gray-400">
            No Support Email Provided
          </span>
        )}
      </div>
    </div>
  );
}
