import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect } from "react";
import { toast } from "sonner";

import { useOrganization } from "@/hooks/useOrganization";

import { validatePincode } from "@/common/validation";

import { getPincodeDetails } from "@/Utils/utils";

interface UseStateAndDistrictProps {
  pincode: string;
}

interface PincodeResponse {
  statename: string;
  districtname: string;
}

export function useStateAndDistrictFromPincode({
  pincode,
}: UseStateAndDistrictProps) {
  const {
    data: pincodeDetails,
    isLoading: isPincodeLoading,
    isError: isPincodeError,
  } = useQuery<PincodeResponse>({
    queryKey: ["pincode-details", pincode],
    queryFn: () => getPincodeDetails(pincode, careConfig.govDataApiKey),
    enabled: pincode !== "" && validatePincode(pincode),
  });

  const stateName = pincodeDetails?.statename;
  const districtName = pincodeDetails?.districtname;

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

  useEffect(() => {
    if (isStateError || isPincodeError) {
      toast.info(t("pincode_state_auto_fill_error"));
    }
    if (isDistrictError && !isStateError) {
      toast.info(t("pincode_district_auto_fill_error"));
    }
  }, [isStateError, isPincodeError, isDistrictError]);

  const districtOrg = districtOrgs[0];

  return {
    stateOrg,
    districtOrg,
    isLoading: isPincodeLoading || isStateLoading || isDistrictLoading,
    isError: isPincodeError || isStateError || isDistrictError,
  };
}
