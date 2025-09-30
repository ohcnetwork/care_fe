import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { PlugConfig } from "@/types/plugConfig";
import { useTranslation } from "react-i18next";

export function PlugConfigList() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["list-configs"],
    queryFn: query(routes.plugConfig.listPlugConfigs),
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("plug_configs")}</h1>
        <Button onClick={() => navigate("/apps/plug-configs/new")}>
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
          {data?.configs?.map((config: PlugConfig) => (
            <TableRow key={config.slug}>
              <TableCell>{config.slug}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/apps/plug-configs/${config.slug}`)}
                >
                  <CareIcon icon="l-pen" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
