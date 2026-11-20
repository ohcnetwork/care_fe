import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import useAuthUser from "@/hooks/useAuthUser";

import {
  WorkspaceAuthContext,
  WorkspaceScope,
} from "@/types/workspace/workspace";
import workspaceApi from "@/types/workspace/workspaceApi";
import query from "@/Utils/request/query";

import { WorkspaceForm } from "./WorkspaceForm";

interface WorkspaceEditorProps {
  scope: WorkspaceScope;
  id?: string;
}

export function WorkspaceEditor({ scope, id }: WorkspaceEditorProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const allowedContexts: WorkspaceAuthContext[] =
    scope.authContext === "instance"
      ? ["instance"]
      : ["facility", "facility_organization", "user"];
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["workspace", "configuration", user.id, id],
    queryFn: query(workspaceApi.get, { pathParams: { id: id ?? "" } }),
    enabled: !!id,
    retry: false,
  });

  if (id && isLoading) {
    return <FormSkeleton rows={6} />;
  }

  if (id && !data) {
    return (
      <Page title={t("workspaces")} hideTitleOnPage>
        <div className="mx-auto max-w-5xl space-y-4 p-4">
          <Alert variant="destructive">
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>{t("workspace_load_error")}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={scope.basePath} basePath="/">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              {t("try_again")}
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <>
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("workspace_refresh_error")}</AlertDescription>
        </Alert>
      )}
      <WorkspaceForm
        key={`${user.id}:${scope.authContext}:${scope.facilityId ?? ""}:${id ?? "create"}`}
        scope={scope}
        existing={id ? data : undefined}
        allowedContexts={allowedContexts}
      />
    </>
  );
}
