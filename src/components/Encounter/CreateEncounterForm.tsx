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

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  });

  const form = useForm<z.infer<typeof encounterFormSchema>>({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      status: "planned",
      encounter_class: encounterClass || careConfig.defaultEncounterType,
      priority: "routine",
      organizations: [],
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
        start: new Date().toISOString(),
      },
    };

    createEncounter(encounterRequest);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          form.reset();
        }
      }}
    >
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
            className="mt-4 space-y-6"
          >
            <FormField
              control={form.control}
              name="encounter_class"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">
                    {t("type_of_encounter")}
                  </FormLabel>
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
                    value={field.value[0]}
                    onChange={(value) => {
                      if (value === null) {
                        form.setValue("organizations", []);
                      } else {
                        form.setValue("organizations", [value]);
                      }
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !form.watch("organizations").length}
            >
              {isPending ? t("creating") : t("create_encounter")}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
