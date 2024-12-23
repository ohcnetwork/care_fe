import { navigate } from "raviger";
import { useCallback } from "react";

import { CarePatientTokenKey } from "@/common/constants";

const getRedirectURL = () => {
  return new URLSearchParams(window.location.search).get("redirect");
};

export const useSignOut = () => {
  const signOut = useCallback(async () => {
    localStorage.removeItem(CarePatientTokenKey);

    const redirectURL = getRedirectURL();
    navigate(redirectURL ? `/login?redirect=${redirectURL}` : "/login");
  }, []);

  return signOut;
};
