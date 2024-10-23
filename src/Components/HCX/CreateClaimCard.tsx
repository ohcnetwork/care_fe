import * as Notification from "../../Utils/Notifications";

import ButtonV2, { Submit } from "@/components/Common/components/ButtonV2";
import { HCXClaimModel, HCXItemModel, HCXPolicyModel } from "./models";
import { classNames, formatCurrency } from "../../Utils/utils";

import CareIcon from "../../CAREUI/icons/CareIcon";
import ClaimCreatedModal from "./ClaimCreatedModal";
import ClaimsItemsBuilder from "./ClaimsItemsBuilder";
import DialogModal from "@/components/Common/Dialog";
import HCXPolicyEligibilityCheck from "./PolicyEligibilityCheck";
import PatientInsuranceDetailsEditor from "./PatientInsuranceDetailsEditor";
import { ProcedureType } from "@/components/Common/prescription-builder/ProcedureBuilder";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [policy, setPolicy] = useState<HCXPolicyModel>();
  const [items, setItems] = useState<HCXItemModel[]>();
  const [itemsError, setItemsError] = useState<string>();
  const [createdClaim, setCreatedClaim] = useState<HCXClaimModel>();
  const [use_, setUse_] = useState(use);

  const { res: consultationRes, data: consultationData } = useQuery(
    routes.getConsultation,
    { pathParams: { id: consultationId }, prefetch: !!consultationId },
  );

  const autoFill = async (policy?: HCXPolicyModel) => {
    if (!policy) {
      setItems([]);
      return;
    }

    const { res, data: latestApprovedPreAuth } = await request(
      routes.hcx.claims.list,
      {
        query: {
          consultation: consultationId,
          policy: policy.id,
          ordering: "-modified_date",
          use: "preauthorization",
          outcome: "complete",
          limit: 1,
        },
      },
    );

    if (res?.ok && latestApprovedPreAuth?.results.length !== 0) {
      setItems(latestApprovedPreAuth?.results[0].items ?? []);
      return;
    }
    if (consultationRes?.ok && Array.isArray(consultationData?.procedure)) {
      setItems(
        consultationData.procedure.map((obj: ProcedureType) => {
          return {
            id: obj.procedure ?? "",
            name: obj.procedure ?? "",
            price: 0.0,
            category: "900000", // provider's packages
          };
        }),
      );
    } else {
      setItems([]);
    }
  };

  const validate = () => {
    if (!policy) {
      Notification.Error({ msg: t("select_policy") });
      return false;
    }
    if (policy?.outcome !== "Complete") {
      Notification.Error({ msg: t("select_eligible_policy") });
      return false;
    }
    if (!items || items.length === 0) {
      setItemsError(t("claim__item__add_at_least_one"));
      return false;
    }
    if (items?.some((p) => !p.id || !p.name || p.price === 0 || !p.category)) {
      setItemsError(t("claim__item__fill_all_details"));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsCreating(true);

    const { res, data } = await request(routes.hcx.claims.create, {
      body: {
        policy: policy?.id,
        items,
        consultation: consultationId,
        use: use_,
      },
      silent: true,
    });

    if (res?.ok && data) {
      setItems([]);
      setItemsError(undefined);
      setPolicy(undefined);
      setCreatedClaim(data);
    } else {
      Notification.Error({ msg: t(`claim__failed_to_create_${use_}`) });
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
        title={t("edit_policy")}
        show={showAddPolicy}
        onClose={() => setShowAddPolicy(false)}
        description={t("edit_policy_description")}
        className="w-full max-w-screen-md"
      >
        <PatientInsuranceDetailsEditor
          patient={patientId}
          onCancel={() => setShowAddPolicy(false)}
        />
      </DialogModal>

      {/* Check Insurance Policy Eligibility */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 pb-4 max-sm:flex-col max-sm:items-start">
          <h1 className="text-lg font-bold">{t("check_policy_eligibility")}</h1>
          <ButtonV2
            className="w-fit"
            onClick={() => setShowAddPolicy(true)}
            ghost
            border
          >
            <CareIcon icon="l-edit-alt" className="text-lg" />
            {t("edit_policy")}
          </ButtonV2>
        </div>
        <HCXPolicyEligibilityCheck
          patient={patientId}
          onEligiblePolicySelected={(policy) => {
            setPolicy(policy);
            autoFill(policy);
          }}
        />
      </div>

      {/* Procedures */}
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-left text-lg font-bold">{t("claim__items")}</h1>
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
            <CareIcon icon="l-plus" className="text-lg" />
            <span>{t("claim__add_item")}</span>
          </ButtonV2>
        </div>
        <span
          className={classNames(
            policy ? "opacity-0" : "opacity-100",
            "text-secondary-700 transition-opacity duration-300 ease-in-out",
          )}
        >
          {t("select_policy_to_add_items")}
        </span>
        <ClaimsItemsBuilder
          disabled={items === undefined || !policy}
          name="items"
          value={items}
          onChange={({ value }) => setItems(value)}
          error={itemsError}
        />
        <div className="text-right sm:pr-8">
          {t("total_amount")} :{" "}
          {items ? (
            <span className="font-bold tracking-wider">
              {formatCurrency(
                items.map((p) => p.price).reduce((a, b) => a + b, 0.0),
              )}
            </span>
          ) : (
            "--"
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between max-sm:flex-col">
        <SelectFormField
          name="use"
          label={t("claim__use")}
          labelClassName="max-sm:hidden"
          options={[
            {
              id: "preauthorization",
              label: t("claim__use__preauthorization"),
            },
            { id: "claim", label: t("claim__use__claim") },
          ]}
          value={use_}
          onChange={({ value }) => setUse_(value)}
          position="below"
          className="w-52 max-sm:w-full"
          optionLabel={(value) => value.label}
          optionValue={(value) => value.id as "preauthorization" | "claim"}
        />
        <Submit
          disabled={items?.length === 0 || !policy || isCreating}
          onClick={handleSubmit}
          className="w-52 max-sm:w-full"
        >
          {isCreating && <CareIcon icon="l-spinner" className="animate-spin" />}
          {isCreating
            ? t(`claim__creating_${use_}`)
            : t(`claim__create_${use_}`)}
        </Submit>
      </div>
    </div>
  );
}
