import { createContext, useEffect, useState } from "react";

import useAuthUser from "@/hooks/useAuthUser";

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
