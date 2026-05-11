import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronDown,
  CircleCheck,
  ExternalLink,
  FileText,
  FileX,
  Info,
  Layers,
  LayoutGrid,
  Link,
  Plug,
  Plus,
  Search,
  ShoppingBag,
  Star,
  TriangleAlert,
} from "lucide-react";
import { navigate } from "raviger";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import careConfig from "@careConfig";

import {
  CardGridSkeleton,
  FormSkeleton,
} from "@/components/Common/SkeletonLoading";
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
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import {
  AppStoreAppDefinition,
  AppStoreBrowseIndex,
  AppStoreBrowseLink,
  AppStoreRootIndex,
  AppStoreSummary,
} from "@/types/appStore/appStore";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import {
  fetchAppStoreJson,
  fetchAppStoreText,
  resolveAppStoreUrl,
  resolveAppSummaryUrls,
  resolveRepositoryReadmeUrl,
} from "@/Utils/appStore";
import { ResolvedPlugConfig, mergePlugConfigs } from "@/Utils/plugConfig";
import query from "@/Utils/request/query";

// Custom hooks
function useAppStoreIndex() {
  return useQuery({
    queryKey: ["app-store-index", careConfig.appStore.indexUrl],
    queryFn: ({ signal }) =>
      fetchAppStoreJson<AppStoreRootIndex>(
        careConfig.appStore.indexUrl!,
        signal,
      ),
    enabled: Boolean(careConfig.appStore.indexUrl),
  });
}

function useDeveloperIndexes(developers: AppStoreBrowseLink[] = []) {
  return useQueries({
    queries: developers.map((developer) => {
      const developerUrl = careConfig.appStore.indexUrl
        ? resolveAppStoreUrl(developer.url, careConfig.appStore.indexUrl)
        : developer.url;
      return {
        queryKey: [
          "app-store-developer-catalog",
          developer.slug,
          developer.url,
        ],
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const index = await fetchAppStoreJson<AppStoreBrowseIndex>(
            developerUrl,
            signal,
          );
          return {
            ...index,
            apps: index.apps.map((app) =>
              resolveAppSummaryUrls(app, developerUrl),
            ),
          };
        },
        enabled: Boolean(careConfig.appStore.indexUrl),
      };
    }),
  });
}

function useAllApps(
  developerIndexes: ReturnType<typeof useDeveloperIndexes>,
  featuredApps: AppStoreSummary[] = [],
) {
  return useMemo(() => {
    const apps = new Map<string, AppStoreSummary>();

    for (const queryResult of developerIndexes) {
      for (const app of queryResult.data?.apps ?? []) {
        apps.set(app.slug, app);
      }
    }

    for (const app of featuredApps) {
      apps.set(app.slug, app);
    }

    return Array.from(apps.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [developerIndexes, featuredApps]);
}

function useFilteredApps(apps: AppStoreSummary[], searchValue: string) {
  return useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return apps;
    }
    return apps.filter((app) => matchesSearch(app, normalizedSearchValue));
  }, [apps, searchValue]);
}

// Helper functions
function matchesSearch(app: AppStoreSummary, query: string) {
  return [
    app.name,
    app.slug,
    app.developer.name,
    ...app.categories.map((category) => category.name),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function buildInstalledAppDescription(config: ResolvedPlugConfig) {
  if (typeof config.meta.url === "string") {
    return `Installed plug loaded from ${config.meta.url}.`;
  }

  if (config.source === "build") {
    return "Built into this CARE deployment and available as a read-only plug configuration.";
  }

  return "Installed plug configuration without a matching App Store catalog entry.";
}

function AppIcon({
  src,
  alt,
  sizeClassName,
}: {
  src?: string;
  alt: string;
  sizeClassName: string;
}) {
  const [hasImageError, setHasImageError] = useState(!src);

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center overflow-hidden rounded-2xl border border-gray-300 bg-gray-50 text-primary",
        sizeClassName,
      )}
    >
      {!hasImageError && src ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-contain p-2"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <LayoutGrid className="size-8 text-muted-foreground" />
      )}
    </div>
  );
}

function AppCard({
  title,
  description,
  iconUrl,
  developerName,
  categories = [],
  metadataLabel,
  badge,
  actions,
}: {
  title: string;
  description: string;
  iconUrl?: string;
  developerName?: string | null;
  categories?: { slug: string; name: string }[];
  metadataLabel: string;
  badge?: ReactNode;
  actions: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-gray-300 bg-card shadow-md">
      <CardHeader className="flex-1 space-y-4 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md transition-all group-hover:bg-primary/30" />
            <AppIcon
              src={iconUrl}
              alt={`${title} icon`}
              sizeClassName="relative size-16 border-2 border-gray-300"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-2 text-lg font-bold leading-tight text-foreground">
                {title}
              </CardTitle>
              {badge}
            </div>
            {developerName && (
              <div className="text-xs font-semibold italic text-gray-500">
                {t("by_developer", { name: developerName })}
              </div>
            )}
            <CardDescription className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Layers className="size-4" />
            <span>{metadataLabel}</span>
          </div>
          {categories.slice(0, 2).map((category) => (
            <Badge
              key={category.slug}
              variant="outline"
              className="rounded-full text-xs"
            >
              {category.name}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant="outline" className="rounded-full text-xs">
              +{categories.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">{actions}</CardContent>
    </Card>
  );
}

function BrowseLinks({
  links,
  activeSlug,
  onOpen,
}: {
  links: AppStoreBrowseLink[];
  activeSlug?: string;
  onOpen: (link: AppStoreBrowseLink) => void;
}) {
  const { t } = useTranslation();
  if (links.length === 0) {
    return (
      <p className="px-2 py-4 text-center text-xs text-muted-foreground">
        {t("no_entries_published")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {links.map((link) => (
        <Button
          key={link.slug}
          variant={activeSlug === link.slug ? "default" : "ghost"}
          className="w-full justify-between gap-3 transition-all"
          onClick={() => onOpen(link)}
        >
          <span className="truncate text-left">{link.name}</span>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {link.appCount}
          </Badge>
        </Button>
      ))}
    </div>
  );
}

function AppStoreShell({
  title,
  subtitle,
  description,
  searchValue,
  onSearchChange,
  categories,
  developers,
  activeCategorySlug,
  activeDeveloperSlug,
  activeView,
  children,
}: {
  title?: string;
  subtitle?: string;
  description?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  categories: AppStoreBrowseLink[];
  developers: AppStoreBrowseLink[];
  activeCategorySlug?: string;
  activeDeveloperSlug?: string;
  activeView?: "all" | "featured" | "installed";
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("app_store_hero_title");
  const resolvedSubtitle = subtitle ?? t("app_store_subtitle");
  const resolvedDescription = description ?? t("app_store_hero_description");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-300 bg-linear-to-br from-background to-primary/5 px-8 py-7 shadow-sm">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-primary/5 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <LayoutGrid className="text-sm text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {resolvedSubtitle}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {resolvedTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {resolvedDescription}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 shadow-sm transition-all focus-within:border-primary focus-within:shadow-md">
              <Search className="shrink-0 size-5" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("app_store_search_placeholder")}
                className="h-auto border-0 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar Navigation */}
        <aside className="space-y-3 lg:space-y-6">
          {/* Mobile toggle */}
          <button
            className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-card px-4 py-3 text-sm font-semibold shadow-sm lg:hidden"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <span>{t("browse_and_filter")}</span>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                sidebarOpen && "rotate-180",
              )}
            />
          </button>

          {/* Sidebar content — always visible on lg, toggled on mobile */}
          <div
            className={cn(
              "space-y-3 lg:block lg:space-y-6",
              sidebarOpen ? "block" : "hidden",
            )}
          >
            <Card className="overflow-hidden border-gray-300 shadow-lg">
              <CardHeader className="border-b border-gray-300 bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("browse")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                <Button
                  variant={activeView === "all" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 transition-all"
                  onClick={() => navigate("/admin/apps/all")}
                >
                  <LayoutGrid />
                  <span>{t("all_published_apps")}</span>
                </Button>
                <Button
                  variant={activeView === "featured" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 transition-all"
                  onClick={() => navigate("/admin/apps/featured")}
                >
                  <Star />
                  <span>{t("featured_apps")}</span>
                </Button>
                <Button
                  variant={activeView === "installed" ? "default" : "ghost"}
                  className="w-full justify-start gap-3 transition-all"
                  onClick={() => navigate("/admin/apps")}
                >
                  <CircleCheck />
                  <span>{t("installed_apps")}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Categories Section */}
            {categories.length > 0 && (
              <Card className="overflow-hidden border-gray-300 shadow-lg">
                <CardHeader className="border-b border-gray-300 bg-muted/30 pb-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("categories")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <BrowseLinks
                    links={categories}
                    activeSlug={activeCategorySlug}
                    onOpen={(link) =>
                      navigate(`/admin/apps/categories/${link.slug}`)
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Developers Section */}
            {developers.length > 0 && (
              <Card className="overflow-hidden border-gray-300 shadow-lg">
                <CardHeader className="border-b border-gray-300 bg-muted/30 pb-4">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("developers")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <BrowseLinks
                    links={developers}
                    activeSlug={activeDeveloperSlug}
                    onOpen={(link) =>
                      navigate(`/admin/apps/developers/${link.slug}`)
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="overflow-hidden border-gray-300 shadow-lg">
              <CardHeader className="border-b border-gray-300 bg-muted/30 pb-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("actions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 transition-all"
                  onClick={() => navigate("/admin/apps/new")}
                >
                  <Plus />
                  <span>{t("manual_setup")}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

function AppStoreContent({
  heading,
  description,
  apps,
  baseUrl,
  isLoading,
  installedAppSlugs,
}: {
  heading: string;
  description: string;
  apps: AppStoreSummary[];
  baseUrl: string;
  isLoading?: boolean;
  installedAppSlugs?: Set<string>;
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <CardGridSkeleton count={6} />
        </div>
      ) : apps.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => {
            const iconUrl = app.iconUrl
              ? resolveAppStoreUrl(app.iconUrl, baseUrl)
              : undefined;
            return (
              <AppCard
                key={app.slug}
                title={app.name}
                description={app.description}
                iconUrl={iconUrl}
                developerName={app.developer.name}
                categories={app.categories}
                metadataLabel={
                  app.standardConfigurations.length > 0
                    ? t("preset_count", {
                        count: app.standardConfigurations.length,
                      })
                    : t("raw_setup_available")
                }
                badge={
                  installedAppSlugs?.has(app.slug) ? (
                    <Badge variant="primary" className="shrink-0 text-xs">
                      {t("installed_label")}
                    </Badge>
                  ) : undefined
                }
                actions={
                  <Button
                    className="w-full gap-2 shadow-sm"
                    onClick={() =>
                      navigate(
                        `/admin/apps/store/${app.slug}?appUrl=${encodeURIComponent(resolveAppStoreUrl(app.appUrl, baseUrl))}`,
                      )
                    }
                  >
                    <span>{t("view_details")}</span>
                  </Button>
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={t("no_apps_found")}
          description={t("no_apps_matched_view")}
          icon={<Search className="size-5 text-primary m-1" />}
        />
      )}
    </section>
  );
}

function InstalledAppsSection({
  storeApps,
  baseUrl,
  searchValue = "",
}: {
  storeApps: AppStoreSummary[];
  baseUrl?: string;
  searchValue?: string;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
  });
  const configs = mergePlugConfigs(data?.configs ?? []);
  const storeAppsBySlug = useMemo(
    () => new Map(storeApps.map((app) => [app.slug, app])),
    [storeApps],
  );

  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredConfigs = normalizedSearch
    ? configs.filter((config) => {
        const storeApp = storeAppsBySlug.get(config.slug);
        if (storeApp) {
          return matchesSearch(storeApp, normalizedSearch);
        }
        const name = config.meta.name ?? config.slug;
        return (
          String(name).toLowerCase().includes(normalizedSearch) ||
          config.slug.toLowerCase().includes(normalizedSearch)
        );
      })
    : configs;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
          {t("installed_apps")}
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          {t("installed_apps_description")}
        </p>
      </div>

      {isLoading && configs.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <CardGridSkeleton count={6} />
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredConfigs.map((config) => {
            const matchingStoreApp = storeAppsBySlug.get(config.slug);
            const iconUrl =
              matchingStoreApp?.iconUrl && baseUrl
                ? resolveAppStoreUrl(matchingStoreApp.iconUrl, baseUrl)
                : undefined;
            const title =
              matchingStoreApp?.name ||
              (typeof config.meta.name === "string"
                ? config.meta.name
                : config.slug);
            const description =
              matchingStoreApp?.description ||
              buildInstalledAppDescription(config);
            const developerName = matchingStoreApp?.developer.name ?? null;
            const categories = matchingStoreApp?.categories ?? [];
            const presetCount =
              matchingStoreApp?.standardConfigurations.length ?? 0;
            const ctaLabel = config.isReadOnly
              ? t("view_config")
              : t("edit_config");

            return (
              <AppCard
                key={config.slug}
                title={title}
                description={description}
                iconUrl={iconUrl}
                developerName={developerName}
                categories={categories}
                metadataLabel={
                  presetCount > 0
                    ? t("preset_count", { count: presetCount })
                    : config.source === "build"
                      ? t("built_in")
                      : t("configured")
                }
                badge={
                  <Badge variant="primary" className="shrink-0 text-xs">
                    {t("installed_label")}
                  </Badge>
                }
                actions={
                  <div className="flex gap-2">
                    {matchingStoreApp && baseUrl && (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() =>
                          navigate(
                            `/admin/apps/store/${matchingStoreApp.slug}?appUrl=${encodeURIComponent(resolveAppStoreUrl(matchingStoreApp.appUrl, baseUrl))}`,
                          )
                        }
                      >
                        <span>{t("view_details")}</span>
                      </Button>
                    )}
                    <Button
                      className="flex-1 gap-2 shadow-sm"
                      onClick={() =>
                        navigate(
                          matchingStoreApp && baseUrl
                            ? `/admin/apps/${config.slug}?appUrl=${encodeURIComponent(resolveAppStoreUrl(matchingStoreApp.appUrl, baseUrl))}`
                            : `/admin/apps/${config.slug}`,
                        )
                      }
                    >
                      <span>{ctaLabel}</span>
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            normalizedSearch ? t("no_results_found") : t("no_installed_apps")
          }
          description={
            normalizedSearch
              ? t("no_results_for_query", {
                  query: searchValue,
                })
              : t("no_installed_apps_description")
          }
          icon={
            normalizedSearch ? (
              <Search className="size-5 text-primary m-1" />
            ) : (
              <LayoutGrid className="size-5 text-primary m-1" />
            )
          }
          action={
            <Button onClick={() => navigate("/admin/apps/all")}>
              <ShoppingBag className="size-4" />
              <span>{t("browse_app_store")}</span>
            </Button>
          }
        />
      )}
    </section>
  );
}

export function PlugConfigList() {
  const { t } = useTranslation();
  const { data: appStoreIndex, isLoading: isAppStoreLoading } =
    useAppStoreIndex();
  const developerIndexes = useDeveloperIndexes(appStoreIndex?.developers);
  const [searchValue, setSearchValue] = useState("");

  const { data: installedConfigsData } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
  });

  const installedAppSlugs = useMemo(() => {
    const configs = mergePlugConfigs(installedConfigsData?.configs ?? []);
    return new Set(configs.map((config) => config.slug));
  }, [installedConfigsData]);

  const allApps = useAllApps(developerIndexes, appStoreIndex?.featuredApps);
  const filteredAllApps = useFilteredApps(allApps, searchValue);

  const appStoreUnavailable = !careConfig.appStore.indexUrl;
  const normalizedSearchValue = searchValue.trim().toLowerCase();

  return (
    <div className="min-h-screen">
      {appStoreUnavailable ? (
        <div className="mx-auto max-w-5xl space-y-6">
          <EmptyState
            title={t("app_store_not_configured")}
            description={t("app_store_not_configured_description")}
            icon={<Info />}
            action={
              <Button onClick={() => navigate("/admin/apps/new")}>
                <Plus />
                {t("manual_setup")}
              </Button>
            }
            className="mx-auto max-w-5xl"
          />
          <InstalledAppsSection storeApps={[]} />
        </div>
      ) : (
        <AppStoreShell
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          categories={appStoreIndex?.categories ?? []}
          developers={appStoreIndex?.developers ?? []}
          activeView="all"
        >
          <AppStoreContent
            heading={t("all_published_apps")}
            description={
              normalizedSearchValue
                ? t("search_results_description", { query: searchValue })
                : t("app_store_catalog_description")
            }
            apps={filteredAllApps}
            baseUrl={careConfig.appStore.indexUrl!}
            isLoading={isAppStoreLoading}
            installedAppSlugs={installedAppSlugs}
          />
        </AppStoreShell>
      )}
    </div>
  );
}

export function FeaturedAppsPage() {
  const { t } = useTranslation();
  const { data: appStoreIndex } = useAppStoreIndex();
  const developerIndexes = useDeveloperIndexes(appStoreIndex?.developers);
  const [searchValue, setSearchValue] = useState("");

  const { data: installedConfigsData } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
  });

  const installedAppSlugs = useMemo(() => {
    const configs = mergePlugConfigs(installedConfigsData?.configs ?? []);
    return new Set(configs.map((config) => config.slug));
  }, [installedConfigsData]);

  const filteredFeaturedApps = useFilteredApps(
    appStoreIndex?.featuredApps ?? [],
    searchValue,
  );

  if (!careConfig.appStore.indexUrl) {
    return <PlugConfigList />;
  }

  return (
    <div className="min-h-screen">
      <AppStoreShell
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        categories={appStoreIndex?.categories ?? []}
        developers={appStoreIndex?.developers ?? []}
        activeView="featured"
      >
        <AppStoreContent
          heading={t("featured_apps_for_workflow")}
          description={
            searchValue.trim()
              ? t("search_results_description", { query: searchValue })
              : t("app_store_catalog_description")
          }
          apps={filteredFeaturedApps}
          baseUrl={careConfig.appStore.indexUrl!}
          isLoading={developerIndexes.some(
            (queryResult) => queryResult.isLoading,
          )}
          installedAppSlugs={installedAppSlugs}
        />
      </AppStoreShell>
    </div>
  );
}

export function InstalledAppsPage() {
  const { data: appStoreIndex } = useAppStoreIndex();
  const developerIndexes = useDeveloperIndexes(appStoreIndex?.developers);
  const [searchValue, setSearchValue] = useState("");

  const allApps = useAllApps(developerIndexes, appStoreIndex?.featuredApps);

  if (!careConfig.appStore.indexUrl) {
    return <PlugConfigList />;
  }

  return (
    <div className="min-h-screen">
      <AppStoreShell
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        categories={appStoreIndex?.categories ?? []}
        developers={appStoreIndex?.developers ?? []}
        activeView="installed"
      >
        <InstalledAppsSection
          storeApps={allApps}
          baseUrl={careConfig.appStore.indexUrl!}
          searchValue={searchValue}
        />
      </AppStoreShell>
    </div>
  );
}

function AppStoreBrowsePage({
  slug,
  browseKey,
  routeLabel,
}: {
  slug: string;
  browseKey: "categories" | "developers";
  routeLabel: string;
}) {
  const { t } = useTranslation();
  const { data: appStoreIndex } = useAppStoreIndex();
  const [searchValue, setSearchValue] = useState("");

  const { data: installedConfigsData } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
  });

  const installedAppSlugs = useMemo(() => {
    const configs = mergePlugConfigs(installedConfigsData?.configs ?? []);
    return new Set(configs.map((config) => config.slug));
  }, [installedConfigsData]);

  const browseLink = appStoreIndex?.[browseKey].find(
    (item) => item.slug === slug,
  );
  const resolvedBrowseUrl =
    browseLink && careConfig.appStore.indexUrl
      ? resolveAppStoreUrl(browseLink.url, careConfig.appStore.indexUrl)
      : undefined;

  const { data: browseIndex, isLoading } = useQuery({
    queryKey: ["app-store-browse", browseKey, resolvedBrowseUrl],
    queryFn: async ({ signal }) => {
      const index = await fetchAppStoreJson<AppStoreBrowseIndex>(
        resolvedBrowseUrl!,
        signal,
      );
      return {
        ...index,
        apps: index.apps.map((app) =>
          resolveAppSummaryUrls(app, resolvedBrowseUrl!),
        ),
      };
    },
    enabled: Boolean(resolvedBrowseUrl),
  });

  const filteredApps = useFilteredApps(browseIndex?.apps ?? [], searchValue);

  if (!careConfig.appStore.indexUrl) {
    return <PlugConfigList />;
  }

  return (
    <div className="min-h-screen">
      <AppStoreShell
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        categories={appStoreIndex?.categories ?? []}
        developers={appStoreIndex?.developers ?? []}
        activeCategorySlug={browseKey === "categories" ? slug : undefined}
        activeDeveloperSlug={browseKey === "developers" ? slug : undefined}
      >
        <AppStoreContent
          heading={browseIndex?.title ?? routeLabel}
          description={
            searchValue.trim()
              ? t("search_results_description", { query: searchValue })
              : (browseIndex?.description ??
                t("app_store_collection_explore_description"))
          }
          apps={filteredApps}
          baseUrl={resolvedBrowseUrl ?? careConfig.appStore.indexUrl}
          isLoading={isLoading}
          installedAppSlugs={installedAppSlugs}
        />
      </AppStoreShell>
    </div>
  );
}

export function AppStoreCategoryPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  return (
    <AppStoreBrowsePage
      slug={slug}
      browseKey="categories"
      routeLabel={t("category")}
    />
  );
}

export function AppStoreDeveloperPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  return (
    <AppStoreBrowsePage
      slug={slug}
      browseKey="developers"
      routeLabel={t("developer")}
    />
  );
}

export function AppStoreDetailsPage({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const appUrl =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("appUrl");
  const { data: appDefinition, isLoading } = useQuery({
    queryKey: ["app-store-app-details", slug, appUrl],
    queryFn: ({ signal }) =>
      fetchAppStoreJson<AppStoreAppDefinition>(appUrl!, signal),
    enabled: Boolean(appUrl),
  });
  const readmeUrl = resolveRepositoryReadmeUrl(
    appDefinition?.source.repository,
  );
  const { data: readmeMarkdown, isLoading: isReadmeLoading } = useQuery({
    queryKey: ["app-store-readme", readmeUrl],
    queryFn: ({ signal }) => fetchAppStoreText(readmeUrl!, signal),
    enabled: Boolean(readmeUrl),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <CardGridSkeleton count={1} />
          </div>
        </div>
      </div>
    );
  }

  if (!appDefinition || !appUrl) {
    return (
      <EmptyState
        title={t("app_details_unavailable")}
        description={t("app_details_unavailable_description")}
        icon={<TriangleAlert />}
        action={
          <Button variant="outline" onClick={() => navigate("/admin/apps/all")}>
            {t("all_published_apps")}
          </Button>
        }
        className="mx-auto max-w-5xl"
      />
    );
  }

  const iconUrl = appDefinition.iconUrl
    ? resolveAppStoreUrl(appDefinition.iconUrl, appUrl)
    : undefined;
  const handleStartSetup = () => {
    navigate(`/admin/apps/new?appUrl=${encodeURIComponent(appUrl)}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Back button */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/apps")}>
          <ArrowLeft className="size-3" />
          <span>{t("back")}</span>
        </Button>
        <Button onClick={handleStartSetup}>
          <Plus className="size-4" />
          <span>{t("start_setup")}</span>
        </Button>
      </div>

      {/* Compact app info card */}
      <Card className="border-gray-300 shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <AppIcon
              src={iconUrl}
              alt={`${appDefinition.name} icon`}
              sizeClassName="size-14 border-2 border-gray-300"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  {appDefinition.name}
                </h1>
                {appDefinition.featured && (
                  <Badge>
                    <Star className="size-3" />
                    <span>{t("featured")}</span>
                  </Badge>
                )}
              </div>
              <div className="text-xs font-semibold italic text-gray-500">
                {t("by_developer", {
                  name: appDefinition.developer.name,
                })}
              </div>
              <p className="my-2 text-sm text-muted-foreground">
                {appDefinition.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {appDefinition.categories.map((category) => (
                  <Badge
                    key={category.slug}
                    variant="outline"
                    className="rounded-full text-xs"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata rows */}
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Plug className="size-4 shrink-0 text-muted-foreground" />
              <span className="mr-1 shrink-0 text-xs font-medium text-muted-foreground hidden sm:block">
                {t("plug")}
              </span>
              <code className="truncate text-xs font-mono">
                {appDefinition.baseConfig.plug}
              </code>
            </div>
            <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Link className="size-4 shrink-0 text-muted-foreground" />
              <span className="mr-1 shrink-0 text-xs font-medium text-muted-foreground hidden sm:block">
                {t("remote_entry")}
              </span>
              <code
                className="truncate text-xs font-mono"
                title={appDefinition.baseConfig.url}
              >
                {appDefinition.baseConfig.url}
              </code>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            <span className="mr-1 shrink-0 text-xs font-medium text-muted-foreground hidden sm:block">
              {t("repository")}
            </span>
            <a
              href={appDefinition.source.repository}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs font-mono text-primary underline-offset-4 hover:underline"
            >
              {appDefinition.source.repository}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* README card */}
      <Card className="overflow-hidden border-gray-300 shadow-md">
        <CardHeader className="border-b border-gray-300 bg-muted/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">{t("app_readme")}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            {t("app_readme_description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isReadmeLoading ? (
            <FormSkeleton rows={5} />
          ) : readmeMarkdown ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <Markdown content={readmeMarkdown} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileX className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("app_readme_unavailable")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
