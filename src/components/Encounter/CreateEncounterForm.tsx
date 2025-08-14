import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onlineManager,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import useAuthUser from "@/hooks/useAuthUser";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap } from "@/OfflineSupport/offlineKeys";
import {
  handleOfflineRecordSuccess,
  isOfflineId,
  normalizeOfflineEncounterRecord,
  saveOfflineWrite,
  saveOfflineWriteData,
  updateActiveEncounterList,
} from "@/OfflineSupport/offlineWriteHelpers";
import mutate from "@/Utils/request/mutate";
import { PaginatedResponse } from "@/Utils/request/types";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY,
  EncounterClass,
  EncounterCreate,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";

interface Props {
  patientId: string;
  facilityId: string;
  patientName: string;
  hasReachedEncounterLimitOffline?: boolean;
  encounterClass?: EncounterClass;
  offlineEntryId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function CreateEncounterForm({
  patientId,
  facilityId,
  patientName,
  hasReachedEncounterLimitOffline,
  encounterClass,
  offlineEntryId,
  trigger,
  onSuccess,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const { t } = useTranslation();

  const db = new AppCacheDB();
  const [currentSelectedOrganizations, setCurrentSelectedOrganizations] =
    useState<FacilityOrganizationRead[]>([]);

  const encounterFormSchema = z.object({
    status: z.enum(["planned", "in_progress", "on_hold"] as const),
    encounter_class: z.enum(ENCOUNTER_CLASS),
    priority: z.enum(ENCOUNTER_PRIORITY),
    organizations: z.array(z.string()).min(1, {
      message: t("at_least_one_department_is_required"),
    }),
    start_date: z.string(),
    tags: z.array(z.string()),
  });

  const form = useForm({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      status: "planned",
      encounter_class: encounterClass || careConfig.defaultEncounterType,
      priority: "routine",
      organizations: [],
      start_date: new Date().toISOString(),
      tags: [],
    },
  });

  const tagIds = form.watch("tags");
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });

  const newSelectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  const { mutate: createEncounter, isPending } = useMutation({
    mutationFn: mutate(encounterApi.create),
    onSuccess: async (data: EncounterRead) => {
      if (offlineEntryId) {
        try {
          await handleOfflineRecordSuccess(offlineEntryId, data);
          toast.success(t("encounter_created"));
          setIsOpen(false);
          onSuccess?.();
          return;
        } catch (error) {
          console.error("Error marking offline entry as successful:", error);
        }
      }

      toast.success(t("encounter_created"));
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["encounters", patientId] });
      onSuccess?.();
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${data.id}/updates`,
      );
    },
  });

  const queueNewEncounterOffline = async (
    encounterRequestData: EncounterCreate,
  ) => {
    try {
      const generatedId = `offline-${crypto.randomUUID()}`;

      const offlineWrite: saveOfflineWriteData = {
        id: generatedId,
        userId: authUser.external_id,
        facilityId: facilityId,
        mutationSyncRouteKey: OfflineKeyMap.create_encounter,
        type: OfflineKeyMap.create_encounter,
        resourceType: "Encounter",
        payload: encounterRequestData,
        parentMutationId: isOfflineId(patientId) ? patientId : undefined,
      };

      const saveResult = await saveOfflineWrite(offlineWrite);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const patientData = queryClient.getQueryData<PatientRead>([
        "patient",
        patientId,
      ]);
      if (!patientData) {
        toast.error(t("encounter_created_but_patient_cache_missing"));
        return;
      }

      const permissions = queryClient.getQueryData<string[]>([
        "encounterPermissions",
        facilityId,
      ]);

      const normalizeEncounter = normalizeOfflineEncounterRecord(
        queryClient,
        saveResult.entry,
        patientData,
        authUser,
        newSelectedTags,
        permissions,
        currentSelectedOrganizations || [],
      );

      await db.OfflineWrites.update(saveResult.entry.id, {
        normalizedData: normalizeEncounter,
      });

      queryClient.setQueryData(
        ["encounter", normalizeEncounter.id],
        normalizeEncounter,
      );

      const encounterListKey = ["encounterHistory", patientId, {}];

      const prevEncounterList =
        queryClient.getQueryData<PaginatedResponse<EncounterRead>>(
          encounterListKey,
        );

      const updatedList: PaginatedResponse<EncounterRead> = prevEncounterList
        ? {
            ...prevEncounterList,
            count: prevEncounterList.count + 1,
            results: [normalizeEncounter, ...prevEncounterList.results],
          }
        : {
            count: 1,
            results: [normalizeEncounter],
          };

      queryClient.setQueryData(encounterListKey, updatedList);

      updateActiveEncounterList({
        queryClient: queryClient,
        action: "createEncounter",
        patientID: patientId,
        normalizeEncounter: normalizeEncounter,
      });

      toast.success(t("encounter_created_offline"));
      setIsOpen(false);
      form.reset();
      navigate(
        `/facility/${facilityId}/patient/${patientId}/encounter/${generatedId}/updates`,
      );
    } catch (error) {
      console.error("Error saving offline encounter:", error);
      toast.error(t("offline_encounter_create_error"));
    }
  };

  useEffect(() => {
    if (offlineEntryId) {
      setIsOpen(true);
    }
  }, [offlineEntryId]);

  useEffect(() => {
    if (offlineEntryId) {
      const fetchAndPopulateForm = async () => {
        try {
          const db = new AppCacheDB();
          const entry = await db.OfflineWrites.get(offlineEntryId);

          if (entry && entry.normalizedData) {
            const normalizedData = entry.normalizedData as EncounterRead;

            const formData = {
              status:
                normalizedData.status === "planned" ||
                normalizedData.status === "in_progress" ||
                normalizedData.status === "on_hold"
                  ? normalizedData.status
                  : "planned",
              encounter_class: normalizedData.encounter_class,
              priority: normalizedData.priority,
              organizations:
                normalizedData.organizations?.map((org) => org.id) || [],
              start_date:
                normalizedData.period?.start || new Date().toISOString(),
              tags: normalizedData.tags?.map((tag) => tag.id) || [],
            };

            form.reset(formData);

            // if (normalizedData.tags && normalizedData.tags.length > 0) {
            //   setSelectedTags(normalizedData.tags);
            // }
          }
        } catch (error) {
          console.error("Error fetching offline entry:", error);
          toast.error("Error loading offline encounter data");
        }
      };

      fetchAndPopulateForm();
    }
  }, [offlineEntryId, form]);

  async function onSubmit(data: z.infer<typeof encounterFormSchema>) {
    const encounterRequest: EncounterCreate = {
      ...data,
      patient: patientId,
      facility: facilityId,
      period: {
        start: data.start_date,
      },
      tags: data.tags,
    };

    if (!onlineManager.isOnline()) {
      await queueNewEncounterOffline(encounterRequest);
    } else createEncounter(encounterRequest);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open && onClose) {
          onClose();
        }
      }}
    >
      {/* Only show trigger when not editing an offline encounter */}
      {!offlineEntryId && (
        <SheetTrigger asChild>
          {trigger || (
            <Button
              variant="secondary"
              className="h-14 w-full justify-start text-lg"
            >
              <Stethoscope className="mr-4 size-6" />
              {t("create_encounter")}
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {offlineEntryId
              ? t("edit_offline_encounter")
              : t("initiate_encounter")}
          </SheetTitle>
          <SheetDescription>
            {offlineEntryId ? (
              t("edit_offline_encounter_description", { patientName })
            ) : (
              <Trans
                i18nKey="begin_clinical_encounter"
                values={{ patientName }}
                components={{
                  strong: <strong className="font-semibold text-gray-950" />,
                }}
              />
            )}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-2"
          >
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => {
                  const date = field.value ? new Date(field.value) : new Date();
                  return (
                    <FormItem>
                      <FormLabel>{t("date_and_time")}</FormLabel>
                      <div className="flex sm:gap-2 flex-wrap">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal h-8",
                                !field.value && "text-gray-500",
                              )}
                            >
                              <CareIcon
                                icon="l-calender"
                                className="mr-2 size-4"
                              />
                              {date.toLocaleDateString()}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={(newDate) => {
                                if (!newDate) return;
                                const updatedDate = new Date(newDate);
                                updatedDate.setHours(date.getHours());
                                updatedDate.setMinutes(date.getMinutes());
                                field.onChange(updatedDate.toISOString());
                              }}
                              autoFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          className="sm:w-[150px] border-t-0 sm:border-t text-sm py-px border-gray-400 shadow-sm h-8"
                          value={date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            if (isNaN(hours) || isNaN(minutes)) return;
                            const updatedDate = new Date(date);
                            updatedDate.setHours(hours);
                            updatedDate.setMinutes(minutes);
                            field.onChange(updatedDate.toISOString());
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="encounter_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type_of_encounter")}</FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {ENCOUNTER_CLASS.map((value) => {
                        const Icon = ENCOUNTER_CLASS_ICONS[value];
                        return (
                          <Button
                            key={value}
                            type="button"
                            data-cy={`encounter-type-${value}`}
                            className={cn(
                              "h-auto min-h-24 w-full justify-start text-lg",
                              field.value === value &&
                                "ring-2 ring-primary text-primary",
                            )}
                            variant="outline"
                            onClick={() => field.onChange(value)}
                          >
                            <div className="flex flex-col items-center text-center">
                              <Icon className="size-6" />
                              <div className="text-sm font-bold">
                                {t(`encounter_class__${value}`)}
                              </div>
                              <div className="text-wrap text-center text-xs text-gray-500">
                                {t(`encounter_class_description__${value}`)}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          data-cy="encounter-status"
                          ref={field.ref}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_progress">
                          {t("in_progress")}
                        </SelectItem>
                        <SelectItem value="planned">{t("planned")}</SelectItem>
                        <SelectItem value="on_hold">{t("on_hold")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          data-cy="encounter-priority"
                          ref={field.ref}
                        >
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENCOUNTER_PRIORITY.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`encounter_priority__${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tags")}</FormLabel>
                    <FormControl className="mt-0">
                      <TagSelectorPopover
                        selected={newSelectedTags}
                        onChange={(tags) => {
                          field.onChange(tags.map((tag) => tag.id));
                        }}
                        resource={TagResource.ENCOUNTER}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizations"
                render={({ field }) => (
                  <FormItem>
                    <FacilityOrganizationSelector
                      facilityId={facilityId}
                      value={field.value}
                      setCurrentSelectedOrganizations={
                        setCurrentSelectedOrganizations
                      }
                      onChange={(value) => {
                        if (value === null) {
                          form.setValue("organizations", []);
                        } else {
                          form.setValue("organizations", value);
                        }
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!onlineManager.isOnline() &&
              hasReachedEncounterLimitOffline === true && (
                <Alert variant="destructive" className="flex items-start gap-3">
                  <AlertDescription>
                    {t("offline_encounter_limit_reached")}
                  </AlertDescription>
                </Alert>
              )}

            <div className="flex justify-end mt-6 space-x-2">
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
              >
                {t("cancel")}
              </Button>
              <Button
                data-cy="create-encounter-button"
                type="submit"
                disabled={
                  isPending ||
                  !form.watch("organizations").length ||
                  hasReachedEncounterLimitOffline === true
                }
              >
                {isPending ? t("creating") : t("create_encounter")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
