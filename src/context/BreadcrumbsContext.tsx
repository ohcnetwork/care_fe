import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { ReactNode } from "react";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

export const BreadcrumbsContext = createContext<{
  facilityId: string;
  id: string;
  resourceDetails: any | null | undefined;
  isLoading: boolean;
}>({
  facilityId: "",
  id: "",
  resourceDetails: null,
  isLoading: false,
});

interface BreadcrumbsProviderProps {
  facilityId: string;
  id: string;
  children: ReactNode;
}

export const BreadcrumbsProvider = ({
  facilityId,
  id,
  children,
}: BreadcrumbsProviderProps) => {
  const { data: resourceDetails, isLoading } = useQuery({
    queryKey: ["resource_request", facilityId, id],
    queryFn: query(routes.getResourceDetails, {
      pathParams: { id },
    }),
  });
  return (
    <BreadcrumbsContext.Provider
      value={{ facilityId, id, resourceDetails, isLoading }}
    >
      {children}
    </BreadcrumbsContext.Provider>
  );
};

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbsContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within a BreadcrumbsProvider");
  }
  return context;
};
