import { useEffect, useState } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import ClaimsProceduresBuilder from "./ClaimsProceduresBuilder";
import { HCXClaimModel } from "./models";
import HCXPolicyEligibilityCheck from "./PolicyEligibilityCheck";
import * as Notification from "../../Utils/Notifications.js";
import { HCXActions } from "../../Redux/actions";
import { useDispatch } from "react-redux";

interface Props {
  consultationId: string;
  patientId: string;
}

export default function HCXMakeClaim({ consultationId, patientId }: Props) {
  const dispatch = useDispatch<any>();
  const [claim, setClaim] = useState<HCXClaimModel>();
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    async function fetchClaim() {
      const res = await dispatch(
        HCXActions.claims.list({
          consultation: consultationId,
        })
      );

      if (res.data && res.data.results.length) {
        setClaim(res.data.results[0]);
        if (res.data.results[0].outcome === "Processing Complete") {
          setIsApproved(true);
        }
      } else {
        setClaim({
          policy: "",
          procedures: [],
          consultation: consultationId,
        });
      }
    }

    fetchClaim();
  }, []);

  const handleMakeClaim = async () => {
    if (!claim) return;

    if (!claim.policy || !claim.procedures?.length) {
      Notification.Error({ msg: "Please select a policy and add procedures" });
      return;
    }

    const res = await dispatch(HCXActions.claims.create(claim));

    if (res.data) {
      setClaim(res.data);
      await dispatch(HCXActions.makeClaim(res.data.id));
      Notification.Success({ msg: "Claim created successfully" });
    }
  };

  if (!claim) {
    return <div>Checking for existing claim for the consultation...</div>;
  }

  const isUpdate = !!claim.id;

  return (
    <div className="flex flex-col gap-8">
      {isApproved && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CareIcon className="care-l-check bg-primary-500 text-white text-lg rounded-full" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Claim Approved
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Approved Amount: INR {claim?.total_amount_approved}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isUpdate && (
        <div className="flex flex-col gap-4">
          <h1 className="text-lg font-bold">
            Check Insurance Policy Eligibility
          </h1>
          <HCXPolicyEligibilityCheck
            patient={patientId}
            onEligiblePolicySelected={(policy) => {
              setClaim({
                ...claim,
                policy: policy?.id || "",
                policy_object: policy,
                consultation: consultationId,
              });
            }}
          />
        </div>
      )}

      {isUpdate && (
        <div className="flex flex-col gap-4">
          <h1 className="text-lg font-bold">Policy</h1>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Policy ID</span>
              <span className="text-sm font-bold">
                {claim.policy_object?.policy_id}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Subscriber ID</span>
              <span className="text-sm font-bold">
                {claim.policy_object?.subscriber_id}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Insurer ID</span>
              <span className="text-sm font-bold">
                {claim.policy_object?.insurer_id}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">Insurer Name</span>
              <span className="text-sm font-bold">
                {claim.policy_object?.insurer_name}
              </span>
            </div>
          </div>
        </div>
      )}

      {claim?.policy && (
        <div className="flex flex-col gap-4">
          <div className="flex w-full items-center justify-between">
            <h1 className="font-bold text-left text-lg">Procedures</h1>
            <ButtonV2
              type="button"
              variant="alert"
              border
              ghost={claim.procedures?.length !== 0}
              onClick={() =>
                setClaim({
                  ...claim,
                  procedures: [
                    ...(claim.procedures || []),
                    { id: "", name: "", price: 0.0 },
                  ],
                })
              }
            >
              <CareIcon className="care-l-plus text-lg" />
              <span>Add Procedure</span>
            </ButtonV2>
          </div>
          <ClaimsProceduresBuilder
            disabled={isApproved}
            name="procedures"
            value={claim.procedures || []}
            onChange={({ value }) => setClaim({ ...claim, procedures: value })}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Cancel />
        {!isApproved && (
          <Submit
            label={isUpdate ? "Update Claim" : "Make Claim"}
            onClick={handleMakeClaim}
          />
        )}
      </div>
    </div>
  );
}
