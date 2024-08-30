import { AppConfigContext } from "../Common/hooks/useConfig";
import { careConfig } from "../../care.config";

interface Props {
  children: React.ReactNode;
}

export default function AppConfigProvider({ children }: Props) {
  return (
    <AppConfigContext.Provider value={careConfig}>
      {children}
    </AppConfigContext.Provider>
  );
}
