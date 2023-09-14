import { useEffect } from "react";
import { AuthUserContext } from "../Common/hooks/useAuthUser";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { LocalStorageKeys } from "../Common/constants";
import request from "../Utils/request/request";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
}

export default function AuthUserProvider({ children, unauthorized }: Props) {
  const { res, data, loading } = useQuery(routes.currentUser, {
    refetchOnWindowFocus: false,
    prefetch: true,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    updateRefreshToken();
    setInterval(updateRefreshToken, 5 * 60 * 1000); // TODO: move this interval to config.json
  }, [data]);

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

const updateRefreshToken = async () => {
  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  if (!refresh) {
    return;
  }

  const { res, data } = await request(routes.token_refresh, {
    body: { refresh },
  });

  if (res.status !== 200) {
    return;
  }

  localStorage.setItem(LocalStorageKeys.accessToken, data.access);
  localStorage.setItem(LocalStorageKeys.refreshToken, data.refresh);
};
