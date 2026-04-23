import PatientIdentifierFilter from "@/components/Patient/PatientIdentifierFilter";
import { useScheduleResourceFromPath } from "@/components/Schedule/useScheduleResource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { OngoingQueueTokenCardsList } from "@/pages/Facility/queues/OngoingQueueTokenCard";
import { usePreferredServicePointCategory } from "@/pages/Facility/queues/usePreferredServicePointCategory";
import { getTokenQueueStatusCount } from "@/pages/Facility/queues/utils";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  DoorOpenIcon,
  EyeIcon,
  Megaphone,
  SearchIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useQueryParams } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ServicePointsDropDown } from "./ServicePointsDropDown";
import { useQueueServicePoints } from "./useQueueServicePoints";

interface Props {
  facilityId: string;
  queueId: string;
}

export function ManageQueueOngoingTab({ facilityId, queueId }: Props) {
  const { t } = useTranslation();
  const { assignedServicePoints } = useQueueServicePoints();
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });
  const [qParams, setQueryParams] = useQueryParams();
  const { autoRefresh, search, patient, patient_name } = qParams;
  const [mobileSection, setMobileSection] = useState<"waiting" | "serving">(
    "waiting",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = [search, patient].filter(Boolean).length;
  const { data: summary } = useQuery({
    queryKey: ["token-queue-summary", facilityId, queueId],
    queryFn: query(tokenQueueApi.summary, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    refetchInterval: autoRefresh === "true" ? 10000 : false,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile/tablet: collapsible filter trigger */}
      <Collapsible
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        className="lg:hidden"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-9 text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontalIcon className="size-4" />
              {t("search_patients")}
              {activeFilterCount > 0 && (
                <Badge variant="primary" size="sm">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                filtersOpen && "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <FilterControls
            search={search}
            patient={patient}
            patientName={patient_name}
            qParams={qParams}
            setQueryParams={setQueryParams}
            hideSearchLabel
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Desktop: inline filters */}
      <div className="hidden lg:flex flex-col lg:flex-row justify-between items-stretch lg:items-start mt-2 gap-4">
        <FilterControls
          search={search}
          patient={patient}
          patientName={patient_name}
          qParams={qParams}
          setQueryParams={setQueryParams}
        />
      </div>

      {/* Mobile/tablet section toggle */}
      <Tabs
        value={mobileSection}
        onValueChange={(value) =>
          setMobileSection(value as "waiting" | "serving")
        }
        className="lg:hidden"
      >
        <TabsList className="w-full">
          <TabsTrigger value="waiting" className="flex-1">
            {t("waiting")}
          </TabsTrigger>
          <TabsTrigger value="serving" className="flex-1">
            {t("called_plus_now_serving")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col lg:flex-row lg:space-x-4 gap-4 lg:gap-0 lg:overflow-x-auto w-full">
        {/* Waiting tokens list */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0",
            mobileSection === "waiting" ? "flex" : "hidden lg:flex",
          )}
        >
          <QueueColumn title={t("waiting")}>
            <OngoingQueueTokenCardsList
              facilityId={facilityId}
              queueId={queueId}
              qParams={{
                sub_queue_is_null: true,
                status: TokenStatus.CREATED,
                patient_name: search || "",
                patient: patient,
              }}
              emptyState={
                <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
                  <DoorOpenIcon className="size-6 text-gray-700" />
                  <span className="text-sm font-semibold text-gray-700">
                    {t("no_patient_is_waiting")}
                  </span>
                </div>
              }
            />
          </QueueColumn>
        </div>

        {/* Called + Now Serving tokens list */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0",
            mobileSection === "serving" ? "flex" : "hidden lg:flex",
          )}
        >
          <QueueColumn
            title={t("called_plus_now_serving")}
            options={
              summary && (
                <AwaitingRecallTrigger
                  queueId={queueId}
                  facilityId={facilityId}
                  count={getTokenQueueStatusCount(
                    summary,
                    TokenStatus.UNFULFILLED,
                  )}
                />
              )
            }
          >
            <div className="flex flex-col gap-4">
              {assignedServicePoints.map((subQueue, index) => (
                <div key={subQueue.id} className="flex flex-col gap-4">
                  {index > 0 && (
                    <hr className="h-px w-full border border-gray-300 border-dashed" />
                  )}
                  <div className="flex flex-col p-1 rounded-lg bg-gray-200">
                    <div className="flex items-start justify-between gap-2 p-1 pb-2 flex-wrap">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {subQueue.name}
                        </span>
                        <span className="text-xs">
                          {t("category")}:{" "}
                          {preferredServicePointCategories?.[subQueue.id]
                            ?.name ?? t("all")}
                        </span>
                      </div>
                      <InServiceColumnOptions
                        facilityId={facilityId}
                        queueId={queueId}
                        subQueueId={subQueue.id}
                        tokens={[]}
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1 pt-2">
                        <span className="text-sm font-medium">
                          {t("now_serving")}
                        </span>
                        <OngoingQueueTokenCardsList
                          facilityId={facilityId}
                          queueId={queueId}
                          qParams={{
                            status: TokenStatus.IN_PROGRESS,
                            sub_queue: subQueue.id,
                          }}
                          emptyState={
                            <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-3 border border-gray-100">
                              <DoorOpenIcon className="size-6 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-700 text-center">
                                {t("no_patient_is_being_served")}
                              </span>
                              <CallNextPatientButton
                                subQueueId={subQueue.id}
                                facilityId={facilityId}
                                queueId={queueId}
                                variant="outline"
                                size="lg"
                              >
                                <Megaphone />
                                {t("call_next_patient")}
                              </CallNextPatientButton>
                            </div>
                          }
                        />
                      </div>
                      <OngoingQueueTokenCardsList
                        facilityId={facilityId}
                        queueId={queueId}
                        qParams={{
                          status: TokenStatus.CREATED,
                          sub_queue: subQueue.id,
                        }}
                        header={
                          <div className="border border-gray-300 border-dashed" />
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </QueueColumn>
        </div>
      </div>
    </div>
  );
}

function FilterControls({
  search,
  patient,
  patientName,
  qParams,
  setQueryParams,
  hideSearchLabel,
}: {
  search: string | undefined;
  patient: string | undefined;
  patientName: string | undefined;
  qParams: Record<string, string | undefined>;
  setQueryParams: (
    params: Record<string, string | undefined>,
    options?: { overwrite?: boolean; replace?: boolean },
  ) => void;
  hideSearchLabel?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {!hideSearchLabel && (
          <Label className="text-gray-950 text-sm font-medium">
            {t("search_patients")}
          </Label>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              type="search"
              placeholder={t("search_by_patient_name")}
              value={search || ""}
              onChange={(e) =>
                setQueryParams(
                  { search: e.target.value || "" },
                  { overwrite: false, replace: true },
                )
              }
              className="pl-10 w-full h-9"
            />
          </div>
          <PatientIdentifierFilter
            onSelect={(patientId, patientNameVal) => {
              if (patientId && patientNameVal) {
                setQueryParams(
                  {
                    patient: patientId,
                    patient_name: patientNameVal,
                  },
                  { overwrite: false, replace: true },
                );
              } else {
                const next = { ...qParams };
                delete next.patient;
                delete next.patient_name;
                setQueryParams(next, { replace: true });
              }
            }}
            placeholder={t("filter_by_identifier")}
            className="w-full sm:w-auto rounded-md h-9 text-gray-500 shadow-sm"
            patientId={patient}
            patientName={patientName}
          />
        </div>
      </div>
      <div className="pt-3 lg:pt-0 flex flex-col gap-2 w-full lg:w-auto lg:max-w-[55%] lg:items-end min-w-0">
        <Label className="text-gray-950 text-sm font-medium">
          {t("service_points")}
        </Label>
        <ServicePointsDropDown />
      </div>
    </>
  );
}

export function QueueColumn({
  title,
  children,
  options,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  options?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200 w-full lg:min-w-xs lg:flex-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {options}
      </div>
      <div className="lg:h-[calc(100vh-21.5rem)] lg:overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}

function InServiceColumnOptions({
  facilityId,
  queueId,
  subQueueId,
}: {
  facilityId: string;
  queueId: string;
  subQueueId: string;
  tokens: TokenRead[];
}) {
  const { t } = useTranslation();

  const { preferredServicePointCategories, setPreferredServicePointCategory } =
    usePreferredServicePointCategory({ facilityId });
  const { resourceType } = useScheduleResourceFromPath();

  const { data: tokenCategories } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType],
    queryFn: query(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
      },
    }),
  });

  return (
    <div className="flex gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <CallNextPatientButton
            subQueueId={subQueueId}
            facilityId={facilityId}
            queueId={queueId}
            variant="ghost"
            size="icon"
          >
            <Megaphone />
          </CallNextPatientButton>
        </TooltipTrigger>
        <TooltipContent>{t("call_next_patient")}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <SettingsIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t("set_category")}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <RadioGroup
                value={
                  preferredServicePointCategories?.[subQueueId]?.id || "all"
                }
                onValueChange={(value) =>
                  setPreferredServicePointCategory(
                    subQueueId,
                    value === "all" ? null : value,
                  )
                }
                className="space-y-2 p-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    {t("all")}
                  </Label>
                </div>
                {tokenCategories?.results.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={category.id} id={category.id} />
                    <Label htmlFor={category.id} className="cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {/* <DropdownMenuItem>Transfer all</DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AwaitingRecallTrigger({
  count,
  queueId,
  facilityId,
}: {
  count: number;
  queueId: string;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const [showAwaitingRecallDialog, setShowAwaitingRecallDialog] =
    useState(false);

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="link"
          size="lg"
          className="underline font-semibold px-1 sm:px-3"
          disabled={count === 0}
          onClick={() => setShowAwaitingRecallDialog(true)}
        >
          <EyeIcon />
          <span className="hidden sm:inline">{t("awaiting_recall")}</span>
        </Button>
        <div>
          <Badge size="sm">{count}</Badge>
        </div>
      </div>
      <AwaitingRecallDialog
        open={showAwaitingRecallDialog}
        onOpenChange={setShowAwaitingRecallDialog}
        facilityId={facilityId}
        queueId={queueId}
      />
    </>
  );
}

function CallNextPatientButton({
  subQueueId,
  facilityId,
  queueId,
  ...props
}: {
  subQueueId: string;
  facilityId: string;
  queueId: string;
} & React.ComponentProps<typeof Button>) {
  const { preferredServicePointCategories } = usePreferredServicePointCategory({
    facilityId,
  });

  const queryClient = useQueryClient();

  const {
    mutate: setNextTokenToSubQueue,
    isPending: isSettingNextTokenToSubQueue,
  } = useMutation({
    mutationFn: mutate(tokenQueueApi.setNextTokenToSubQueue, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["infinite-tokens", facilityId, queueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["token-queue-summary", facilityId, queueId],
      });
    },
  });

  return (
    <Button
      {...props}
      disabled={isSettingNextTokenToSubQueue}
      onClick={() => {
        setNextTokenToSubQueue({
          sub_queue: subQueueId,
          category: preferredServicePointCategories?.[subQueueId]?.id,
        });
      }}
    />
  );
}

function AwaitingRecallDialog({
  open,
  onOpenChange,
  facilityId,
  queueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("awaiting_recall")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <OngoingQueueTokenCardsList
            facilityId={facilityId}
            queueId={queueId}
            qParams={{
              status: TokenStatus.UNFULFILLED,
            }}
            emptyState={
              <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
                <EyeIcon className="size-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">
                  {t("no_tokens_awaiting_recall")}
                </span>
              </div>
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
