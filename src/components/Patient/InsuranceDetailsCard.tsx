import { navigate } from "raviger";

import ButtonV2 from "@/components/Common/ButtonV2";
import { HCXPolicyModel } from "@/components/HCX/models";

interface InsuranceDetails {
  data?: HCXPolicyModel;
  showViewAllDetails?: boolean;
}

export const InsuranceDetialsCard = (props: InsuranceDetails) => {
  const { data, showViewAllDetails } = props;

  return (
    <div className="w-full">
      <div className="h-full space-y-2 rounded-lg bg-white p-7 shadow">
        <div className="border-b border-dashed pb-2 text-xl font-bold text-secondary-900">
          Policy Details
        </div>
        {data ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2">
            <div className=" ">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Member ID
              </div>
              <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                {data.subscriber_id || ""}
              </div>
            </div>
            <div className=" ">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Policy ID / Policy Name
              </div>
              <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                {data.policy_id || ""}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Insurer ID
              </div>
              <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                {data.insurer_id || ""}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                Insurer Name
              </div>
              <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                {data.insurer_name || ""}
              </div>
            </div>
            {showViewAllDetails && (
              <div className="first-letter: sm:col-span-2 md:ml-auto md:mt-10">
                <div className="mt-1 whitespace-normal break-words text-sm font-medium leading-5">
                  <ButtonV2
                    id="insurance-view-details"
                    onClick={() => {
                      navigate(
                        `/facility/${data.patient_object?.facility_object?.id}/patient/${data.patient_object?.id}/insurance`,
                      );
                    }}
                    className="h-auto whitespace-pre-wrap border border-secondary-500 bg-white text-black hover:bg-secondary-300"
                  >
                    View All Details
                  </ButtonV2>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center justify-center text-xl font-bold text-secondary-500">
            No Insurance Details Available
          </div>
        )}
      </div>
    </div>
  );
};
