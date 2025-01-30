import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import {
  LocationList,
  LocationWrite,
  OperationalStatus,
  Status,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "unknown"] as const),
  operational_status: z.enum(["C", "H", "O", "U", "K", "I"] as const),
  form: z.enum([
    "si",
    "bu",
    "wi",
    "wa",
    "lvl",
    "co",
    "ro",
    "bd",
    "ve",
    "ho",
    "ca",
    "rd",
    "area",
    "jdn",
    "vi",
  ] as const),
  mode: z.enum(["instance", "kind"] as const),
  parent: z.string().optional().nullable(),
  organizations: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  facilityId: string;
  onSuccess?: () => void;
  location?: LocationList;
  parentId?: string;
}

export default function LocationForm({
  facilityId,
  onSuccess,
  location,
  parentId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Initialize form with either edit values or create defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: location
      ? {
          name: location.name,
          description: location.description,
          status: location.status,
          operational_status: location.operational_status,
          form: location.form,
          mode: location.mode,
          parent: parentId || null,
          organizations: [],
        }
      : {
          name: "",
          description: "",
          status: "active",
          operational_status: "O",
          form: "ro",
          mode: "instance",
          parent: parentId || null,
          organizations: [],
        },
  });

  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: location?.id
      ? mutate(locationApi.update, {
          pathParams: { facility_id: facilityId, id: location.id },
        })
      : mutate(locationApi.create, {
          pathParams: { facility_id: facilityId },
        }),
    onSuccess: () => {
      toast.success(
        location?.id ? t("location_updated") : t("location_created"),
      );
      queryClient.invalidateQueries({ queryKey: ["locations"] });

      onSuccess?.();
    },
  });

  function onSubmit(values: FormValues) {
    const locationData: LocationWrite = {
      ...values,
      description: values.description || "",
      organizations: values.organizations,
      parent: values.parent || undefined,
    };

    if (location?.id) {
      locationData.id = location.id;
    }

    submitForm(locationData);
  }

  const locationFormOptions = [
    { value: "si", label: "Site" },
    { value: "bu", label: "Building" },
    { value: "wi", label: "Wing" },
    { value: "wa", label: "Ward" },
    { value: "lvl", label: "Level" },
    { value: "co", label: "Corridor" },
    { value: "ro", label: "Room" },
    { value: "bd", label: "Bed" },
    { value: "ve", label: "Vehicle" },
    { value: "ho", label: "House" },
    { value: "ca", label: "Cabinet" },
    { value: "rd", label: "Road" },
    { value: "area", label: "Area" },
    { value: "jdn", label: "Jurisdiction" },
    { value: "vi", label: "Virtual" },
  ];

  const statusOptions: { value: Status; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "unknown", label: "Unknown" },
  ];

  const operationalStatusOptions: {
    value: OperationalStatus;
    label: string;
  }[] = [
    { value: "C", label: "Closed" },
    { value: "H", label: "Housekeeping" },
    { value: "I", label: "Isolated" },
    { value: "K", label: "Contaminated" },
    { value: "O", label: "Operational" },
    { value: "U", label: "Unoccupied" },
  ];

  const modeOptions = [
    { value: "instance", label: "Instance" },
    { value: "kind", label: "Kind" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="form"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("location_form")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationFormOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("mode")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("status")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="operational_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("operational_status")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {operationalStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>{location?.id ? t("updating") : t("creating")}</>
          ) : (
            <>{location?.id ? t("update") : t("create")}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
