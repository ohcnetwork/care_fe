import { useAuthContext } from "@/hooks/useAuthUser";

export const usePatientSignOut = () => {
  return useAuthContext().signOut;
};
