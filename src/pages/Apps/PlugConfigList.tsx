import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { mergePlugConfigs } from "@/Utils/plugConfig";
import query from "@/Utils/request/query";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import { useTranslation } from "react-i18next";

export function PlugConfigList() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(plugConfigApi.list),
  });

  const configs = mergePlugConfigs(data?.configs ?? []);

  if (isLoading && configs.length === 0) {
    return <TableSkeleton count={5} />;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("plug_configs")}</h1>
        <Button onClick={() => navigate("/admin/apps/new")}>
          <CareIcon icon="l-plus" className="mr-2" />
          {t("add_new_config")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("slug")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.slug}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{config.slug}</span>
                  {config.isReadOnly && (
                    <>
                      <Badge variant="secondary">{t("built_in")}</Badge>
                      <Badge variant="outline">{t("read_only")}</Badge>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {config.isReadOnly ? (
                  <Badge variant="outline">{t("read_only")}</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/admin/apps/${config.slug}`)}
                  >
                    <CareIcon icon="l-pen" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
