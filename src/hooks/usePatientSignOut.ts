import { navigate } from "raviger";
import { useCallback } from "react";

import { LocalStorageKeys } from "@/common/constants";

const getRedirectURL = () => {
  return new URLSearchParams(window.location.search).get("redirect");
};

export const usePatientSignOut = () => {
  const signOut = useCallback(async () => {
    localStorage.removeItem(LocalStorageKeys.patientTokenKey);
    localStorage.removeItem("selectedPatient");

    const redirectURL = getRedirectURL();
    navigate(redirectURL ? `/login?redirect=${redirectURL}` : "/login");
  }, []);

  return signOut;
};
