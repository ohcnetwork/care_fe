import * as Sentry from "@sentry/browser";

import React, { useEffect, useState } from "react";
import { getConfig, getCurrentUser } from "./Redux/actions";
import { statusType, useAbortableEffect } from "./Common/utils";
import { useDispatch, useSelector } from "react-redux";

import AppRouter from "./Router/AppRouter";
import { HistoryAPIProvider } from "./CAREUI/misc/HistoryAPIProvider";
import { IConfig } from "./Common/hooks/useConfig";
import { LocalStorageKeys } from "./Common/constants";
import Plausible from "./Components/Common/Plausible";
import SessionRouter from "./Router/SessionRouter";
import loadable from "@loadable/component";

const Loading = loadable(() => import("./Components/Common/Loading"));

const App: React.FC = () => {
  const dispatch: any = useDispatch();
  const state: any = useSelector((state) => state);
  const { currentUser, config } = state;
  const [user, setUser] = useState(null);

  useAbortableEffect(async () => {
    const res = await dispatch(getConfig());
    if (res.data && res.status < 400) {
      const config = res.data as IConfig;

      if (config?.sentry_dsn && import.meta.env.PROD) {
        Sentry.init({
          environment: config.sentry_environment,
          dsn: config.sentry_dsn,
        });
      }

      localStorage.setItem("config", JSON.stringify(config));
    }
  }, [dispatch]);

  const updateRefreshToken = () => {
    const refresh = localStorage.getItem(LocalStorageKeys.refreshToken);
    if (refresh) {
      fetch("/api/v1/auth/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh }),
      })
        .then((res) => res.json())
        .then((resp) => {
          localStorage.setItem(LocalStorageKeys.accessToken, resp.access);
          localStorage.setItem(LocalStorageKeys.refreshToken, resp.refresh);
        });
    }
  };
  useEffect(() => {
    updateRefreshToken();
    setInterval(updateRefreshToken, 5 * 60 * 1000);
  }, [user]);

  useAbortableEffect(
    async (status: statusType) => {
      const res = await dispatch(getCurrentUser());
      if (!status.aborted && res && res.statusCode === 200) {
        setUser(res.data);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    const favicon: any = document.querySelector("link[rel~='icon']");
    if (darkThemeMq.matches) {
      favicon.href = "/favicon-light.ico";
    } else {
      favicon.href = "/favicon.ico";
    }
  }, []);

  if (
    !currentUser ||
    currentUser.isFetching ||
    !config ||
    config.isFetching ||
    !config.data
  ) {
    return <Loading />;
  }

  return (
    <HistoryAPIProvider>
      {currentUser?.data ? <AppRouter /> : <SessionRouter />}
      <Plausible />
    </HistoryAPIProvider>
  );
};

export default App;
