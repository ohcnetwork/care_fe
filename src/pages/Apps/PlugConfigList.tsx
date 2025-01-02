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
import useQuery from "@/Utils/request/useQuery";
import { PlugConfig } from "@/types/plugConfig";

export function PlugConfigList() {
  const { data, loading } = useQuery(routes.plugConfig.listPlugConfigs);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plug Configs</h1>
        <Button onClick={() => navigate("/apps/plug-configs/new")}>
          <CareIcon icon="l-plus" className="mr-2" />
          Add New Config
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slug</TableHead>
            <TableHead>Actions</TableHead>
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
