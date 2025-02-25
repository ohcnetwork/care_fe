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

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  LocationWrite,
  OperationalStatus,
  Status,
  locationFormOptions,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import {
  BatchRequestBody,
  BatchSubmissionResult,
} from "@/types/questionnaire/batch";

interface Props {
  facilityId: string;
  onSuccess?: () => void;
  locationId?: string;
  parentId?: string;
}

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

  const isEditMode = !!location?.id;

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
    parent: z.string().optional().nullable(),

    beds_count: z
      .string()
      .optional()
      .refine((val) => val === undefined || Number(val) >= 1, {
        message: t("bed_count_validation_error"),
      }),
    organizations: z.array(z.string()).default([]),
    availability_status: z.enum(["available", "unavailable"] as const),
  });

  type FormValues = z.infer<typeof formSchema>;

  const defaultValues: FormValues = {
    name: "",
    description: "",
    status: "active",
    operational_status: "O",
    form: "ro",
    beds_count: "1",
    parent: null,
    organizations: [],
    availability_status: "available",
  };

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
      toast.success(isEditMode ? t("location_updated") : t("location_created"));
      queryClient.invalidateQueries({ queryKey: ["locations"] });

      onSuccess?.();
    },
  });

  const { mutate: submitBatch } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: (data: { results: BatchSubmissionResult[] }) => {
      toast.success(
        t("bed_created_notification", { count: data.results.length }),
      );
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      onSuccess?.();
    },

    // onError: () => {
    //   toast.error(t("submission_failed"));
    // },
  });

  function onSubmit(values: FormValues) {
    if (values.form === "bd" && !isEditMode && Number(values.beds_count) > 1) {
      const data: LocationWrite = {
        ...values,
        mode: "instance",
        description: values.description || "",
        organizations: values.organizations,
        parent: values.parent || undefined,
      };

      const batchRequest: BatchRequestBody = {
        requests: Array.from(
          { length: Number(values.beds_count) },
          (_, index) => ({
            url: `/api/v1/facility/${facilityId}/location/`,
            method: "POST",
            reference_id: `Location`,
            body: {
              ...data,
              name: `${values.name} ${index + 1}`,
            },
          }),
        ),
      };
      submitBatch(batchRequest);
      return;
    }
    const locationData: LocationWrite = {
      ...values,
      mode: "kind",
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
        {form.watch("form") === "bd" &&
          form.watch("beds_count") &&
          !isNaN(Number(form.watch("beds_count"))) &&
          Number(form.watch("beds_count")) > 1 &&
          form.watch("name")?.trim() !== "" && (
            <span className="text-sm text-gray-500">
              {Array.from(
                { length: Number(form.watch("beds_count")) },
                (_, index) => (
                  <span key={index}>
                    {form.watch("name")}-{index + 1},{" "}
                  </span>
                ),
              )}
            </span>
          )}
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

          {form.watch("form") === "bd" && !isEditMode && (
            <FormField
              control={form.control}
              name="beds_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("total_number_of_beds")}</FormLabel>
                  <Input {...field} type="number" />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
            <>{isEditMode ? t("updating") : t("creating")}</>
          ) : (
            <>{isEditMode ? t("update") : t("create")}</>
          )}
        </Button>
      </form>
    </Form>
  );
}
