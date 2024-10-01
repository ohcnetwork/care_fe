import { classNames, formatCurrency, formatDateTime } from "../../Utils/utils";

import { HCXClaimModel } from "./models";
import { useTranslation } from "react-i18next";

interface IProps {
  claim: HCXClaimModel;
}

const claimStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export default function ClaimCardInfo({ claim }: IProps) {
  const { t } = useTranslation();

  const status =
    claim.outcome === "Complete"
      ? claim.error_text
        ? claimStatus.REJECTED
        : claimStatus.APPROVED
      : claimStatus.PENDING;

  return (
    <>
      <div className="sm:flex sm:items-end">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-secondary-700">
            #{claim.id?.slice(0, 5)}
          </h1>

          <p className="mt-2 text-sm text-secondary-700">
            {t("created_on")}{" "}
            <time dateTime={claim.created_date}>
              {formatDateTime(claim.created_date ?? "")}
            </time>
            .
          </p>
        </div>
        <div className="mt-4 flex flex-row-reverse items-center justify-center gap-3 max-sm:justify-end sm:ml-16 sm:mt-0">
          {claim.use && (
            <span className="rounded bg-primary-100 p-1 px-2 text-sm font-bold text-primary-500 shadow">
              {claim.use}
            </span>
          )}
          <span
            className={classNames(
              "rounded p-1 px-2 text-sm font-bold text-white shadow",
              status === claimStatus.APPROVED && "bg-primary-400",
              status === claimStatus.REJECTED && "bg-danger-400",
              status === claimStatus.PENDING && "bg-yellow-400",
            )}
          >
            {t(`claim__status__${status}`)}
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="text-center">
          <h2 className="text-lg font-bold text-secondary-800">
            {claim.policy_object?.policy_id || "NA"}
          </h2>
          <p className="text-sm text-secondary-500">{t("policy__policy_id")}</p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-secondary-800">
            {claim.policy_object?.subscriber_id || "NA"}
          </h2>
          <p className="text-sm text-secondary-500">
            {t("policy__subscriber_id")}
          </p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-secondary-800">
            {claim.policy_object?.insurer_id?.split("@").shift() || "NA"}
          </h2>
          <p className="text-sm text-secondary-500">
            {t("policy__insurer_id")}
          </p>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-secondary-800">
            {claim.policy_object?.insurer_name || "NA"}
          </h2>
          <p className="text-sm text-secondary-500">
            {t("policy__insurer_name")}
          </p>
        </div>
      </div>
      <div className="-mx-6 mt-8 flow-root sm:mx-0">
        <table className="min-w-full divide-y divide-secondary-300">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-secondary-900 sm:pl-0"
              >
                {t("claim__items")}
              </th>
              <th></th>
              <th></th>
              <th
                scope="col"
                className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-secondary-900 sm:pr-0"
              >
                {t("claim__item__price")}
              </th>
            </tr>
          </thead>
          <tbody>
            {claim.items?.map((item) => (
              <tr key={item.id} className="border-b border-secondary-200">
                <td className="py-4 pl-6 pr-3 text-sm sm:pl-0">
                  <div className="font-medium text-secondary-900">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-secondary-500">{item.id}</div>
                </td>
                <td></td>
                <td></td>
                <td className="py-4 pl-3 pr-6 text-right text-sm text-secondary-500 sm:pr-0">
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
                className="table-cell pl-6 pr-3 pt-6 text-right text-sm font-normal text-secondary-500 sm:pl-0"
              >
                {t("claim__total_claim_amount")}
              </th>
              <td className="pl-3 pr-6 pt-6 text-right text-sm text-secondary-500 sm:pr-0">
                {claim.total_claim_amount &&
                  formatCurrency(claim.total_claim_amount)}
              </td>
            </tr>

            <tr>
              <th
                scope="row"
                colSpan={3}
                className="table-cell pl-6 pr-3 pt-4 text-right text-sm font-semibold text-secondary-900 sm:pl-0"
              >
                {t("claim__total_approved_amount")}
              </th>
              <td className="pl-3 pr-6 pt-4 text-right text-sm font-semibold text-secondary-900 sm:pr-0">
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
    </>
  );
}
