import { AppConfigContext } from "../Common/hooks/useConfig";
import Loading from "../Components/Common/Loading";
import routes from "../Redux/api";
import useQuery from "../Utils/request/useQuery";

interface Props {
  children: React.ReactNode;
}

export default function AppConfigProvider({ children }: Props) {
  const { data, loading } = useQuery(routes.config, {
    refetchOnWindowFocus: false,
    prefetch: true,
  });

  if (loading || data === undefined) {
    return <Loading />;
  }

  return (
    <AppConfigContext.Provider value={data}>
      {children}
    </AppConfigContext.Provider>
  );
}
