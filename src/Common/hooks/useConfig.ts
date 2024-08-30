import { createContext, useContext } from "react";
import { CareConfig } from "../../../care.config";

export const AppConfigContext = createContext<CareConfig | null>(null);

const useConfig = () => {
  const config = useContext(AppConfigContext);

  if (!config) {
    throw new Error("useConfig must be used within an AppConfigProvider");
  }

  return config;
};

export default useConfig;
