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

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  slug: string;
}

export function PlugConfigEdit({ slug }: Props) {
  const navigate = useNavigate();
  const isNew = slug === "new";
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ["plug-config", slug],
    queryFn: query(routes.plugConfig.getPlugConfig, { pathParams: { slug } }),
    enabled: !isNew,
  });

  const [config, setConfig] = useState({
    slug: "",
    meta: `{}`,
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        slug: existingConfig.slug,
        meta: JSON.stringify(existingConfig.meta, null, 2),
      });
    }
  }, [existingConfig]);

  const { mutate: upsertConfig } = useMutation({
    mutationFn: isNew
      ? mutate(routes.plugConfig.createPlugConfig)
      : mutate(routes.plugConfig.updatePlugConfig, { pathParams: { slug } }),
    onSuccess: () => navigate("/apps"),
  });

  const { mutate: deleteConfig } = useMutation({
    mutationFn: mutate(routes.plugConfig.deletePlugConfig, {
      pathParams: { slug },
    }),
    onSuccess: () => navigate("/apps"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const meta = JSON.parse(config.meta);
    const configPayload = { ...config, meta };
    upsertConfig(configPayload);
  };

  const handleDelete = () => {
    deleteConfig();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? t("create_new_config") : t("edit_config")}
        </h1>
        {!isNew && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <CareIcon icon="l-trash-alt" className="mr-2" />
            {t("delete_config")}
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("slug")}</label>
          <Input
            value={config.slug}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, slug: e.target.value }))
            }
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
            rows={10}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{t("save")}</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/apps/plug-configs")}
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
