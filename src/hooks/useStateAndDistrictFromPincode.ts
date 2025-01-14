import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { validatePincode } from "@/common/validation";

import { getPincodeDetails } from "@/Utils/utils";

import { useOrganization } from "./useOrganization";

interface UseStateAndDistrictProps {
  pincode: string;
}

export function useStateAndDistrictFromPincode({
  pincode,
}: UseStateAndDistrictProps) {
  const {
    data: pincodeDetails,
    isLoading: isPincodeLoading,
    isError: isPincodeError,
  } = useQuery({
    queryKey: ["pincode-details", pincode],
    queryFn: () => getPincodeDetails(pincode, careConfig.govDataApiKey),
    enabled: pincode !== "" && validatePincode(pincode),
  });

  const { t } = useTranslation();

  const stateName = pincodeDetails?.statename || "";
  const districtName = pincodeDetails?.districtname || "";

  const {
    organizations: stateOrgs,
    isLoading: isStateLoading,
    isError: isStateError,
  } = useOrganization({
    orgType: "govt",
    parentId: "",
    name: stateName,
    enabled: !!stateName,
  });

  const stateOrg = stateOrgs?.[0];

  const {
    organizations: districtOrgs,
    isLoading: isDistrictLoading,
    isError: isDistrictError,
  } = useOrganization({
    orgType: "govt",
    parentId: stateOrg?.id,
    name: districtName,
    enabled: !!stateOrg?.id && !!districtName,
  });

  isStateError && toast.info(t("pincode_state_auto_fill_error"));

  isDistrictError &&
    !isStateError &&
    toast.info(t("pincode_district_auto_fill_error"));

  const districtOrg = districtOrgs[0];

  return {
    stateOrg,
    districtOrg,
    isLoading: isPincodeLoading || isStateLoading || isDistrictLoading,
    isError: isPincodeError || isStateError || isDistrictError,
  };
}
