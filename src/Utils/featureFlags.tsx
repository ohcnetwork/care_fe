import { createContext, useContext, useState, useEffect } from "react";
import useQuery from "./request/useQuery";
import routes from "../Redux/api";

export interface FeatureFlags {
  hcx: {
    enabled: boolean;
  };

  abdm: {
    enabled: boolean;
  };

  scribe: {
    enabled: boolean;
  };
}

export interface FeatureFlagsResponse {
  user_flags: FeatureFlags;
  facility_flags: {
    facility: string;
    features: FeatureFlags;
  }[];
}

const defaultFlags: FeatureFlags = {
  hcx: {
    enabled: false,
  },

  abdm: {
    enabled: false,
  },

  scribe: {
    enabled: false,
  },
};

const FeatureFlagsContext = createContext<FeatureFlagsResponse>({
  user_flags: defaultFlags,
  facility_flags: [],
});

export const FeatureFlagsProvider = (props: { children: React.ReactNode }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsResponse>({
    user_flags: defaultFlags,
    facility_flags: [],
  });

  const query = useQuery(routes.getFeatureFlags, {
    silent: true,
  });

  useEffect(() => {
    if (query.data) {
      setFeatureFlags(query.data);
    }
  }, [query.data]);

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {props.children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (facilityId?: string) => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider",
    );
  }
  let facilityFlags;
  if (facilityId) {
    facilityFlags = context?.facility_flags.find(
      (f) => f.facility === facilityId,
    )?.features;
  }
  return {
    ...context.user_flags,
    ...facilityFlags,
  };
};
