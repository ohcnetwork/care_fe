import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import mutate from "@/Utils/request/mutate";
import {
  ContactPointSystems,
  ContactPointUses,
} from "@/types/common/contactPoint";
import {
  DeviceAvailabilityStatuses,
  DeviceList,
  DeviceStatuses,
} from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

const formSchema = z.object({
  identifier: z.string().optional(),
  status: z.enum(DeviceStatuses),
  availability_status: z.enum(DeviceAvailabilityStatuses),
  manufacturer: z.string().optional(),
  manufacturer_date: z.string().optional(),
  expiration_date: z.string().optional(),
  lot_number: z.string().optional(),
  serial_number: z.string().optional(),
  registered_name: z.string().min(1, { message: t("required") }),
  user_friendly_name: z.string().optional(),
  model_number: z.string().optional(),
  part_number: z.string().optional(),
  contact: z.array(
    z.object({
      system: z.enum(ContactPointSystems),
      value: z.string(),
      use: z.enum(ContactPointUses),
    }),
  ),
});

interface Props {
  facilityId: string;
  device?: DeviceList;
  onSuccess?: () => void;
}

const defaultValues: z.infer<typeof formSchema> = {
  identifier: "",
  status: "active",
  availability_status: "available",
  manufacturer: "",
  manufacturer_date: "",
  registered_name: "",
  contact: [],
};

export default function DeviceForm({ facilityId, device, onSuccess }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

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
      form.reset({ ...device });
    }
  }, [device, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitForm({ ...values });
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
                  <Input {...field} placeholder={t("enter_registered_name")} />
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                  <Input {...field} placeholder={t("enter_identifier")} />
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
                  <Input {...field} placeholder={t("enter_manufacturer")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("manufacturer_date")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                  <Input type="date" {...field} />
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
                  <Input {...field} placeholder={t("enter_lot_number")} />
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
                  <Input {...field} placeholder={t("enter_serial_number")} />
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
                  <Input {...field} placeholder={t("enter_model_number")} />
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
                  <Input {...field} placeholder={t("enter_part_number")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{t("contact_points")}</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  system: ContactPointSystems[0],
                  value: "",
                  use: ContactPointUses[0],
                })
              }
            >
              {t("add_contact_point")}
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`contact.${index}.system`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("system")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("value")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("enter_contact_value")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`contact.${index}.use`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("use")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select_contact_use")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ContactPointUses.map((use) => (
                              <SelectItem key={use} value={use}>
                                {t(`contact_use_${use}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    {t("remove")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
