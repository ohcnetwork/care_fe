import { classNames, formatCurrency, formatDateTime } from "../../Utils/utils";
import { HCXClaimModel } from "../HCX/models";

interface IProps {
  claim: HCXClaimModel;
}

export default function ClaimDetailCard({ claim }: IProps) {
  const status =
    claim.outcome === "Processing Complete"
      ? claim.error_text
        ? "Rejected"
        : "Approved"
      : "Pending";

  return (
    <div className="px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-700">
            #{claim.id?.slice(0, 5)}
          </h1>

          <p className="mt-2 text-sm text-gray-700">
            Created on{" "}
            <time dateTime="2022-08-01">
              {formatDateTime(claim.created_date ?? "")}
            </time>
            .
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 sm:ml-16 sm:mt-0">
          {claim.use && (
            <span className="rounded bg-primary-100 p-1 px-2 text-sm font-bold text-primary-500 shadow">
              {claim.use}
            </span>
          )}
          <span
            className={classNames(
              "rounded p-1 px-2 text-sm font-bold text-white shadow",
              status === "Approved" && "bg-primary-400",
              status === "Rejected" && "bg-danger-400",
              status === "Pending" && "bg-yellow-400"
            )}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">
            {claim.policy_object?.policy_id || "NA"}
          </h2>
          <p className="text-sm text-gray-500">Policy ID</p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">
            {claim.policy_object?.subscriber_id || "NA"}
          </h2>
          <p className="text-sm text-gray-500">Subscriber ID</p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">
            {claim.policy_object?.insurer_id || "NA"}
          </h2>
          <p className="text-sm text-gray-500">Insurer ID</p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-800">
            {claim.policy_object?.insurer_name || "NA"}
          </h2>
          <p className="text-sm text-gray-500">Insurer Name</p>
        </div>
      </div>
      <div className="-mx-6 mt-8 flow-root sm:mx-0">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
              >
                Items
              </th>
              <th></th>
              <th></th>
              <th
                scope="col"
                className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-gray-900 sm:pr-0"
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {claim.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-4 pl-6 pr-3 text-sm sm:pl-0">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="mt-0.5 text-gray-500">{item.id}</div>
                </td>
                <td></td>
                <td></td>
                <td className="py-4 pl-3 pr-6 text-right text-sm text-gray-500 sm:pr-0">
                  {formatCurrency(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                colSpan={3}
                className="hidden pl-6 pr-3 pt-6 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0"
              >
                Total Claim Amount
              </th>
              <th
                scope="row"
                className="pl-6 pr-3 pt-6 text-left text-sm font-normal text-gray-500 sm:hidden"
              >
                Total Claim Amount
              </th>
              <td className="pl-3 pr-6 pt-6 text-right text-sm text-gray-500 sm:pr-0">
                {claim.total_claim_amount &&
                  formatCurrency(claim.total_claim_amount)}
              </td>
            </tr>

            <tr>
              <th
                scope="row"
                colSpan={3}
                className="hidden pl-6 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-0"
              >
                Total Amount Approved
              </th>
              <th
                scope="row"
                className="pl-6 pr-3 pt-4 text-left text-sm font-semibold text-gray-900 sm:hidden"
              >
                Total Amount Approved
              </th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">
                {claim.total_amount_approved
                  ? formatCurrency(claim.total_amount_approved)
                  : "NA"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {claim.error_text && (
        <div className="mt-4 text-center text-sm font-bold text-red-500">
          {claim.error_text}
        </div>
      )}
    </div>
  );
}
