import { useEffect } from "react";
import { AuthUserContext } from "../Common/hooks/useAuthUser";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { LocalStorageKeys } from "../Common/constants";
import request from "../Utils/request/request";
import useConfig from "../Common/hooks/useConfig";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
}

export default function AuthUserProvider({ children, unauthorized }: Props) {
  const { jwt_token_refresh_interval } = useConfig();
  const { res, data, loading } = useQuery(routes.currentUser, {
    refetchOnWindowFocus: false,
    prefetch: true,
    silent: true,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    updateRefreshToken(true);
    setInterval(
      () => updateRefreshToken(),
      jwt_token_refresh_interval ?? 5 * 60 * 1000
    );
  }, [data, jwt_token_refresh_interval]);

  if (loading || !res) {
    return <Loading />;
  }

  if (res.status !== 200 || !data) {
    return unauthorized;
  }

  return (
    <AuthUserContext.Provider value={data}>{children}</AuthUserContext.Provider>
  );
}

const updateRefreshToken = async (silent = false) => {
  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  if (!refresh) {
    return;
  }

  const { res, data } = await request(routes.token_refresh, {
    body: { refresh },
    silent,
  });

  if (res?.status !== 200 || !data) {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);
    return;
  }

  localStorage.setItem(LocalStorageKeys.accessToken, data.access);
  localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
};
