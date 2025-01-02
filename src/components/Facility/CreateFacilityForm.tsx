import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { MultiSelectFormField } from "@/components/Form/FormFields/SelectFormField";

import { FACILITY_FEATURE_TYPES, FACILITY_TYPES } from "@/common/constants";
import {
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { parsePhoneNumber } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { BaseFacility } from "@/types/facility/facility";

const facilityFormSchema = z.object({
  facility_type: z.string().min(1, "Facility type is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  features: z.array(z.number()).default([]),
  pincode: z.string().refine(validatePincode, "Invalid pincode"),
  address: z.string().min(1, "Address is required"),
  phone_number: z
    .string()
    .regex(
      /^\+91[0-9]{10}$/,
      "Phone number must start with +91 followed by 10 digits",
    ),
  latitude: z
    .string()
    .optional()
    .refine((val) => !val || validateLatitude(val), "Invalid latitude"),
  longitude: z
    .string()
    .optional()
    .refine((val) => !val || validateLongitude(val), "Invalid longitude"),
});

type FacilityFormValues = z.infer<typeof facilityFormSchema>;

interface Props {
  organizationId: string;
  onSubmitSuccess?: () => void;
}

export default function CreateFacilityForm({
  organizationId,
  onSubmitSuccess,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facility_type: "",
      name: "",
      description: "",
      features: [],
      pincode: "",
      address: "",
      phone_number: "+91",
      latitude: "",
      longitude: "",
    },
  });

  const { mutate: createFacility, isPending } = useMutation({
    mutationFn: mutate(routes.facility.create),
    onSuccess: (_data: BaseFacility) => {
      Notification.Success({
        msg: t("facility_added_successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["organizationFacilities"] });
      form.reset();
      onSubmitSuccess?.();
    },
    onError: (error: Error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      if (errorData?.errors?.msg) {
        errorData.errors.msg.forEach((msg) => {
          Notification.Error({ msg });
        });
      } else {
        Notification.Error({
          msg: t("facility_add_error"),
        });
      }
    },
  });

  const onSubmit = (data: FacilityFormValues) => {
    createFacility({
      ...data,
      phone_number: parsePhoneNumber(data.phone_number),
      geo_organization: organizationId,
    });
  };

  const handleFeatureChange = (value: any) => {
    const { value: features }: { value: Array<number> } = value;
    form.setValue("features", features);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
        },
        (error) => {
          Notification.Error({
            msg: "Unable to get location: " + error.message,
          });
        },
      );
    } else {
      Notification.Error({
        msg: "Geolocation is not supported by this browser",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="facility_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facility Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FACILITY_TYPES.map((type) => (
                      <SelectItem key={type.text} value={type.text}>
                        {type.text}
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facility Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Markdown supported" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <MultiSelectFormField
                  name={field.name}
                  value={field.value}
                  placeholder={t("features")}
                  options={FACILITY_FEATURE_TYPES}
                  optionLabel={(o) => o.name}
                  optionValue={(o) => o.id}
                  onChange={handleFeatureChange}
                  error={form.formState.errors.features?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+91XXXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Latitude</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGetCurrentLocation}
                    >
                      <CareIcon icon="l-location-point" className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!organizationId && (
          <FormField
            name="geo_organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <FormControl>
                  <OrganizationSelector
                    value={field.value}
                    onChange={field.onChange}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Create Facility"}
        </Button>
      </form>
    </Form>
  );
}
