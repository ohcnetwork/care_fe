import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { getConsultation, HCXActions } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { classNames, formatCurrency } from "../../Utils/utils";
import ButtonV2, { Submit } from "../Common/components/ButtonV2";
import ClaimsItemsBuilder from "./ClaimsItemsBuilder";
import { HCXClaimModel, HCXPolicyModel, HCXItemModel } from "./models";
import HCXPolicyEligibilityCheck from "./PolicyEligibilityCheck";
import DialogModal from "../Common/Dialog";
import PatientInsuranceDetailsEditor from "./PatientInsuranceDetailsEditor";
import ClaimCreatedModal from "./ClaimCreatedModal";
import { ProcedureType } from "../Common/prescription-builder/ProcedureBuilder";
import { SelectFormField } from "../Form/FormFields/SelectFormField";

interface Props {
  consultationId: string;
  patientId: string;
  setIsCreating: (creating: boolean) => void;
  isCreating: boolean;
  use?: "preauthorization" | "claim";
}

export default function CreateClaimCard({
  consultationId,
  patientId,
  setIsCreating,
  isCreating,
  use = "preauthorization",
}: Props) {
  const dispatch = useDispatch<any>();
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [policy, setPolicy] = useState<HCXPolicyModel>();
  const [items, setItems] = useState<HCXItemModel[]>();
  const [itemsError, setItemsError] = useState<string>();
  const [createdClaim, setCreatedClaim] = useState<HCXClaimModel>();
  const [use_, setUse_] = useState(use);

  console.log(items);

  useEffect(() => {
    async function autoFill() {
      const latestApprovedPreAuthsRes = await dispatch(
        HCXActions.preauths.list(consultationId)
      );

      if (latestApprovedPreAuthsRes.data?.results?.length) {
        // TODO: offload outcome filter to server side once payer server is back
        const latestApprovedPreAuth = (
          latestApprovedPreAuthsRes.data.results as HCXClaimModel[]
        ).find((o) => o.outcome === "Processing Complete");
        if (latestApprovedPreAuth) {
          setPolicy(latestApprovedPreAuth.policy_object);
          setItems(latestApprovedPreAuth.items ?? []);
          return;
        }
      }

      const res = await dispatch(getConsultation(consultationId as any));

      if (res.data && Array.isArray(res.data.procedure)) {
        setItems(
          res.data.procedure.map((obj: ProcedureType) => {
            return {
              id: obj.procedure,
              name: obj.procedure,
              price: 0.0,
              category: "900000", // provider's packages
            };
          })
        );
      } else {
        setItems([]);
      }
    }

    autoFill();
  }, [consultationId, dispatch]);

  const validate = () => {
    if (!policy) {
      Notification.Error({ msg: "Please select a policy" });
      return false;
    }
    if (policy?.outcome !== "Processing Complete") {
      Notification.Error({ msg: "Please select an eligible policy" });
      return false;
    }
    if (!items || items.length === 0) {
      setItemsError("Please add at least one item");
      return false;
    }
    if (items?.some((p) => !p.id || !p.name || p.price === 0 || !p.category)) {
      setItemsError("Please fill all the item details");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreating(true);

    const res = await dispatch(
      HCXActions.claims.create({
        policy: policy?.id,
        items,
        consultation: consultationId,
        use,
      })
    );

    if (res.data) {
      setItems([]);
      setItemsError(undefined);
      setPolicy(undefined);
      setCreatedClaim(res.data);
    } else {
      Notification.Error({ msg: "Failed to create pre-authorization" });
    }

    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {createdClaim && (
        <ClaimCreatedModal
          show
          claim={createdClaim}
          onClose={() => setCreatedClaim(undefined)}
        />
      )}
      <DialogModal
        title="Edit Patient Insurance Details"
        show={showAddPolicy}
        onClose={() => setShowAddPolicy(false)}
        description="Add or edit patient's insurance details"
        className="w-full max-w-screen-md"
      >
        <PatientInsuranceDetailsEditor
          patient={patientId}
          onCancel={() => setShowAddPolicy(false)}
        />
      </DialogModal>
      {/* Check Insurance Policy Eligibility */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-4">
          <h1 className="text-lg font-bold">
            Check Insurance Policy Eligibility
          </h1>
          <ButtonV2 onClick={() => setShowAddPolicy(true)} ghost border>
            <CareIcon className="care-l-edit-alt text-lg" />
            Edit Patient Insurance Details
          </ButtonV2>
        </div>
        <HCXPolicyEligibilityCheck
          patient={patientId}
          onEligiblePolicySelected={setPolicy}
        />
      </div>

      {/* Procedures */}
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-left text-lg font-bold">Items</h1>
          <ButtonV2
            type="button"
            variant="alert"
            border
            ghost={items?.length !== 0}
            disabled={items === undefined || !policy}
            onClick={() =>
              setItems([...(items ?? []), { name: "", id: "", price: 0 }])
            }
          >
            <CareIcon className="care-l-plus text-lg" />
            <span>Add Item</span>
          </ButtonV2>
        </div>
        <span
          className={classNames(
            policy ? "opacity-0" : "opacity-100",
            "text-gray-700 transition-opacity duration-300 ease-in-out"
          )}
        >
          Select a policy to add items
        </span>
        <ClaimsItemsBuilder
          disabled={items === undefined || !policy}
          name="items"
          value={items}
          onChange={({ value }) => setItems(value)}
          error={itemsError}
        />
        <div className="place-self-end pr-8">
          {"Total Amount: "}
          {items ? (
            <span className="font-bold tracking-wider">
              {formatCurrency(
                items.map((p) => p.price).reduce((a, b) => a + b, 0.0)
              )}
            </span>
          ) : (
            "--"
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <SelectFormField
          name="use"
          label="Use"
          options={[
            { id: "preauthorization", label: "Pre-Authorization" },
            { id: "claim", label: "Claim" },
          ]}
          value={use_}
          onChange={({ value }) => setUse_(value)}
          position="below"
          optionLabel={(value) => value.label}
          optionValue={(value) => value.id as "preauthorization" | "claim"}
        />
        <Submit
          disabled={items?.length === 0 || !policy || isCreating}
          onClick={handleSubmit}
          className="min-w-[200px]"
        >
          {isCreating && <CareIcon className="care-l-spinner animate-spin" />}
          {isCreating
            ? `Creating ${use === "claim" ? "Claim" : "Pre-Authorization"}...`
            : "Proceed"}
        </Submit>
      </div>
    </div>
  );
}
