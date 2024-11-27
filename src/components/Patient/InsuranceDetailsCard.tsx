import { useTranslation } from "react-i18next";

import { HCXPolicyModel } from "@/components/HCX/models";

interface InsuranceDetails {
  data: HCXPolicyModel;
}

export const InsuranceDetailsCard = (props: InsuranceDetails) => {
  const { data } = props;

  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="h-full space-y-2 pr-5">
        <div className="grid grid-cols-1 gap-2 rounded-md border border-secondary-400 bg-gray-50 p-5 sm:grid-cols-2 md:grid-cols-2">
          <div className=" ">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              {t("insurance__member_id")}
            </div>
            <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
              {data.subscriber_id || ""}
            </div>
          </div>
          <div className=" ">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              {t("insurance__policy_name")}
            </div>
            <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
              {data.policy_id || ""}
            </div>
          </div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              {t("insurance__insurer_id")}
            </div>
            <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
              {data.insurer_id || ""}
            </div>
          </div>
          <div className="sm:col-span-1">
            <div className="text-sm font-semibold leading-5 text-zinc-400">
              {t("insurance__insurer_name")}
            </div>
            <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
              {data.insurer_name || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
