import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { setRouter } from "@/compat/routerRef";
import { parseSearch, stringifySearch } from "@/lib/router/searchParams";
import "@/lib/router/staticData";
import { routeTree } from "@/routeTree.gen";
import queryClient from "@/Utils/request/queryClient";

export interface RouterContext {
  queryClient: QueryClient;
}

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  parseSearch,
  stringifySearch,
  defaultNotFoundComponent: () => <ErrorPage />,
});

setRouter(router);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
