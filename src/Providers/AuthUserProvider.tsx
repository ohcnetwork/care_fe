import { useEffect } from "react";
import { AuthUserContext } from "../Common/hooks/useAuthUser";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { LocalStorageKeys } from "../Common/constants";
import request from "../Utils/request/request";
import useConfig from "../Common/hooks/useConfig";
import { navigate } from "raviger";

interface Props {
  children: React.ReactNode;
  unauthorized: React.ReactNode;
}

export default function AuthUserProvider({ children, unauthorized }: Props) {
  const { jwt_token_refresh_interval } = useConfig();
  const tokenRefreshInterval = jwt_token_refresh_interval ?? 5 * 60 * 1000;

  const {
    res,
    data: user,
    loading,
    refetch,
  } = useQuery(routes.currentUser, { silent: true });

  useEffect(() => {
    if (!user) {
      return;
    }

    updateRefreshToken(true);
    setInterval(() => updateRefreshToken(), tokenRefreshInterval);
  }, [user, tokenRefreshInterval]);

  if (loading || !res) {
    return <Loading />;
  }

  const signIn = async (creds: { username: string; password: string }) => {
    const query = await request(routes.login, { body: creds });

    if (query.res?.ok && query.data) {
      localStorage.setItem(LocalStorageKeys.accessToken, query.data.access);
      localStorage.setItem(LocalStorageKeys.refreshToken, query.data.refresh);

      await refetch();
      navigate(getRedirectOr("/"));
    }

    return query;
  };

  const signOut = async () => {
    localStorage.removeItem(LocalStorageKeys.accessToken);
    localStorage.removeItem(LocalStorageKeys.refreshToken);

    const redirectURL = getRedirectURL();

    await refetch();

    navigate(redirectURL ? `/?redirect=${redirectURL}` : "/");
  };

  return (
    <AuthUserContext.Provider value={{ signIn, signOut, user }}>
      {!res.ok || !user ? unauthorized : children}
    </AuthUserContext.Provider>
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

const getRedirectURL = () => {
  return new URLSearchParams(window.location.search).get("redirect");
};

const getRedirectOr = (fallback: string) => {
  const url = getRedirectURL();

  if (url) {
    try {
      const redirect = new URL(url);
      if (window.location.origin === redirect.origin) {
        return redirect.pathname + redirect.search;
      }
      console.error("Redirect does not belong to same origin.");
    } catch {
      console.error(`Invalid redirect URL: ${url}`);
    }
  }

  return fallback;
};
