import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "raviger";
import { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { Textarea } from "@/components/ui/textarea";

import BackButton from "@/components/Common/BackButton";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Loading from "@/components/Common/Loading";

import { AppIcon } from "@/pages/Apps/AppIcon";
import { AppStorePlugin } from "@/types/appStore/appStore";
import { PlugConfig } from "@/types/plugConfig";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import {
  buildPlugConfig,
  fetchAppStorePlugin,
  getHealthCheckUrl,
  resolveAppIconUrl,
} from "@/Utils/appStore";
import {
  getBuildTimePlugConfigs,
  mergePlugConfigs,
  ResolvedPlugConfig,
} from "@/Utils/plugConfig";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  slug: string;
}

export function PlugConfigEdit({ slug }: Props) {
  const isNew = slug === "new";
  const appId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("appId");

  const buildTimeConfig = useMemo(
    () => getBuildTimePlugConfigs().find((config) => config.slug === slug),
    [slug],
  );
  const isReadOnly = !isNew && !!buildTimeConfig;

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["plug-config", slug],
    queryFn: query(plugConfigApi.get, { pathParams: { slug } }),
    enabled: !isNew && !isReadOnly,
  });

  const { data: manifest, isLoading: isManifestLoading } = useQuery({
    queryKey: ["app-store-plugin", appId],
    queryFn: ({ signal }) => fetchAppStorePlugin(appId!, signal),
    enabled: Boolean(appId),
  });

  const { data: readOnlyConfigs, isLoading: isReadOnlyLoading } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
    enabled: isReadOnly,
  });

  const resolvedBuildTimeConfig = isReadOnly
    ? mergePlugConfigs(readOnlyConfigs?.configs ?? []).find(
        (config) => config.slug === slug,
      )
    : buildTimeConfig;

  if (isLoading || isManifestLoading || isReadOnlyLoading) {
    return <Loading />;
  }

  return (
    <PlugConfigForm
      key={`${slug}:${appId ?? ""}`}
      slug={slug}
      isNew={isNew}
      isReadOnly={isReadOnly}
      manifest={manifest}
      buildTimeConfig={resolvedBuildTimeConfig}
      existingConfig={existingConfig}
    />
  );
}

function PlugConfigForm({
  slug,
  isNew,
  isReadOnly,
  manifest,
  buildTimeConfig,
  existingConfig,
}: {
  slug: string;
  isNew: boolean;
  isReadOnly: boolean;
  manifest?: AppStorePlugin;
  buildTimeConfig?: ResolvedPlugConfig;
  existingConfig?: PlugConfig;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [configSlug, setConfigSlug] = useState(
    () => manifest?.id ?? buildTimeConfig?.slug ?? existingConfig?.slug ?? "",
  );
  const [configValues, setConfigValues] = useState<Record<string, string>>(
    () => ({
      ...manifest?.frontend.config,
      ...((buildTimeConfig?.meta.config as Record<string, string>) ?? {}),
      ...((existingConfig?.meta.config as Record<string, string>) ?? {}),
    }),
  );
  const [rawMeta, setRawMeta] = useState(() =>
    JSON.stringify(
      buildTimeConfig?.meta ?? existingConfig?.meta ?? {},
      null,
      2,
    ),
  );
  const [healthStatus, setHealthStatus] = useState<
    "idle" | "checking" | "success" | "failed"
  >("idle");

  const { mutate: upsertConfig, isPending: isSaving } = useMutation({
    mutationFn: isNew
      ? mutate(plugConfigApi.create)
      : mutate(plugConfigApi.update, { pathParams: { slug } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["list-configs"] });
      await queryClient.invalidateQueries({ queryKey: ["plug-config"] });
      await queryClient.invalidateQueries({ queryKey: ["enabled-plugins"] });
      toast.success(
        isNew
          ? t("app_installed_successfully")
          : t("config_updated_successfully"),
      );
      navigate("/admin/apps");
    },
  });

  const { mutate: deleteConfig } = useMutation({
    mutationFn: mutate(plugConfigApi.delete, { pathParams: { slug } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["list-configs"] });
      await queryClient.invalidateQueries({
        queryKey: ["plug-config", slug],
        refetchType: "none",
      });
      await queryClient.invalidateQueries({ queryKey: ["enabled-plugins"] });
      toast.success(t("config_deleted_successfully"));
      navigate("/admin/apps");
    },
  });

  const healthCheckUrl = manifest ? getHealthCheckUrl(manifest) : undefined;

  const handleHealthCheck = async () => {
    if (!healthCheckUrl) {
      return;
    }

    setHealthStatus("checking");
    try {
      const response = await fetch(healthCheckUrl);
      setHealthStatus(response.ok ? "success" : "failed");
    } catch {
      setHealthStatus("failed");
    }
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      return;
    }

    if (manifest) {
      if (
        Object.keys(manifest.frontend.config ?? {}).some(
          (key) => !configValues[key]?.trim(),
        )
      ) {
        toast.error(t("app_requires_manual_setup"));
        return;
      }
      const config = buildPlugConfig({ ...manifest, id: configSlug });
      upsertConfig({
        ...config,
        meta: {
          ...existingConfig?.meta,
          ...config.meta,
          config: configValues,
        },
      });
      return;
    }

    try {
      const meta = JSON.parse(rawMeta);
      upsertConfig({ slug: configSlug, meta });
    } catch {
      toast.error(
        t("invalid_meta_json", {
          defaultValue: "Meta JSON is invalid. Fix the JSON before saving.",
        }),
      );
    }
  };

  const canSave = !healthCheckUrl || healthStatus === "success";
  const iconUrl = manifest ? resolveAppIconUrl(manifest) : undefined;
  const configKeys = Object.keys(manifest?.frontend.config ?? {});

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton
            variant="ghost"
            size="sm"
            className="border"
            aria-label={t("back")}
          >
            <ArrowLeft className="size-4" />
          </BackButton>
          <h1 className="text-2xl font-bold">
            {isNew ? t("create_new_config") : t("edit_config")}
          </h1>
          {isReadOnly && (
            <>
              <Badge variant="secondary">{t("built_in")}</Badge>
              <Badge variant="outline">{t("read_only")}</Badge>
            </>
          )}
        </div>
        {!isNew && !isReadOnly && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <CareIcon icon="l-trash-alt" className="mr-2" />
            {t("delete_config")}
          </Button>
        )}
      </div>

      {manifest && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AppIcon src={iconUrl} />
              <div>
                <CardTitle>{manifest.name}</CardTitle>
                <CardDescription>{manifest.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
              <span>
                {t("publisher")}: {manifest.organisation.name}
              </span>
              {manifest.license && (
                <span>
                  {t("license")}: {manifest.license}
                </span>
              )}
            </div>
            {manifest.categories && manifest.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {manifest.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="text-xs uppercase"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {manifest?.readme && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t("app_readme")}</CardTitle>
            <CardDescription>{t("app_readme_description")}</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <Markdown content={manifest.readme} />
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("slug")}</label>
          <Input
            value={configSlug}
            onChange={(e) => setConfigSlug(e.target.value)}
            readOnly={isReadOnly || !!manifest}
            disabled={isReadOnly || !!manifest}
            required
          />
        </div>

        {manifest ? (
          configKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("configuration")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {configKeys.map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-sm font-medium">
                      {key}
                    </label>
                    <Input
                      value={configValues[key] ?? ""}
                      onChange={(e) =>
                        setConfigValues((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("meta_json")}
            </label>
            <Textarea
              value={rawMeta}
              onChange={(e) => setRawMeta(e.target.value)}
              readOnly={isReadOnly}
              rows={10}
            />
          </div>
        )}

        {healthCheckUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t("server_health_check")}
                {healthStatus === "success" && (
                  <Badge variant="primary">{t("healthy")}</Badge>
                )}
                {healthStatus === "failed" && (
                  <Badge variant="destructive">{t("unhealthy")}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {t("server_health_check_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={handleHealthCheck}
                disabled={healthStatus === "checking"}
              >
                {healthStatus === "checking"
                  ? t("checking")
                  : t("run_health_check")}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {!isReadOnly && (
            <Button type="submit" disabled={!canSave || isSaving}>
              {isNew ? t("save") : t("update")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/apps")}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>

      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t("are_you_sure")}
        description={
          <Trans
            i18nKey="delete_config_description"
            values={{ slug: configSlug }}
            components={{ strong: <strong /> }}
          />
        }
        confirmText={t("delete")}
        onConfirm={() => deleteConfig(undefined)}
        variant="destructive"
      />
    </div>
  );
}
