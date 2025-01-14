import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import { FacilityModel } from "@/components/Facility/models";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export type FeatureFlag = "SCRIBE_ENABLED"; // "HCX_ENABLED" | "ABDM_ENABLED" |

export interface FeatureFlagsResponse {
  user_flags: FeatureFlag[];
  facility_flags: {
    facility: string;
    features: FeatureFlag[];
  }[];
}

const defaultFlags: FeatureFlag[] = [];

const FeatureFlagsContext = createContext<FeatureFlagsResponse>({
  user_flags: defaultFlags,
  facility_flags: [],
});

export const FeatureFlagsProvider = (props: { children: React.ReactNode }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsResponse>({
    user_flags: defaultFlags,
    facility_flags: [],
  });

  const user = useAuthUser();

  useEffect(() => {
    if (user.user_flags) {
      setFeatureFlags((ff) => ({
        ...ff,
        user_flags: [...defaultFlags, ...(user.user_flags || [])],
      }));
    }
  }, [user]);

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {props.children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (facility?: FacilityModel | string) => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider",
    );
  }

  const facilityId = typeof facility === "string" ? facility : facility?.id;

  const { data: facilityObject } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId || "" },
    }),
    enabled: !!facilityId,
  });

  const facilityFlags = facilityObject?.facility_flags || [];

  return [...context.user_flags, ...facilityFlags];
};
