import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
import query from "@/Utils/request/query";
import {
  LocationFormOptions,
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
  form: z.enum(LocationFormOptions),
  parent: z.string().optional().nullable(),
  organizations: z.array(z.string()).default([]),
  availability_status: z.enum(["available", "unavailable"] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  facilityId: string;
  onSuccess?: () => void;
  locationId?: string;
  parentId?: string;
}

const defaultValues: FormValues = {
  name: "",
  description: "",
  status: "active",
  operational_status: "O",
  form: "ro",
  parent: null,
  organizations: [],
  availability_status: "available",
};

export default function LocationForm({
  facilityId,
  onSuccess,
  locationId,
  parentId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: location, isLoading } = useQuery({
    queryKey: ["location", locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    enabled: !!locationId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      parent: parentId || null,
    },
  });

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description,
        status: location.status,
        operational_status: location.operational_status,
        form: location.form,
        parent: parentId || null,
        organizations: [],
        availability_status: location.availability_status || "available",
      });
    }
  }, [location, form, parentId]);

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
      // Mode = instance only for beds
      mode: values.form === "bd" ? "instance" : "kind",
      description: values.description || "",
      organizations: values.organizations,
      parent: values.parent || undefined,
    };

    if (location?.id) {
      locationData.id = location.id;
    }

    submitForm(locationData);
  }

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

  if (locationId && isLoading) {
    return <div className="p-4">Loading...</div>;
  }

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
                  value={field.value}
                  disabled={!!locationId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[46vh]">
                    {LocationFormOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`location_form__${option}`)}
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
