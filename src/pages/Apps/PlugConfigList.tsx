import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CircleCheck, Plus, Search, ShoppingBag, Store } from "lucide-react";
import { Link, useNavigate, useQueryParams } from "raviger";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppIcon } from "@/pages/Apps/AppIcon";
import { AppStorePlugin } from "@/types/appStore/appStore";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import {
  buildPlugConfig,
  fetchAppStorePlugins,
  getHealthCheckUrl,
  resolveAppIconUrl,
} from "@/Utils/appStore";
import { ResolvedPlugConfig, mergePlugConfigs } from "@/Utils/plugConfig";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const PAGE_SIZE = 100;

// Tag filtering is done client-side (see `availableApps` below) so the full
// set of tag chips stays visible regardless of which tag is selected.
function useAppStorePlugins() {
  return useInfiniteQuery({
    queryKey: ["app-store-plugins", careConfig.appStore.apiUrl],
    queryFn: ({ pageParam, signal }) =>
      fetchAppStorePlugins({ offset: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
    enabled: Boolean(careConfig.appStore.apiUrl),
  });
}

function matches(value: string, search: string) {
  return value.toLowerCase().includes(search);
}

function AppCard({
  title,
  description,
  iconUrl,
  publisher,
  categories = [],
  badge,
  actions,
}: {
  title: string;
  description: string;
  iconUrl?: string;
  publisher?: string;
  categories?: string[];
  badge?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col border-gray-200 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <CardHeader className="flex-1 space-y-3 pb-4">
        <div className="flex items-start gap-3">
          <AppIcon src={iconUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-1 text-base">{title}</CardTitle>
              {badge}
            </div>
            {publisher && (
              <div className="text-xs italic text-gray-500">{publisher}</div>
            )}
            <CardDescription className="mt-1 line-clamp-2 text-sm">
              {description}
            </CardDescription>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs uppercase"
              >
                {category}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">{actions}</CardContent>
    </Card>
  );
}

// Marked `silent` so the global mutation error handler is skipped
class HealthCheckError extends Error {
  silent = true;
}

class ManualSetupRequiredError extends Error {
  silent = true;
}

function hasBlankConfigValues(plugin: AppStorePlugin) {
  return Object.values(plugin.frontend.config ?? {}).some(
    (value) => !value.trim(),
  );
}

function useQuickInstall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plugin: AppStorePlugin) => {
      if (hasBlankConfigValues(plugin)) {
        throw new ManualSetupRequiredError("Manual setup required");
      }

      const healthCheckUrl = getHealthCheckUrl(plugin);
      if (healthCheckUrl) {
        try {
          const response = await fetch(healthCheckUrl);
          if (!response.ok) {
            throw new HealthCheckError("Health check failed");
          }
        } catch {
          throw new HealthCheckError("Health check failed");
        }
      }

      await mutate(plugConfigApi.create)(buildPlugConfig(plugin));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["list-configs"] });
      await queryClient.invalidateQueries({ queryKey: ["enabled-plugins"] });
      toast.success(t("app_installed_successfully"));
    },
    onError: (error, plugin) => {
      if (error instanceof ManualSetupRequiredError) {
        toast.info(t("app_requires_manual_setup"));
      } else if (error instanceof HealthCheckError) {
        toast.error(t("health_check_unreachable_message"));
      }
      navigate(`/admin/apps/new?appId=${encodeURIComponent(plugin.id)}`);
    },
  });
}

export function PlugConfigList() {
  const { t } = useTranslation();
  function buildInstalledAppDescription(config: ResolvedPlugConfig) {
    if (config.source === "build") {
      return t("app_store_built_in_description");
    }
    return t("app_store_installed_description");
  }

  const [searchValue, setSearchValue] = useState("");
  const [activeTag, setActiveTag] = useState<string>();
  const [{ tab }, setQueryParams] = useQueryParams<{ tab?: string }>();
  const activeTab =
    tab === "available" && careConfig.appStore.apiUrl
      ? "available"
      : "installed";
  const {
    data: storePages,
    isLoading: isStoreLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useAppStorePlugins();
  const { mutate: install, isPending: isInstalling } = useQuickInstall();

  const { data: installedConfigsData, isLoading: isInstalledLoading } =
    useQuery({
      queryKey: ["list-configs"],
      queryFn: query(plugConfigApi.list),
    });

  const storeApps = useMemo(
    () => storePages?.pages.flatMap((page) => page.items) ?? [],
    [storePages],
  );
  const availableTags = useMemo(() => {
    const tags = new Map<string, string>();
    for (const app of storeApps) {
      for (const tag of app.tags) {
        tags.set(tag.slug, tag.name);
      }
    }
    return Array.from(tags, ([slug, name]) => ({ slug, name }));
  }, [storeApps]);

  const installedConfigs = useMemo(
    () => mergePlugConfigs(installedConfigsData?.configs ?? []),
    [installedConfigsData],
  );
  const installedSlugs = useMemo(
    () => new Set(installedConfigs.map((config) => config.slug)),
    [installedConfigs],
  );
  const storeAppsBySlug = useMemo(
    () => new Map(storeApps.map((app) => [app.id, app])),
    [storeApps],
  );

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredInstalled = normalizedSearch
    ? installedConfigs.filter((config) => {
        const name =
          typeof config.meta.name === "string" ? config.meta.name : config.slug;
        return (
          matches(name, normalizedSearch) ||
          matches(config.slug, normalizedSearch)
        );
      })
    : installedConfigs;

  const availableApps = activeTag
    ? storeApps.filter((app) => app.tags.some((tag) => tag.slug === activeTag))
    : storeApps;
  const filteredAvailable = normalizedSearch
    ? availableApps.filter(
        (app) =>
          matches(app.name, normalizedSearch) ||
          matches(app.publisher, normalizedSearch) ||
          (app.categories ?? []).some((category) =>
            matches(category, normalizedSearch),
          ),
      )
    : availableApps;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-primary/5 to-transparent px-6 py-7">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-primary/5 to-transparent" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {t("app_store_subtitle")}
                </h1>
                {!careConfig.appStore.apiUrl && (
                  <Badge variant="secondary">
                    {t("app_store_not_configured")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("app_store_hero_description")}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("app_store_search_placeholder")}
              className="bg-white pl-9"
            />
          </div>
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setQueryParams({ tab: value }, { replace: true })
        }
      >
        <div className="flex flex-col gap-2 sm:items-center sm:justify-between sm:flex-row">
          <TabsList>
            <TabsTrigger value="installed" className="gap-1.5">
              <CircleCheck className="size-4" />
              {t("installed_apps")}
            </TabsTrigger>
            {Boolean(careConfig.appStore.apiUrl) && (
              <TabsTrigger value="available" className="gap-1.5">
                <ShoppingBag className="size-4" />
                {t("available_apps")}
              </TabsTrigger>
            )}
          </TabsList>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/apps/new">
              <Plus className="mr-1 size-4" />
              {t("manual_setup")}
            </Link>
          </Button>
        </div>

        <TabsContent value="installed">
          {isInstalledLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <CardGridSkeleton count={3} />
            </div>
          ) : filteredInstalled.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredInstalled.map((config) => {
                const matchingApp = storeAppsBySlug.get(config.slug);
                const title =
                  matchingApp?.name ||
                  (typeof config.meta.name === "string"
                    ? config.meta.name
                    : config.slug);
                const description =
                  matchingApp?.description ||
                  buildInstalledAppDescription(config);
                const iconUrl = matchingApp && resolveAppIconUrl(matchingApp);

                return (
                  <AppCard
                    key={config.slug}
                    title={title}
                    description={description}
                    iconUrl={iconUrl}
                    publisher={
                      matchingApp?.organisation.name ?? matchingApp?.publisher
                    }
                    categories={matchingApp?.categories}
                    badge={
                      <Badge variant="primary" className="shrink-0 text-xs">
                        {t("installed_label")}
                      </Badge>
                    }
                    actions={
                      <Button className="w-full" asChild>
                        <Link
                          href={
                            matchingApp
                              ? `/admin/apps/${config.slug}?appId=${encodeURIComponent(matchingApp.id)}`
                              : `/admin/apps/${config.slug}`
                          }
                        >
                          {config.isReadOnly
                            ? t("view_config")
                            : t("edit_config")}
                        </Link>
                      </Button>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t("no_installed_apps")}
              description={t("no_installed_apps_description")}
              icon={<ShoppingBag className="size-5 text-primary m-1" />}
            />
          )}
        </TabsContent>

        {Boolean(careConfig.appStore.apiUrl) && (
          <TabsContent value="available" className="space-y-4">
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={activeTag ? "outline" : "primary"}
                  className="rounded-full"
                  onClick={() => setActiveTag(undefined)}
                >
                  {t("all")}
                </Button>
                {availableTags.map((tag) => (
                  <Button
                    key={tag.slug}
                    size="sm"
                    variant={activeTag === tag.slug ? "primary" : "outline"}
                    className="rounded-full"
                    onClick={() => setActiveTag(tag.slug)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            )}

            {isStoreLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <CardGridSkeleton count={3} />
              </div>
            ) : filteredAvailable.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAvailable.map((app) => {
                    const installedConfig = installedSlugs.has(app.id)
                      ? installedConfigs.find(
                          (config) => config.slug === app.id,
                        )
                      : undefined;

                    return (
                      <AppCard
                        key={app.id}
                        title={app.name}
                        description={app.description}
                        iconUrl={resolveAppIconUrl(app)}
                        publisher={app.organisation.name ?? app.publisher}
                        categories={app.categories}
                        badge={
                          installedConfig && (
                            <Badge
                              variant="primary"
                              className="shrink-0 text-xs"
                            >
                              {t("installed_label")}
                            </Badge>
                          )
                        }
                        actions={
                          installedConfig ? (
                            <Button className="w-full" asChild>
                              <Link
                                href={`/admin/apps/${app.id}?appId=${encodeURIComponent(app.id)}`}
                              >
                                {installedConfig.isReadOnly
                                  ? t("view_config")
                                  : t("edit_config")}
                              </Link>
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                asChild
                              >
                                <Link
                                  href={`/admin/apps/new?appId=${encodeURIComponent(app.id)}`}
                                >
                                  {t("configure")}
                                </Link>
                              </Button>
                              <Button
                                className="flex-1"
                                disabled={isInstalling}
                                onClick={() => install(app)}
                              >
                                {isInstalling ? t("installing") : t("install")}
                              </Button>
                            </div>
                          )
                        }
                      />
                    );
                  })}
                </div>
                {hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      disabled={isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                    >
                      {isFetchingNextPage ? t("loading") : t("load_more")}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title={t("no_apps_found")}
                description={t("no_apps_matched_view")}
                icon={<Search className="size-5 text-primary m-1" />}
              />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
