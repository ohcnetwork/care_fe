import PluginEngine from "../PluginEngine";
import { AppConfigContext, PluginConfigType } from "../Common/hooks/useConfig";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";
import { useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function AppConfigProvider({ children }: Props) {
  const [plugins, setPlugins] = useState<PluginConfigType[]>([
    "care-scribe-alpha-plug",
  ]);
  const { data, loading } = useQuery(routes.config, {
    refetchOnWindowFocus: false,
    prefetch: true,
  });

  if (loading || data === undefined) {
    return <Loading />;
  }

  const appConfigContext = {
    ...data,
    plugins,
  };

  return (
    <AppConfigContext.Provider value={appConfigContext}>
      <PluginEngine plugins={plugins} setPlugins={setPlugins}>
        {children}
      </PluginEngine>
    </AppConfigContext.Provider>
  );
}
