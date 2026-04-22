import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import Loading from "@/components/Common/Loading";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppStoreAppDefinition } from "@/types/appStore/appStore";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import {
  buildCatalogPlugConfig,
  buildHealthCheckRequest,
  fetchAppStoreJson,
  getCatalogSetupOptions,
  getGroupedEnvironmentFields,
} from "@/Utils/appStore";
import { getBuildTimePlugConfigs } from "@/Utils/plugConfig";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  slug: string;
}

export function PlugConfigEdit({ slug }: Props) {
  const navigate = useNavigate();
  const isNew = slug === "new";
  const appUrl =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("appUrl");
  const buildTimeConfig = getBuildTimePlugConfigs().find(
    (config) => config.slug === slug,
  );
  const isReadOnly = !isNew && !!buildTimeConfig;
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSetupId, setSelectedSetupId] = useState<string>();
  const [appBaseUrl, setAppBaseUrl] = useState("");
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >({});
  const [customEnvironmentRows, setCustomEnvironmentRows] = useState([
    { key: "", value: "" },
  ]);
  const [configError, setConfigError] = useState<string>();
  const [healthStatus, setHealthStatus] = useState<
    "idle" | "checking" | "success" | "failed"
  >("idle");
  const [healthMessage, setHealthMessage] = useState<string>();

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["plug-config", slug],
    queryFn: query(plugConfigApi.get, { pathParams: { slug } }),
    enabled: !isNew && !isReadOnly,
  });
  const {
    data: appDefinition,
    isLoading: isAppDefinitionLoading,
    error: appDefinitionError,
  } = useQuery({
    queryKey: ["app-store-app", appUrl],
    queryFn: ({ signal }) =>
      fetchAppStoreJson<AppStoreAppDefinition>(appUrl!, signal),
    enabled: isNew && Boolean(appUrl),
  });

  const [config, setConfig] = useState({
    slug: "",
    meta: `{}`,
  });

  useEffect(() => {
    if (buildTimeConfig) {
      setConfig({
        slug: buildTimeConfig.slug,
        meta: JSON.stringify(buildTimeConfig.meta, null, 2),
      });
      return;
    }

    if (existingConfig) {
      setConfig({
        slug: existingConfig.slug,
        meta: JSON.stringify(existingConfig.meta, null, 2),
      });
    }
  }, [buildTimeConfig, existingConfig]);

  useEffect(() => {
    if (!appDefinition || !isNew) {
      return;
    }

    const [firstOption] = getCatalogSetupOptions(appDefinition);
    if (!firstOption) {
      return;
    }

    setSelectedSetupId((current) => current ?? firstOption.id);
    setAppBaseUrl(
      (current) => current || firstOption.appBaseUrl?.defaultValue || "",
    );
    setEnvironmentValues((current) => {
      if (Object.keys(current).length > 0) {
        return current;
      }

      const nextEnvironmentFields = getGroupedEnvironmentFields(
        firstOption.environments,
      );

      return Object.fromEntries(
        [
          ...nextEnvironmentFields.mandatory,
          ...nextEnvironmentFields.defaults,
          ...nextEnvironmentFields.optional,
        ].map((field) => [field.key, field.defaultValue ?? ""]),
      );
    });
  }, [appDefinition, isNew]);

  useEffect(() => {
    if (!appDefinition || !selectedSetupId || !isNew) {
      return;
    }

    const customEnvironmentValues = Object.fromEntries(
      customEnvironmentRows
        .filter((row) => row.key.trim())
        .map((row) => [row.key.trim(), row.value]),
    );

    const nextConfig = buildCatalogPlugConfig(
      appDefinition,
      selectedSetupId,
      appBaseUrl,
      environmentValues,
      customEnvironmentValues,
    );

    setConfig({
      slug: nextConfig.slug,
      meta: JSON.stringify(nextConfig.meta, null, 2),
    });
    setHealthStatus("idle");
    setHealthMessage(undefined);
  }, [
    appDefinition,
    selectedSetupId,
    appBaseUrl,
    environmentValues,
    customEnvironmentRows,
    isNew,
  ]);

  const { mutate: upsertConfig } = useMutation({
    mutationFn: isNew
      ? mutate(plugConfigApi.create)
      : mutate(plugConfigApi.update, { pathParams: { slug } }),
    onSuccess: () => navigate("/admin/apps"),
  });

  const { mutate: deleteConfig } = useMutation({
    mutationFn: mutate(plugConfigApi.delete, {
      pathParams: { slug },
    }),
    onSuccess: () => navigate("/admin/apps"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      return;
    }

    let meta;

    try {
      meta = JSON.parse(config.meta);
      setConfigError(undefined);
    } catch {
      setConfigError(
        t("invalid_meta_json", {
          defaultValue: "Meta JSON is invalid. Fix the JSON before saving.",
        }),
      );
      return;
    }

    const configPayload = { ...config, meta };
    upsertConfig(configPayload);
  };

  const handleDelete = () => {
    deleteConfig(undefined);
  };

  const handleHealthCheck = async () => {
    if (!appDefinition) {
      return;
    }

    const customEnvironmentValues = Object.fromEntries(
      customEnvironmentRows
        .filter((row) => row.key.trim())
        .map((row) => [row.key.trim(), row.value]),
    );
    const request = buildHealthCheckRequest(
      appDefinition,
      appBaseUrl,
      environmentValues,
      customEnvironmentValues,
    );

    if (!request) {
      setHealthStatus("success");
      setHealthMessage(
        t("health_check_not_required", {
          defaultValue: "This plug does not require a health check.",
        }),
      );
      return;
    }

    setHealthStatus("checking");
    setHealthMessage(undefined);

    try {
      const response = await fetch(request.url, {
        method: request.method,
      });

      if (response.status !== request.successStatus) {
        setHealthStatus("failed");
        setHealthMessage(
          t("health_check_failed", {
            defaultValue:
              "Health check failed. Verify the API URL and server-side deployment before enabling the plug.",
          }),
        );
        return;
      }

      setHealthStatus("success");
      setHealthMessage(
        t("health_check_passed", {
          defaultValue: "Health check passed. The plug can now be enabled.",
        }),
      );
    } catch {
      setHealthStatus("failed");
      setHealthMessage(
        t("health_check_unreachable", {
          defaultValue:
            "Health check could not reach the configured API. Verify networking and CORS before enabling the plug.",
        }),
      );
    }
  };

  if (isLoading || isAppDefinitionLoading) {
    return <Loading />;
  }

  const catalogSetupOptions = appDefinition
    ? getCatalogSetupOptions(appDefinition)
    : [];
  const selectedSetup = catalogSetupOptions.find(
    (option) => option.id === selectedSetupId,
  );
  const groupedEnvironmentFields = selectedSetup
    ? getGroupedEnvironmentFields(selectedSetup.environments)
    : undefined;
  const requiresHealthCheck = Boolean(appDefinition?.healthCheck?.url);
  const canSave = !requiresHealthCheck || healthStatus === "success";

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
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

      {isNew && appDefinition && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{appDefinition.name}</CardTitle>
            <CardDescription>{appDefinition.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {catalogSetupOptions.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={
                    selectedSetupId === option.id ? "default" : "outline"
                  }
                  onClick={() => {
                    setSelectedSetupId(option.id);
                    setAppBaseUrl(option.appBaseUrl?.defaultValue ?? "");
                    const nextEnvironmentFields = getGroupedEnvironmentFields(
                      option.environments,
                    );
                    setEnvironmentValues(
                      Object.fromEntries(
                        [
                          ...nextEnvironmentFields.mandatory,
                          ...nextEnvironmentFields.defaults,
                          ...nextEnvironmentFields.optional,
                        ].map((field) => [field.key, field.defaultValue ?? ""]),
                      ),
                    );
                    setCustomEnvironmentRows([{ key: "", value: "" }]);
                  }}
                >
                  {option.title}
                </Button>
              ))}
            </div>

            {selectedSetup?.description && (
              <p className="text-sm text-gray-600">
                {selectedSetup.description}
              </p>
            )}

            {selectedSetup?.appBaseUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedSetup.appBaseUrl.label ??
                      t("app_base_url", {
                        defaultValue: "App base URL",
                      })}
                  </CardTitle>
                  <CardDescription>
                    {selectedSetup.appBaseUrl.description ??
                      t("app_base_url_description", {
                        defaultValue:
                          "Base URL where the frontend plug is served.",
                      })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={appBaseUrl}
                    onChange={(e) => setAppBaseUrl(e.target.value)}
                    placeholder={selectedSetup.appBaseUrl.placeholder}
                  />
                </CardContent>
              </Card>
            )}

            {groupedEnvironmentFields ? (
              <div className="space-y-6">
                <EnvironmentGroupSection
                  title={t("mandatory_environments", {
                    defaultValue: "Mandatory environments",
                  })}
                  description={t("mandatory_environments_description", {
                    defaultValue:
                      "These values must be configured before the plug can be enabled.",
                  })}
                  fields={groupedEnvironmentFields.mandatory}
                  values={environmentValues}
                  onChange={setEnvironmentValues}
                  required
                />
                <EnvironmentGroupSection
                  title={t("default_environments", {
                    defaultValue: "Default environments",
                  })}
                  description={t("default_environments_description", {
                    defaultValue:
                      "These values start from sensible defaults and can be adjusted for your deployment.",
                  })}
                  fields={groupedEnvironmentFields.defaults}
                  values={environmentValues}
                  onChange={setEnvironmentValues}
                />
                <EnvironmentGroupSection
                  title={t("optional_environments", {
                    defaultValue: "Optional environments",
                  })}
                  description={t("optional_environments_description", {
                    defaultValue:
                      "Fill these only when your deployment needs extra configuration.",
                  })}
                  fields={groupedEnvironmentFields.optional}
                  values={environmentValues}
                  onChange={setEnvironmentValues}
                />

                {groupedEnvironmentFields.custom?.enabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {groupedEnvironmentFields.custom.label ??
                          t("custom_environments", {
                            defaultValue: "Custom environments",
                          })}
                      </CardTitle>
                      <CardDescription>
                        {groupedEnvironmentFields.custom.description ??
                          t("custom_environments_description", {
                            defaultValue:
                              "Add additional environment key/value pairs for advanced setup.",
                          })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {customEnvironmentRows.map((row, index) => (
                        <div
                          key={index}
                          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                        >
                          <Input
                            value={row.key}
                            onChange={(e) =>
                              setCustomEnvironmentRows((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, key: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder={t("environment_key", {
                              defaultValue: "Environment key",
                            })}
                          />
                          <Input
                            value={row.value}
                            onChange={(e) =>
                              setCustomEnvironmentRows((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, value: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder={t("environment_value", {
                              defaultValue: "Environment value",
                            })}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setCustomEnvironmentRows((prev) =>
                                prev.length === 1
                                  ? [{ key: "", value: "" }]
                                  : prev.filter(
                                      (_, itemIndex) => itemIndex !== index,
                                    ),
                              )
                            }
                          >
                            <CareIcon icon="l-trash-alt" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setCustomEnvironmentRows((prev) => [
                            ...prev,
                            { key: "", value: "" },
                          ])
                        }
                      >
                        <CareIcon icon="l-plus" className="mr-2" />
                        {t("add_custom_environment", {
                          defaultValue: "Add custom environment",
                        })}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {t("raw_setup_hint", {
                  defaultValue:
                    "This setup does not require additional environment values. You can still fine-tune the generated plug_config JSON below.",
                })}
              </p>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("server_health_check", {
                    defaultValue: "Server-side API health check",
                  })}
                </CardTitle>
                <CardDescription>
                  {requiresHealthCheck
                    ? t("server_health_check_description", {
                        defaultValue:
                          "Verify the associated server-side APIs before enabling the plug.",
                      })
                    : t("server_health_check_not_configured", {
                        defaultValue:
                          "This plug definition does not declare a health-check endpoint.",
                      })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHealthCheck}
                  disabled={healthStatus === "checking"}
                >
                  {healthStatus === "checking"
                    ? t("checking", { defaultValue: "Checking" })
                    : t("run_health_check", {
                        defaultValue: "Run health check",
                      })}
                </Button>
                {healthStatus === "success" && (
                  <Badge variant="secondary">
                    {t("healthy", { defaultValue: "Healthy" })}
                  </Badge>
                )}
                {healthStatus === "failed" && (
                  <Badge variant="outline">
                    {t("unhealthy", { defaultValue: "Unhealthy" })}
                  </Badge>
                )}
                {healthMessage && (
                  <p className="text-sm text-gray-600">{healthMessage}</p>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {isNew && appDefinitionError && (
        <Card className="mb-4 border-red-200">
          <CardHeader>
            <CardTitle>
              {t("app_definition_unavailable", {
                defaultValue: "App definition could not be loaded",
              })}
            </CardTitle>
            <CardDescription>
              {t("app_definition_unavailable_description", {
                defaultValue:
                  "The App Store entry could not be fetched. Continue with raw setup or verify the published app definition URL.",
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("slug")}</label>
          <Input
            value={config.slug}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, slug: e.target.value }))
            }
            readOnly={isReadOnly}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("meta_json")}
          </label>
          <Textarea
            value={config.meta}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, meta: e.target.value }))
            }
            readOnly={isReadOnly}
            rows={10}
          />
          {configError && (
            <p className="mt-1 text-sm text-red-600">{configError}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <Button type="submit" disabled={!canSave}>
              {t("save")}
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
            values={{ slug: config.slug }}
            components={{ strong: <strong /> }}
          />
        }
        confirmText={t("delete")}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}

function EnvironmentGroupSection({
  title,
  description,
  fields,
  values,
  onChange,
  required = false,
}: {
  title: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
  }>;
  values: Record<string, string>;
  onChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  required?: boolean;
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-medium">
              {field.label}
            </label>
            <Input
              value={values[field.key] ?? ""}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
              required={required}
            />
            {field.description && (
              <p className="mt-1 text-xs text-gray-600">{field.description}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
