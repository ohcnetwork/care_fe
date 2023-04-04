import React, { useState, useEffect } from "react";
import loadable from "@loadable/component";
import SessionRouter from "./Router/SessionRouter";
import AppRouter from "./Router/AppRouter";
import { useDispatch, useSelector } from "react-redux";
import { getConfig, getCurrentUser } from "./Redux/actions";
import { useAbortableEffect, statusType } from "./Common/utils";
import axios from "axios";
import { HistoryAPIProvider } from "./CAREUI/misc/HistoryAPIProvider";
import * as Sentry from "@sentry/browser";
import { IConfig } from "./Common/hooks/useConfig";
import { LocalStorageKeys } from "./Common/constants";

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

      if (config.sentry_dsn && process.env.NODE_ENV === "production") {
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
    const access = localStorage.getItem(LocalStorageKeys.accessToken);
    if (!access && refresh) {
      localStorage.removeItem(LocalStorageKeys.refreshToken);
      document.location.reload();
      return;
    }
    if (!refresh) {
      return;
    }
    axios
      .post("/api/v1/auth/token/refresh/", {
        refresh,
      })
      .then((resp) => {
        localStorage.setItem(LocalStorageKeys.accessToken, resp.data.access);
        localStorage.setItem(LocalStorageKeys.refreshToken, resp.data.refresh);
      });
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
      favicon.href = "/favicon-dark.ico";
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

  const configData = config.data as IConfig;

  return (
    <HistoryAPIProvider>
      {currentUser?.data ? <AppRouter /> : <SessionRouter />}
      <script
        defer
        data-domain={configData.site_url}
        src={`${configData.analytics_server_url}/js/script.js`}
      ></script>
    </HistoryAPIProvider>
  );
};

export default App;
