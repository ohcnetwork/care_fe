import { useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { HCXActions } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { classNames } from "../../Utils/utils";
import ButtonV2, { Cancel, Submit } from "../Common/components/ButtonV2";
import ClaimsProceduresBuilder from "./ClaimsProceduresBuilder";
import { HCXClaimModel, HCXPolicyModel, HCXProcedureModel } from "./models";
import HCXPolicyEligibilityCheck from "./PolicyEligibilityCheck";

interface Props {
  consultationId: string;
  patientId: string;
  onClaimCreated: (claim: HCXClaimModel) => void;
}

export default function CreateClaimCard({
  consultationId,
  patientId,
  onClaimCreated,
}: Props) {
  const dispatch = useDispatch<any>();
  const [policy, setPolicy] = useState<HCXPolicyModel>();
  const [procedures, setProcedures] = useState<HCXProcedureModel[]>();
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (procedures?.length === 0 || !policy) return;

    setIsCreating(true);

    // TODO: validate procedures

    const res = await dispatch(
      HCXActions.claims.create({
        policy: policy.id,
        procedures: procedures,
        consultation: consultationId,
      })
    );

    if (res.data) {
      Notification.Success({ msg: "Claim created successfully" });
      onClaimCreated(res.data);
    } else {
      Notification.Error({ msg: "Failed to create claim" });
    }

    const makeClaimRes = await dispatch(HCXActions.makeClaim(res.data.id));

    if (makeClaimRes.status === 200 && makeClaimRes.data) {
      // TODO: reset form
    }

    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Check Insurance Policy Eligibility */}
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">
          Check Insurance Policy Eligibility
        </h1>
        <HCXPolicyEligibilityCheck
          patient={patientId}
          onEligiblePolicySelected={setPolicy}
        />
      </div>

      {/* Procedures */}
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="font-bold text-left text-lg">Procedures</h1>
          <ButtonV2
            type="button"
            variant="alert"
            border
            ghost={procedures?.length !== 0}
            disabled={procedures === undefined || !policy}
            onClick={() =>
              setProcedures([
                ...(procedures || []),
                { name: "", id: "", price: 0 },
              ])
            }
          >
            <CareIcon className="care-l-plus text-lg" />
            <span>Add Procedure</span>
          </ButtonV2>
        </div>
        <span
          className={classNames(
            policy ? "opacity-0" : "opacity-100",
            "text-gray-700 transition-opacity duration-300 ease-in-out"
          )}
        >
          Select a policy to add procedures
        </span>
        <ClaimsProceduresBuilder
          disabled={procedures === undefined || !policy}
          name="procedures"
          value={procedures}
          onChange={({ value }) => setProcedures(value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Cancel
        // TODO: onClick={handleReset}
        />
        <Submit
          disabled={procedures?.length === 0 || !policy || isCreating}
          onClick={handleSubmit}
        >
          {isCreating && <CareIcon className="care-l-spinner" />}
          {isCreating ? "Creating Claim..." : "Create Claim"}
        </Submit>
      </div>
    </div>
  );
}
