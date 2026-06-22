import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  EyeIcon,
  FilePenLineIcon,
  HistoryIcon,
  ImageOffIcon,
  ImagePlusIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import Loading from "@/components/Common/Loading";
import Pagination from "@/components/Common/Pagination";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import { usePluginDrawingApplications } from "@/components/Files/Drawings/usePluginDrawingApplications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EncounterRead,
  inactiveEncounterStatus,
} from "@/types/emr/encounter/encounter";
import { PatientRead } from "@/types/emr/patient/patient";
import {
  MetaArtifactAssociatingType,
  MetaArtifactObjectType,
  MetaArtifactRead,
} from "@/types/metaArtifact/metaArtifact";
import metaArtifactApi from "@/types/metaArtifact/metaArtifactApi";
import { useState } from "react";
import { DrawingIcon } from "./DrawingIcon";
import { DrawingPreview } from "./DrawingPreview";

export interface DrawingsTabProps {
  type: MetaArtifactAssociatingType;
  patient?: PatientRead;
  encounter?: EncounterRead;
  patientId?: string;
  readOnly?: boolean;
}

interface NewDrawingButtonProps {
  associatingType: MetaArtifactAssociatingType;
  associatingId: string;
}

const NewDrawingButton = (props: NewDrawingButtonProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const applications = usePluginDrawingApplications();

  const [showCreateModal, setShowCreateModal] = useState<string>();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const { mutate: createDrawing, isPending: isCreating } = useMutation({
    mutationFn: mutate(metaArtifactApi.create),
    onSuccess: (data: MetaArtifactRead) => {
      queryClient.invalidateQueries({
        queryKey: [
          "drawings",
          { type: props.associatingType, associatingId: props.associatingId },
        ],
      });
      setShowCreateModal(undefined);
      setName("");
      setNote("");
      navigate(`./drawings/${data.id}`);
    },
  });

  if (applications.length === 0) {
    return null;
  }

  const handleNewDrawingClick = (application: string) => {
    setShowCreateModal(application);
  };

  const handleCreateDrawing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateModal || !name.trim()) {
      return;
    }
    createDrawing({
      name: name.trim(),
      note: note.trim() || undefined,
      object_type: MetaArtifactObjectType.DRAWING,
      object_value: { application: showCreateModal },
      associating_type: props.associatingType,
      associating_id: props.associatingId,
    });
  };

  return (
    <>
      {applications.length === 1 && (
        <Button
          variant="outline_primary"
          onClick={() => handleNewDrawingClick(applications[0].application)}
        >
          <PlusIcon />
          {t("new_drawing")}
        </Button>
      )}

      {applications.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="w-full sm:w-auto">
            <Button variant="outline_primary">
              {t("new_drawing")}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-(--radix-dropdown-menu-trigger-width) md:w-auto"
          >
            {applications.map(({ icon, application }) => {
              const Icon = icon || ImagePlusIcon;
              return (
                <DropdownMenuItem
                  key={application}
                  className="capitalize"
                  onClick={() => handleNewDrawingClick(application)}
                >
                  <Icon className="size-4 mr-1" />
                  <span>{application}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog
        open={!!showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(undefined);
            setName("");
            setNote("");
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleCreateDrawing}>
            <DialogHeader>
              <DialogTitle>{t("new_drawing")}</DialogTitle>
            </DialogHeader>
            <div className="my-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drawing-name">{t("name")}</Label>
                <Input
                  id="drawing-name"
                  autoFocus
                  autoComplete="off"
                  placeholder={t("enter_drawing_name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawing-note">{t("note")}</Label>
                <Textarea
                  id="drawing-note"
                  placeholder={t("enter_note_optional")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(undefined);
                  setName("");
                  setNote("");
                }}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!name.trim() || isCreating}>
                {t("create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const RESULTS_PER_PAGE = 15;

const hasReadPermission = ({ type, patient, encounter }: DrawingsTabProps) => {
  const permissions = new Set([
    ...(patient?.permissions ?? []),
    ...(encounter?.permissions ?? []),
  ]);

  if (permissions.has("can_view_clinical_data")) {
    return true;
  }

  if (type === MetaArtifactAssociatingType.ENCOUNTER) {
    return permissions.has("can_read_encounter_clinical_data");
  }

  return false;
};

const hasWritePermission = ({
  type,
  patient,
  encounter,
  readOnly,
}: DrawingsTabProps) => {
  if (readOnly) {
    return false;
  }

  const permissions = new Set([
    ...(patient?.permissions ?? []),
    ...(encounter?.permissions ?? []),
  ]);

  if (type === MetaArtifactAssociatingType.PATIENT) {
    return permissions.has("can_write_patient");
  }

  if (type === MetaArtifactAssociatingType.ENCOUNTER) {
    if (encounter && inactiveEncounterStatus.includes(encounter.status)) {
      return false;
    }
    return permissions.has("can_write_encounter_clinical_data");
  }

  return false;
};

export const DrawingsSubTab = (props: DrawingsTabProps) => {
  const { t } = useTranslation();
  const associatingId =
    {
      [MetaArtifactAssociatingType.PATIENT]: props.patient?.id,
      [MetaArtifactAssociatingType.ENCOUNTER]: props.encounter?.id,
    }[props.type] ?? "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const canRead = hasReadPermission(props);
  const canEdit = hasWritePermission(props);

  const { data, isLoading } = useQuery({
    queryKey: ["drawings", { type: props.type, associatingId, search, page }],
    queryFn: query.debounced(metaArtifactApi.list, {
      queryParams: {
        object_type: MetaArtifactObjectType.DRAWING,
        associating_type: props.type,
        associating_id: associatingId,
        name: search || undefined,
        limit: RESULTS_PER_PAGE,
        offset: (page - 1) * RESULTS_PER_PAGE,
      },
    }),
    enabled: canRead,
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-96 min-w-72 flex-1 ml-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={t("search")}
            value={search || ""}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-8"
          />
        </div>
        {canEdit && (
          <NewDrawingButton
            associatingType={props.type}
            associatingId={associatingId}
          />
        )}
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {data?.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <ImageOffIcon className="mb-2 text-4xl" />
              <p className="text-lg font-medium">{t("no_drawings_so_far")}</p>
              {canEdit && (
                <p className="text-sm">{t("create_new_drawing_message")}</p>
              )}
            </div>
          ) : (
            <div className="ml-1 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data?.results.map((drawing) => (
                <Card
                  key={drawing.id}
                  className="group flex cursor-pointer flex-col gap-0 overflow-hidden rounded-xl border-gray-200 p-0 shadow-xs transition-all duration-200 hover:shadow-md"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`./drawings/${drawing.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(`./drawings/${drawing.id}`);
                    }
                  }}
                >
                  <div className="relative border-b">
                    <div className="h-60 w-full bg-white md:h-40">
                      <ErrorBoundary
                        fallback={
                          <div className="flex flex-col gap-2 h-full items-center justify-center text-red-700">
                            <TriangleAlertIcon />
                            {t("unsupported_drawing_application", {
                              application: drawing.object_value.application,
                            })}
                          </div>
                        }
                      >
                        <DrawingPreview obj={drawing} />
                      </ErrorBoundary>
                    </div>
                    <div className="absolute inset-0 flex items-end justify-center bg-linear-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm font-medium text-gray-900 shadow-sm">
                        <EyeIcon className="size-4" />
                        {t("view")}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-end justify-end px-2 py-1">
                      <span className="flex ml-auto text-gray-200 uppercase text-xs font-semibold">
                        <span className="mr-1 size-3.5">
                          <DrawingIcon
                            application={drawing.object_value.application}
                          />
                        </span>
                        {drawing.object_value.application}
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <FilePenLineIcon className="size-4" />
                      </span>
                      <span className="truncate font-semibold text-gray-900">
                        {drawing.name}
                      </span>
                    </div>

                    {drawing.note && (
                      <p className="line-clamp-2 text-sm text-gray-600">
                        {drawing.note}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <HistoryIcon className="size-3.5 text-gray-400" />
                        <RelativeDateTooltip date={drawing.modified_date} />
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="size-3.5 text-gray-400" />
                        {formatName(drawing.created_by)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {data && (
        <Pagination
          cPage={page}
          defaultPerPage={RESULTS_PER_PAGE}
          data={{ totalCount: data.count }}
          onChange={setPage}
        />
      )}
    </div>
  );
};
