import { useQueries, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import careConfig from "@careConfig";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        "shrink-0 flex items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 text-primary",
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
        <CareIcon icon="l-apps" className="text-2xl" />
      )}
    </div>
  );
}

function AppStoreAppCard({
  app,
  baseUrl,
  onViewDetails,
  ctaLabel,
}: {
  app: AppStoreSummary;
  baseUrl: string;
  onViewDetails: (appUrl: string, slug: string) => void;
  ctaLabel: string;
}) {
  const { t } = useTranslation();
  const iconUrl = app.iconUrl
    ? resolveAppStoreUrl(app.iconUrl, baseUrl)
    : undefined;

  return (
    <Card className="h-full border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AppIcon
              src={iconUrl}
              alt={`${app.name} icon`}
              sizeClassName="size-14"
            />
            <div>
              <CardTitle className="text-gray-900">{app.name}</CardTitle>
              <CardDescription className="line-clamp-3 text-gray-600">
                {app.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t("app")}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span>{app.developer.name}</span>
          {app.categories.map((category) => (
            <Badge
              key={category.slug}
              variant="outline"
              className="border-gray-200 text-gray-600"
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          {app.standardConfigurations.length > 0
            ? t("preset_count", { count: app.standardConfigurations.length })
            : t("raw_setup_available")}
        </div>
        <Button
          className="w-full"
          onClick={() =>
            onViewDetails(resolveAppStoreUrl(app.appUrl, baseUrl), app.slug)
          }
        >
          {ctaLabel}
        </Button>
      </CardContent>
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
    return <p className="text-sm text-gray-400">{t("no_entries_published")}</p>;
  }

  return (
    <div className="space-y-1.5">
      {links.map((link) => (
        <button
          type="button"
          key={link.slug}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
            activeSlug === link.slug
              ? "bg-primary/10 font-medium text-primary"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
          onClick={() => onOpen(link)}
        >
          <span>{link.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {link.appCount}
          </span>
        </button>
      ))}
    </div>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
        {title}
      </h2>
      {children}
    </section>
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
  children,
}: {
  title: string;
  subtitle: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  categories: AppStoreBrowseLink[];
  developers: AppStoreBrowseLink[];
  activeCategorySlug?: string;
  activeDeveloperSlug?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#eef6ff_100%)] p-8 shadow-sm">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="relative max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary/80">
            {subtitle}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-gray-600 md:text-base">
            {description}
          </p>
          <div className="max-w-xl rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <CareIcon icon="l-search" className="text-gray-400" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("app_store_search_placeholder")}
                className="border-0 bg-transparent px-0 text-gray-900 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <SidebarSection title={t("featured")}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary"
              onClick={() => navigate("/admin/apps")}
            >
              <CareIcon icon="l-star" className="text-primary" />
              <span>{t("featured_apps")}</span>
            </button>
          </SidebarSection>
          <SidebarSection title={t("categories")}>
            <BrowseLinks
              links={categories}
              activeSlug={activeCategorySlug}
              onOpen={(link) => navigate(`/admin/apps/categories/${link.slug}`)}
            />
          </SidebarSection>
          <SidebarSection title={t("developers")}>
            <BrowseLinks
              links={developers}
              activeSlug={activeDeveloperSlug}
              onOpen={(link) => navigate(`/admin/apps/developers/${link.slug}`)}
            />
          </SidebarSection>
          <SidebarSection title={t("manage")}>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/admin/apps/new")}
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("manual_setup")}
            </Button>
          </SidebarSection>
        </aside>

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
}: {
  heading: string;
  description: string;
  apps: AppStoreSummary[];
  baseUrl: string;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-950">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>

      {isLoading ? (
        <TableSkeleton count={3} />
      ) : apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <AppStoreAppCard
              key={app.slug}
              app={app}
              baseUrl={baseUrl}
              onViewDetails={(appUrl, appSlug) =>
                navigate(
                  `/admin/apps/store/${appSlug}?appUrl=${encodeURIComponent(appUrl)}`,
                )
              }
              ctaLabel={t("view_details", { defaultValue: "View details" })}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-gray-300 bg-white/70">
          <CardContent className="py-12 text-center text-sm text-gray-500">
            {t("no_apps_matched_view")}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function InstalledAppsSection({
  storeApps,
  baseUrl,
}: {
  storeApps: AppStoreSummary[];
  baseUrl?: string;
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

  if (isLoading && configs.length === 0) {
    return <TableSkeleton count={3} />;
  }

  return (
    <Card className="border-gray-200 bg-white/80 backdrop-blur">
      <CardHeader>
        <CardTitle>
          {t("installed_apps", { defaultValue: "Installed apps" })}
        </CardTitle>
        <CardDescription>
          {t("installed_apps_description", {
            defaultValue:
              "Installed apps continue to use the existing plug_config backend and runtime loader.",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {configs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {configs.map((config) => {
              const matchingStoreApp = storeAppsBySlug.get(config.slug);

              return (
                <InstalledAppCard
                  key={config.slug}
                  config={config}
                  storeApp={matchingStoreApp}
                  baseUrl={baseUrl}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-gray-500">
            {t("no_installed_apps", {
              defaultValue: "No installed apps found yet.",
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InstalledAppCard({
  config,
  storeApp,
  baseUrl,
}: {
  config: ResolvedPlugConfig;
  storeApp?: AppStoreSummary;
  baseUrl?: string;
}) {
  const { t } = useTranslation();
  const iconUrl =
    storeApp?.iconUrl && baseUrl
      ? resolveAppStoreUrl(storeApp.iconUrl, baseUrl)
      : undefined;
  const title =
    storeApp?.name ||
    (typeof config.meta.name === "string" ? config.meta.name : config.slug);
  const description =
    storeApp?.description || buildInstalledAppDescription(config);

  return (
    <Card className="h-full border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AppIcon
              src={iconUrl}
              alt={`${title} icon`}
              sizeClassName="size-14"
            />
            <div>
              <CardTitle className="text-gray-900">{title}</CardTitle>
              <CardDescription className="line-clamp-3 text-gray-600">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {t("installed_label", { defaultValue: "Installed" })}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <Badge variant="outline" className="border-gray-200 text-gray-600">
            {config.source === "build"
              ? t("built_in", { defaultValue: "Built-in" })
              : t("configured", { defaultValue: "Configured" })}
          </Badge>
          {storeApp ? (
            <>
              <span>{storeApp.developer.name}</span>
              {storeApp.categories.map((category) => (
                <Badge
                  key={category.slug}
                  variant="outline"
                  className="border-gray-200 text-gray-600"
                >
                  {category.name}
                </Badge>
              ))}
            </>
          ) : (
            <>
              <span>{config.slug}</span>
              {config.isReadOnly && (
                <Badge
                  variant="outline"
                  className="border-gray-200 text-gray-600"
                >
                  {t("read_only", { defaultValue: "Read only" })}
                </Badge>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          {storeApp
            ? t("available_in_store", {
                defaultValue: "Matched with App Store entry",
              })
            : formatInstalledMetaSummary(config)}
        </div>
        <div className="flex gap-2">
          {storeApp && baseUrl ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                navigate(
                  `/admin/apps/store/${storeApp.slug}?appUrl=${encodeURIComponent(resolveAppStoreUrl(storeApp.appUrl, baseUrl))}`,
                )
              }
            >
              {t("view_details", { defaultValue: "View details" })}
            </Button>
          ) : null}
          <Button
            className="flex-1"
            variant={storeApp ? "default" : "outline"}
            onClick={() => navigate(`/admin/apps/${config.slug}`)}
          >
            {config.isReadOnly
              ? t("view_config", { defaultValue: "View config" })
              : t("edit_config", { defaultValue: "Edit config" })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlugConfigList() {
  const { t } = useTranslation();
  const { data: appStoreIndex, isLoading: isAppStoreLoading } = useQuery({
    queryKey: ["app-store-index", careConfig.appStore.indexUrl],
    queryFn: ({ signal }) =>
      fetchAppStoreJson<AppStoreRootIndex>(
        careConfig.appStore.indexUrl!,
        signal,
      ),
    enabled: Boolean(careConfig.appStore.indexUrl),
  });
  const developerIndexes = useQueries({
    queries: (appStoreIndex?.developers ?? []).map((developer) => {
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
  const [searchValue, setSearchValue] = useState("");

  const appStoreUnavailable = !careConfig.appStore.indexUrl;
  const allApps = useMemo(() => {
    const apps = new Map<string, AppStoreSummary>();

    for (const queryResult of developerIndexes) {
      for (const app of queryResult.data?.apps ?? []) {
        apps.set(app.slug, app);
      }
    }

    for (const app of appStoreIndex?.featuredApps ?? []) {
      apps.set(app.slug, app);
    }

    return Array.from(apps.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [developerIndexes, appStoreIndex?.featuredApps]);

  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const filteredFeaturedApps = useMemo(() => {
    const featuredApps = appStoreIndex?.featuredApps ?? [];
    if (!normalizedSearchValue) {
      return featuredApps;
    }

    return featuredApps.filter((app) =>
      matchesSearch(app, normalizedSearchValue),
    );
  }, [appStoreIndex?.featuredApps, normalizedSearchValue]);
  const filteredAllApps = useMemo(() => {
    if (!normalizedSearchValue) {
      return allApps;
    }

    return allApps.filter((app) => matchesSearch(app, normalizedSearchValue));
  }, [allApps, normalizedSearchValue]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {appStoreUnavailable ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("app_store_not_configured")}</CardTitle>
            <CardDescription>
              {t("app_store_not_configured_description")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AppStoreShell
          title={t("app_store_hero_title")}
          subtitle={t("app_store_subtitle")}
          description={t("app_store_hero_description")}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          categories={appStoreIndex?.categories ?? []}
          developers={appStoreIndex?.developers ?? []}
        >
          <AppStoreContent
            heading={
              normalizedSearchValue
                ? t("search_results")
                : t("featured_apps_for_workflow")
            }
            description={
              normalizedSearchValue
                ? t("search_results_description", { query: searchValue })
                : t("app_store_catalog_description")
            }
            apps={
              normalizedSearchValue ? filteredAllApps : filteredFeaturedApps
            }
            baseUrl={careConfig.appStore.indexUrl!}
            isLoading={isAppStoreLoading}
          />

          {!normalizedSearchValue && (
            <AppStoreContent
              heading={t("all_published_apps")}
              description={t("all_published_apps_description")}
              apps={filteredAllApps}
              baseUrl={careConfig.appStore.indexUrl!}
              isLoading={developerIndexes.some(
                (queryResult) => queryResult.isLoading,
              )}
            />
          )}

          <InstalledAppsSection
            storeApps={allApps}
            baseUrl={careConfig.appStore.indexUrl!}
          />
        </AppStoreShell>
      )}
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
  const { data: appStoreIndex } = useQuery({
    queryKey: ["app-store-index", careConfig.appStore.indexUrl],
    queryFn: ({ signal }) =>
      fetchAppStoreJson<AppStoreRootIndex>(
        careConfig.appStore.indexUrl!,
        signal,
      ),
    enabled: Boolean(careConfig.appStore.indexUrl),
  });
  const [searchValue, setSearchValue] = useState("");

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

  const filteredApps = useMemo(() => {
    const apps = browseIndex?.apps ?? [];
    const normalizedSearchValue = searchValue.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return apps;
    }

    return apps.filter((app) => matchesSearch(app, normalizedSearchValue));
  }, [browseIndex?.apps, searchValue]);

  if (!careConfig.appStore.indexUrl) {
    return <PlugConfigList />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <AppStoreShell
        title={browseIndex?.title ?? routeLabel}
        subtitle={browseKey === "categories" ? t("category") : t("developer")}
        description={
          browseIndex?.description ?? t("app_store_collection_description")
        }
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        categories={appStoreIndex?.categories ?? []}
        developers={appStoreIndex?.developers ?? []}
        activeCategorySlug={browseKey === "categories" ? slug : undefined}
        activeDeveloperSlug={browseKey === "developers" ? slug : undefined}
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/apps")}>
            <CareIcon icon="l-arrow-left" className="mr-2" />
            {t("back_to_app_store")}
          </Button>
        </div>
        <AppStoreContent
          heading={browseIndex?.title ?? routeLabel}
          description={
            browseIndex?.description ??
            t("app_store_collection_explore_description")
          }
          apps={filteredApps}
          baseUrl={resolvedBrowseUrl ?? careConfig.appStore.indexUrl}
          isLoading={isLoading}
        />
        <InstalledAppsSection
          storeApps={appStoreIndex?.featuredApps ?? browseIndex?.apps ?? []}
          baseUrl={resolvedBrowseUrl ?? careConfig.appStore.indexUrl}
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
    return <TableSkeleton count={4} />;
  }

  if (!appDefinition || !appUrl) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("app_details_unavailable", {
                defaultValue: "App details are unavailable",
              })}
            </CardTitle>
            <CardDescription>
              {t("app_details_unavailable_description", {
                defaultValue:
                  "The selected app definition could not be loaded from the App Store index.",
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const iconUrl = appDefinition.iconUrl
    ? resolveAppStoreUrl(appDefinition.iconUrl, appUrl)
    : undefined;
  const handleStartSetup = () => {
    navigate(`/admin/apps/new?appUrl=${encodeURIComponent(appUrl)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/apps")}>
            <CareIcon icon="l-arrow-left" className="mr-2" />
            {t("back", { defaultValue: "Back" })}
          </Button>
          <Button onClick={handleStartSetup}>
            <CareIcon icon="l-plus" className="mr-2" />
            {t("start_setup", { defaultValue: "Start setup" })}
          </Button>
        </div>

        <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-start gap-4">
              <AppIcon
                src={iconUrl}
                alt={`${appDefinition.name} icon`}
                sizeClassName="size-20"
              />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-3xl text-gray-900">
                    {appDefinition.name}
                  </CardTitle>
                  {appDefinition.featured && (
                    <Badge variant="secondary">{t("featured")}</Badge>
                  )}
                </div>
                <CardDescription className="text-gray-600">
                  {appDefinition.description}
                </CardDescription>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span>{appDefinition.developer.name}</span>
                  {appDefinition.categories.map((category) => (
                    <Badge
                      key={category.slug}
                      variant="outline"
                      className="border-gray-200 text-gray-600"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">{t("plug")}:</span>{" "}
              {appDefinition.baseConfig.plug}
            </div>
            <div>
              <span className="font-medium text-gray-900">
                {t("remote_entry")}:
              </span>{" "}
              {appDefinition.baseConfig.url}
            </div>
            <div>
              <span className="font-medium text-gray-900">
                {t("repository")}:
              </span>{" "}
              <a
                href={appDefinition.source.repository}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {appDefinition.source.repository}
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>{t("app_readme", { defaultValue: "README" })}</CardTitle>
            <CardDescription>
              {t("app_readme_description", {
                defaultValue:
                  "Rendered from the app repository README.md when it is available.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isReadmeLoading ? (
              <TableSkeleton count={4} />
            ) : readmeMarkdown ? (
              <Markdown content={readmeMarkdown} />
            ) : (
              <p className="text-sm text-gray-600">
                {t("app_readme_unavailable", {
                  defaultValue:
                    "README.md could not be loaded from the repository URL.",
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function matchesSearch(app: AppStoreSummary, query: string) {
  return [
    app.name,
    app.description,
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

function formatInstalledMetaSummary(config: ResolvedPlugConfig) {
  if (typeof config.meta.url === "string") {
    return `Remote entry: ${config.meta.url}`;
  }

  if (typeof config.meta.name === "string") {
    return `Plug name: ${config.meta.name}`;
  }

  return `Slug: ${config.slug}`;
}
