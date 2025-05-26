import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_CLASSES_ICONS,
  ENCOUNTER_PRIORITY,
  Encounter,
  EncounterClass,
  EncounterRequest,
} from "@/types/emr/encounter";

interface Props {
  patientId: string;
  facilityId: string;
  patientName: string;
  encounterClass?: EncounterClass;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateEncounterForm({
  patientId,
  facilityId,
  patientName,
  encounterClass,
  trigger,
  onSuccess,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const encounterFormSchema = z.object({
    status: z.enum(["planned", "in_progress", "on_hold"] as const),
    encounter_class: z.enum(ENCOUNTER_CLASS),
    priority: z.enum(ENCOUNTER_PRIORITY),
    organizations: z.array(z.string()).min(1, {
      message: t("at_least_one_department_is_required"),
    }),
    start_date: z.string(),
  });

  const form = useForm({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      status: "planned",
      encounter_class: encounterClass || careConfig.defaultEncounterType,
      priority: "routine",
      organizations: [],
      start_date: new Date().toISOString(),
    },
  });

  const { mutate: createEncounter, isPending } = useMutation({
    mutationFn: mutate(routes.encounter.create),
    onSuccess: (data: Encounter) => {
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

  function onSubmit(data: z.infer<typeof encounterFormSchema>) {
    const encounterRequest: EncounterRequest = {
      ...data,
      patient: patientId,
      facility: facilityId,
      period: {
        start: data.start_date,
      },
    };

    createEncounter(encounterRequest);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("initiate_encounter")}</SheetTitle>
          <SheetDescription>
            {t("begin_clinical_encounter", { patientName })}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-2"
          >
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        className="sm:w-[150px] border-t-0 sm:border-t text-gray-500 border-gray-200 h-8"
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
                <FormItem className="space-y-3">
                  <FormLabel>{t("type_of_encounter")}</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {ENCOUNTER_CLASS.map((value) => {
                      const Icon = ENCOUNTER_CLASSES_ICONS[value];
                      return (
                        <Button
                          key={value}
                          type="button"
                          data-cy={`encounter-type-${value}`}
                          className={cn(
                            "h-24 w-full justify-start text-lg",
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
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-cy="encounter-status">
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-cy="encounter-priority">
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
            </div>
            <FormField
              control={form.control}
              name="organizations"
              render={({ field }) => (
                <FormItem>
                  <FacilityOrganizationSelector
                    facilityId={facilityId}
                    value={field.value}
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
                type="submit"
                disabled={isPending || !form.watch("organizations").length}
              >
                {isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
