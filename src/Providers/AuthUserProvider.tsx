import { useEffect } from "react";
import { AuthUserContext } from "../Common/hooks/useAuthUser";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { LocalStorageKeys } from "../Common/constants";
import axios from "axios";

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

const updateRefreshToken = () => {
  const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);

  if (!refresh) {
    return;
  }

  axios
    .post("/api/v1/auth/token/refresh/", {
      refresh,
    })
    .then((res) => {
      localStorage.setItem(LocalStorageKeys.accessToken, res.data.access);
      localStorage.setItem(LocalStorageKeys.refreshToken, res.data.refresh);
    });
};
