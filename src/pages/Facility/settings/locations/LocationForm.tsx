import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { Info, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  LocationFormOptions,
  type LocationWrite,
  type OperationalStatus,
  type Status,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import type {
  BatchRequestBody,
  BatchSubmissionResult,
} from "@/types/questionnaire/batch";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: t("field_required") }),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "unknown"] as const),
  operational_status: z.enum(["C", "H", "O", "U", "K", "I"] as const),
  form: z.enum(LocationFormOptions),
  parent: z.string().optional().nullable(),
  enableBulkCreation: z.boolean().default(false),
  numberOfBeds: z.string().optional(),
  customizeNames: z.boolean().default(false),
  organizations: z.array(z.string()).default([]),
  availability_status: z.enum(["available", "unavailable"] as const),
  bedNames: z
    .array(
      z.object({
        name: z.string().min(1, { message: t("field_required") }),
      }),
    )
    .default([]),
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
  enableBulkCreation: false,
  numberOfBeds: "2",
  customizeNames: false,
  organizations: [],
  availability_status: "available",
  bedNames: [],
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

  const isEditMode = !!location?.id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      parent: parentId || null,
    },
  });
  const { fields: bedFields, replace: replaceBedFields } = useFieldArray({
    control: form.control,
    name: "bedNames",
  });

  const resetToDefaultNames = () => {
    if (form.watch("name") && form.watch("numberOfBeds")) {
      const defaultNames = Array.from(
        { length: Number.parseInt(form.watch("numberOfBeds") ?? "0") },
        (_, index) => ({
          name: `${form.watch("name")} ${index + 1}`,
        }),
      );
      replaceBedFields(defaultNames);
    }
  };

  useEffect(() => {
    const formType = form.watch("form");
    const bulkCreationEnabled = form.watch("enableBulkCreation");
    const numberOfBeds = form.watch("numberOfBeds");
    const locationName = form.watch("name");
    const customizeNames = form.watch("customizeNames");

    if (
      formType === "bd" &&
      bulkCreationEnabled &&
      numberOfBeds &&
      locationName
    ) {
      if (!customizeNames || bedFields.length === 0 || locationName) {
        resetToDefaultNames();
      } else {
        const newCount = Number.parseInt(numberOfBeds ?? "0", 10);
        const currentFields = form.getValues("bedNames") ?? [];
        const updatedFields = [...currentFields];

        while (updatedFields.length < newCount) {
          updatedFields.push({
            name: `${locationName} ${updatedFields.length + 1}`,
          });
        }

        replaceBedFields(updatedFields.slice(0, newCount));
      }
    }
  }, [
    form.watch("form"),
    form.watch("enableBulkCreation"),
    form.watch("numberOfBeds"),
    form.watch("name"),
    form.watch("customizeNames"),
    bedFields.length,
  ]);

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
        customizeNames: false,
        bedNames: [],
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
    mutationFn: mutate(routes.batchRequest),
    onSuccess: (data: { results: BatchSubmissionResult[] }) => {
      toast.success(
        t("bed_created_notification", { count: data.results.length }),
      );
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      onSuccess?.();
    },
  });

  function onSubmit(values: FormValues) {
    const data: LocationWrite = {
      ...values,
      mode: values.form === "bd" ? "instance" : "kind",
      description: values.description || "",
      organizations: values.organizations,
      parent: values.parent || undefined,
    };

    if (values.form === "bd" && !isEditMode && values.enableBulkCreation) {
      const batchRequest: BatchRequestBody = {
        requests: values.bedNames.map((bed) => ({
          url: `/api/v1/facility/${facilityId}/location/`,
          method: "POST",
          reference_id: parentId ? `Location ${parentId}` : "Location",
          body: {
            ...data,
            name: bed.name,
          },
        })),
      };
      submitBatch(batchRequest);
      return;
    }

    if (location?.id) {
      data.id = location.id;
    }

    submitForm(data);
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

  const showBedOptions = form.watch("form") === "bd" && !isEditMode;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="form"
          render={({ field }) => (
            <FormItem
              className={showBedOptions ? "md:col-span-1" : "md:col-span-2"}
            >
              <FormLabel>{t("location_form")}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== "bd") {
                    form.setValue("enableBulkCreation", false);
                    form.setValue("numberOfBeds", "2");
                    form.setValue("customizeNames", false);
                  }
                }}
                value={field.value}
                disabled={!!locationId}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
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

        {/* Checkbox Field (Hidden when `showBedOptions` is false) */}
        {showBedOptions && (
          <FormField
            control={form.control}
            name="enableBulkCreation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>{t("create_multiple_beds")}</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {t("create_multiple_beds_description")}
                  </p>
                </div>
              </FormItem>
            )}
          />
        )}

        {showBedOptions && form.watch("enableBulkCreation") && (
          <FormField
            control={form.control}
            name="numberOfBeds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("number_of_beds")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_number_of_beds")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 14 }, (_, i) => i + 2).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {t("beds")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {showBedOptions &&
          form.watch("enableBulkCreation") &&
          form.watch("name").trim() !== "" && (
            <div className="space-y-4 mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-700">
                  {t("bulk_bed_creation_info")}
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="customizeNames"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("customize_bed_names")}</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t("customize_bed_names_description")}
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("customizeNames") ? (
                <div className="space-y-4 border rounded-md p-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="font-medium">{t("individual_bed_names")}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaultNames}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t("reset_to_default")}
                    </Button>
                  </div>

                  <span className="text-sm font-medium">
                    {t("edit_bed_names", {
                      count: Number(form.watch("numberOfBeds")),
                    })}
                  </span>

                  <div className="space-y-3 mt-2">
                    {bedFields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`bedNames.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-sm font-medium min-w-[60px]">
                                {t("bed_number", { number: index + 1 })}:
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t("bed_name_placeholder", {
                                    number: index + 1,
                                  })}
                                  className="flex-1"
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-4">
                  <h4 className="font-medium mb-2">{t("preview_bed_names")}</h4>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                    {bedFields.map((field) => (
                      <div
                        key={field.id}
                        className="px-3 py-1 bg-gray-100 rounded-md shadow-sm"
                      >
                        {field.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description")}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Button
          type="submit"
          disabled={Boolean(
            isPending || (location?.id && !form.formState.isDirty),
          )}
        >
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
