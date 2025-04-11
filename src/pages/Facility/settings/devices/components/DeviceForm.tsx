import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isBefore, startOfTomorrow } from "date-fns";
import { useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ErrorBoundary from "@/components/Common/ErrorBoundary";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import { dateQueryString } from "@/Utils/utils";
import {
  usePluginDevice,
  usePluginDevices,
} from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
import {
  ContactPointSystems,
  contactPointSchema,
} from "@/types/common/contactPoint";
import {
  DeviceAvailabilityStatuses,
  DeviceList,
  DeviceStatuses,
} from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface Props {
  facilityId: string;
  device?: DeviceList;
  onSuccess?: () => void;
}

export default function DeviceForm({ facilityId, device, onSuccess }: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const [qParams] = useQueryParams<{ type?: string }>();

  const queryClient = useQueryClient();
  const pluginDevices = usePluginDevices();

  const formSchema = z
    .object({
      identifier: z.string().optional(),
      status: z.enum(DeviceStatuses),
      availability_status: z.enum(DeviceAvailabilityStatuses),
      manufacturer: z.string().optional(),
      manufacture_date: z
        .string()
        .optional()
        .refine(
          (date) => !date || isBefore(new Date(date), startOfTomorrow()),
          t("manufacture_date_cannot_be_in_future"),
        ),
      expiration_date: z.string().optional(),
      lot_number: z.string().optional(),
      serial_number: z.string().optional(),
      registered_name: z
        .string()
        .trim()
        .min(1, { message: t("field_required") }),
      user_friendly_name: z.string().optional(),
      model_number: z.string().optional(),
      part_number: z.string().optional(),
      contact: z.array(contactPointSchema()).superRefine((contacts, ctx) => {
        const valueMap = new Map();
        contacts.forEach((contact, index) => {
          //To take care of case sensitivity in URL
          const normalizedValue = contact.value.trim().toLowerCase();
          if (normalizedValue) {
            if (valueMap.has(normalizedValue)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t("duplicate_contact_values_not_allowed"),
                path: [index, "value"],
              });
            } else {
              valueMap.set(normalizedValue, true);
            }
          }
        });
      }),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .refine(
      (data) => {
        if (!data.expiration_date || !data.manufacture_date) return true;
        return new Date(data.expiration_date) > new Date(data.manufacture_date);
      },
      {
        message: t("expiration_date_must_be_after_manufacture_date"),
        path: ["expiration_date"],
      },
    );

  const defaultValues: z.infer<typeof formSchema> = {
    identifier: undefined,
    status: "active",
    availability_status: "available",
    manufacturer: undefined,
    manufacture_date: undefined,
    registered_name: "",
    contact: [],
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const [careType, setCareType] = useState<string>();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contact",
  });

  const { mutate: submitForm, isPending } = useMutation({
    mutationFn: device?.id
      ? mutate(deviceApi.update, {
          pathParams: { facility_id: facilityId, id: device.id },
        })
      : mutate(deviceApi.create, {
          pathParams: { facility_id: facilityId },
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (device) {
      form.reset({
        ...device,
        user_friendly_name: device.user_friendly_name || undefined,
        identifier: device.identifier || undefined,
        manufacturer: device.manufacturer || undefined,
        manufacture_date: device.manufacture_date || undefined,
        expiration_date: device.expiration_date || undefined,
        lot_number: device.lot_number || undefined,
        serial_number: device.serial_number || undefined,
        model_number: device.model_number || undefined,
        part_number: device.part_number || undefined,
        contact: Array.isArray(device.contact) ? device.contact : [],
      });

      setCareType(device.care_type);
      form.setValue("metadata", device.care_metadata);
    } else {
      const pluginDevice = pluginDevices.find(
        (pluginDevice) => pluginDevice.type === qParams.type,
      );

      if (pluginDevice) {
        setCareType(pluginDevice.type);
      }
    }
  }, [device, form, qParams.type]);

  useEffect(() => {
    if (device?.manufacture_date) {
      form.setValue(
        "manufacture_date",
        dateQueryString(device.manufacture_date),
      );
    }

    if (device?.expiration_date) {
      form.setValue("expiration_date", dateQueryString(device.expiration_date));
    }
  }, [device, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const metadata = values.metadata;
    delete values.metadata;
    submitForm({ ...metadata, ...values, care_type: careType });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="registered_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("registered_name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_registered_name")}
                    data-cy="registered-name-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_friendly_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("user_friendly_name")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_user_friendly_name")}
                    data-cy="user-friendly-name-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-cy="device-status-select">
                      <SelectValue placeholder={t("select_status")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DeviceStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`device_status_${status}`)}
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
            name="availability_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("availability_status")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-cy="device-availability-status-select">
                      <SelectValue
                        placeholder={t("select_availability_status")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DeviceAvailabilityStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`device_availability_status_${status}`)}
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
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("identifier")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_identifier")}
                    data-cy="identifier-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("manufacturer")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_manufacturer")}
                    data-cy="manufacturer-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacture_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("manufacture_date")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    data-cy="manufacture-date-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiration_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("expiration_date")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    data-cy="expiration-date-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lot_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("lot_number")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_lot_number")}
                    data-cy="lot-number-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serial_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("serial_number")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_serial_number")}
                    data-cy="serial-number-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("model_number")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_model_number")}
                    data-cy="model-number-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="part_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("part_number")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("enter_part_number")}
                    data-cy="part-number-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              {t("contact_points")}
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  system: ContactPointSystems[0],
                  value: "",
                  use: "work",
                })
              }
            >
              {t("add_contact_point")}
            </Button>
          </div>

          {fields.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("no_contact_points_added")}
            </div>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative grid gap-3 sm:gap-1 grid-cols-1 sm:grid-cols-[1fr_3fr_auto] py-2"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="h-10 px-2 flex sm:hidden w-1/12 justify-self-end"
              >
                <CareIcon icon="l-trash" className="size-4 text-destructive" />
              </Button>

              <FormField
                control={form.control}
                name={`contact.${index}.system`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-[42px] md:h-[38px]">
                          <SelectValue
                            placeholder={t("select_contact_system")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ContactPointSystems.map((system) => (
                          <SelectItem key={system} value={system}>
                            {t(`contact_system_${system}`)}
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
                name={`contact.${index}.value`}
                render={({ field }) => {
                  const system = form.watch(`contact.${index}.system`);
                  return (
                    <FormItem className="space-y-0">
                      <FormControl>
                        {system === "phone" ||
                        system === "fax" ||
                        system === "sms" ? (
                          <PhoneInput
                            {...field}
                            placeholder={t(
                              `contact_point_placeholder__${system}`,
                            )}
                          />
                        ) : (
                          <Input
                            {...field}
                            placeholder={t(
                              `contact_point_placeholder__${system}`,
                            )}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name={`contact.${index}.use`}
                render={({ field }) => (
                  <input type="hidden" {...field} value="work" />
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="h-10 px-2 hidden sm:flex"
              >
                <CareIcon icon="l-trash" className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {careType && (
          <ErrorBoundary
            fallback={
              <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-700">
                <p className="font-medium">Oops, something went wrong</p>
                <p className="text-sm mt-1">
                  Failed to render the {careType} configure form
                </p>
              </div>
            }
          >
            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <PluginDeviceConfigureForm
                    type={careType}
                    facilityId={facilityId}
                    metadata={field.value ?? {}}
                    onChange={(metadata) => field.onChange(metadata)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </ErrorBoundary>
        )}

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            type="button"
            className="m-4"
            onClick={() => {
              if (device) {
                goBack(`/facility/${facilityId}/settings/devices/${device.id}`);
              } else {
                goBack(`/facility/${facilityId}/settings/devices`);
              }
            }}
            data-cy="cancel-button"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isPending || !form.formState.isDirty}
            data-cy="save-device-button"
          >
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const PluginDeviceConfigureForm = ({
  type,
  facilityId,
  metadata,
  onChange,
}: {
  type: string;
  facilityId: string;
  metadata: Record<string, unknown>;
  onChange: (metadata: Record<string, unknown>) => void;
}) => {
  const pluginDevice = usePluginDevice(type);

  if (!pluginDevice.configureForm) {
    return null;
  }

  return (
    <pluginDevice.configureForm
      facilityId={facilityId}
      metadata={metadata}
      onChange={onChange}
    />
  );
};
