import { useQuery } from "@tanstack/react-query";

import { userChildProps } from "@/components/Common/UserColumns";
import { TwoFactorAuth } from "@/components/Users/TwoFactorAuth";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export function TwoFactorAuthWrapper(props: userChildProps) {
  const authUser = useAuthUser();

  // Fetch current user to get the latest 2FA status
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: query(routes.currentUser),
    enabled: !!authUser,
    staleTime: 0,
    refetchOnMount: true,
  });

  // Use the fetched data if available, otherwise fall back to props
  const is2faEnabled =
    currentUser && "is_2fa_enabled" in currentUser
      ? !!currentUser.is_2fa_enabled
      : !!props.userData.is_2fa_enabled;

  return (
    <TwoFactorAuth
      isEnabled={is2faEnabled}
      onSuccess={() => {
        // Refetch user data to update 2FA status
        window.location.reload();
      }}
    />
  );
}
