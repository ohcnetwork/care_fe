import { formatCurrency, formatDate } from "../../Utils/utils";
import { HCXClaimModel } from "../HCX/models";

interface IProps {
  claim: HCXClaimModel;
}

export default function ClaimDetailCard({ claim }: IProps) {
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
              {formatDate(claim.created_date ?? "")}
            </time>
            .
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 flex items-center justify-center gap-3">
          <span className="bg-red-400 text-white font-bold text-sm p-1 px-2 rounded shadow">
            {claim.priority || "NA"}
          </span>
          <span className="bg-primary-400 text-white font-bold text-sm p-1 px-2 rounded shadow">
            {claim.use || "NA"}
          </span>
          <span className="bg-blue-400 text-white font-bold text-sm p-1 px-2 rounded shadow">
            {claim.type || "NA"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
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
                Procedure
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
            {claim.procedures?.map((procedure) => (
              <tr key={procedure.id} className="border-b border-gray-200">
                <td className="py-4 pl-6 pr-3 text-sm sm:pl-0">
                  <div className="font-medium text-gray-900">
                    {procedure.name}
                  </div>
                  <div className="mt-0.5 text-gray-500">{procedure.id}</div>
                </td>
                <td></td>
                <td></td>
                <td className="py-4 pl-3 pr-6 text-right text-sm text-gray-500 sm:pr-0">
                  {formatCurrency(procedure.price)}
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
        <div className="text-red-500 text-sm text-center mt-4">
          {claim.error_text}
        </div>
      )}
    </div>
  );
}
