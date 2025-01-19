import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ambulance,
  BedDouble,
  Building2,
  Home,
  MonitorSmartphone,
  Stethoscope,
} from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
import FacilityOrganizationSelector from "@/pages/FacilityOrganization/components/FacilityOrganizationSelector";
import {
  Encounter,
  EncounterClass,
  EncounterRequest,
} from "@/types/emr/encounter";

const encounterFormSchema = z.object({
  status: z.enum(["planned", "in_progress", "on_hold"] as const),
  encounter_class: z.enum([
    "imp",
    "amb",
    "obsenc",
    "emer",
    "vr",
    "hh",
  ] as const),
  priority: z.enum([
    "ASAP",
    "callback_results",
    "callback_for_scheduling",
    "elective",
    "emergency",
    "preop",
    "as_needed",
    "routine",
    "rush_reporting",
    "stat",
    "timing_critical",
    "use_as_directed",
    "urgent",
  ] as const),
  organizations: z.array(z.string()),
});

const encounterClasses = [
  {
    value: "imp",
    label: "Inpatient",
    icon: BedDouble,
    description: "Patient is admitted to the hospital",
  },
  {
    value: "amb",
    label: "Ambulatory",
    icon: Ambulance,
    description: "Patient visits for outpatient care",
  },
  {
    value: "obsenc",
    label: "Observation",
    icon: Stethoscope,
    description: "Patient is under observation",
  },
  {
    value: "emer",
    label: "Emergency",
    icon: Building2,
    description: "Emergency department visit",
  },
  {
    value: "vr",
    label: "Virtual",
    icon: MonitorSmartphone,
    description: "Virtual/telehealth consultation",
  },
  {
    value: "hh",
    label: "Home Health",
    icon: Home,
    description: "Care provided at patient's home",
  },
] as const;

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
      toast.success("Encounter created successfully");
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["encounters", patientId] });
      onSuccess?.();
      navigate(`/facility/${facilityId}/encounter/${data.id}/updates`);
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      errorData.errors.msg.forEach((er) => {
        toast.error(er);
      });
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="secondary"
            className="h-14 w-full justify-start text-lg"
          >
            <Stethoscope className="mr-4 size-6" />
            Create Encounter
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Initiate Patient Encounter</SheetTitle>
          <SheetDescription>
            Begin a new clinical encounter for {patientName}. Select the
            appropriate encounter type, status, and priority to ensure proper
            documentation and care delivery.
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
                  <FormLabel className="text-base">Type of Encounter</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {encounterClasses.map(
                      ({ value, label, icon: Icon, description }) => (
                        <Button
                          key={value}
                          type="button"
                          data-cy={`encounter-type-${value}`}
                          className="h-24 w-full justify-start text-lg"
                          variant={
                            field.value === value ? "default" : "outline"
                          }
                          onClick={() => field.onChange(value)}
                        >
                          <div className="flex flex-col items-center text-center">
                            <Icon className="size-6" />
                            <div className="text-sm font-bold">{label}</div>
                            <div className="text-wrap text-xs text-center text-xs text-muted-foreground">
                              {description}
                            </div>
                          </div>
                        </Button>
                      ),
                    )}
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
                    <FormLabel>Status</FormLabel>
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
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
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
                        <SelectItem value="ASAP">ASAP</SelectItem>
                        <SelectItem value="callback_results">
                          Callback Results
                        </SelectItem>
                        <SelectItem value="callback_for_scheduling">
                          Callback for Scheduling
                        </SelectItem>
                        <SelectItem value="elective">Elective</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="preop">Preop</SelectItem>
                        <SelectItem value="as_needed">As Needed</SelectItem>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="rush_reporting">
                          Rush Reporting
                        </SelectItem>
                        <SelectItem value="stat">Stat</SelectItem>
                        <SelectItem value="timing_critical">
                          Timing Critical
                        </SelectItem>
                        <SelectItem value="use_as_directed">
                          Use as Directed
                        </SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FacilityOrganizationSelector
              facilityId={facilityId}
              onChange={(value) => {
                form.setValue("organizations", [value]);
              }}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create Encounter"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
