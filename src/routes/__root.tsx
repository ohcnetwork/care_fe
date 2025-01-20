import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import * as React from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import { PubSubProvider } from "@/Utils/pubsubContext";
import { handleHttpError } from "@/Utils/request/errorHandler";

export const Route = createRootRoute({
  component: RootComponent,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
  }),
});

function RootComponent() {
  return (
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
        <PubSubProvider>
          <PluginEngine>
            <Outlet />
          </PluginEngine>
        </PubSubProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
      <Sonner
        position="top-right"
        theme="light"
        richColors
        expand
        toastOptions={{ closeButton: true }}
      />
      <Toaster />
    </React.Fragment>
  );
}
