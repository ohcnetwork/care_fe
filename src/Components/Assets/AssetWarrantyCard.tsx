import moment from "moment";
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
    <div className="rounded-2xl shadow-xl hover:shadow-2xl bg-gray-700 hover:scale-[1.01] hover:bg-gray-600 text-white p-6 w-96 h-56 transition-all">
      <div className="flex justify-end px-2">
        {asset.manufacturer ? (
          <i className="font-bold text-2xl">{asset.manufacturer}</i>
        ) : (
          <i className="text-2xl text-gray-400">Manufacturer Unknown</i>
        )}
      </div>
      <div className="flex justify-center pt-6 flex-col">
        <span
          className={`uppercase tracking-widest font-bold text-xl ${
            !asset.serial_number && "text-gray-400"
          }`}
        >
          {asset.serial_number || "--"}
        </span>
        <span className="tracking-wide text-sm">SERIAL NUMBER</span>
      </div>
      <div className="flex justify-between pt-6">
        <div className=" flex flex-col justify-start">
          <span
            className={`uppercase tracking-widest font-bold text-xl ${
              !asset.warranty_amc_end_of_validity && "text-gray-400"
            }`}
          >
            {(asset.warranty_amc_end_of_validity &&
              moment(asset.warranty_amc_end_of_validity).format("DD/MM/YY")) ||
              "--"}
          </span>
          <span className="tracking-wide text-sm">EXPIRY</span>
        </div>
        <div className=" flex flex-col items-end">
          <span
            className={`tracking-wide font-bold text-lg ${
              !asset.serial_number && "text-gray-400"
            }`}
          >
            {asset.vendor_name || "--"}
          </span>
          <span className="tracking-wide text-sm mr-2">VENDOR</span>
        </div>
      </div>
    </div>
  );
}

function CardBackView(asset: AssetData) {
  return (
    <div className="rounded-2xl shadow-xl hover:shadow-2xl bg-gray-700 hover:scale-[1.01] hover:bg-gray-600 text-white p-6 w-96 h-56 transition-all">
      <div className="flex flex-col px-2 items-center">
        <span className="tracking-wide text-sm mb-6 justify-center">
          CUSTOMER SUPPORT DETAILS
        </span>
        {/* Support Name */}
        {asset.support_name && (
          <span className="tracking-wide font-bold text-lg mb-2">
            {asset.support_name}
          </span>
        )}
        {/* Support Phone */}
        {asset.support_phone ? (
          <a
            href={`tel:${asset.support_phone}`}
            className="group flex items-center justify-between text-white rounded hover:bg-gray-500 py-2 px-3 transition-all"
          >
            <span className="tracking-wide font-medium text-gray-50">
              {asset.support_phone}
            </span>
            <div className="ml-3 text-gray-300 group-hover:text-gray-100 transition-all">
              <span className="text-sm">CALL</span>
              <i className="fas fa-phone-alt ml-2" />
            </div>
          </a>
        ) : (
          <span className="tracking-wide text-sm text-gray-400">
            No Support Number Provided
          </span>
        )}
        {/* Support Email */}
        {asset.support_email ? (
          <a
            href={`mailto:${asset.support_email}`}
            className="group flex items-center justify-between text-white rounded hover:bg-gray-500 py-2 px-3 transition-all"
          >
            <span className="tracking-wide font-medium text-gray-50">
              {asset.support_email}
            </span>
            <div className="ml-3 text-gray-300 group-hover:text-gray-100 transition-all">
              <span className="text-sm">MAIL</span>
              <i className="fas fa-envelope ml-2" />
            </div>
          </a>
        ) : (
          <span className="tracking-wide text-sm text-gray-400">
            No Support Email Provided
          </span>
        )}
      </div>
    </div>
  );
}
