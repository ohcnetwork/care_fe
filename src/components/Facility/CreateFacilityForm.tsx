import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import { MultiSelectFormField } from "@/components/Form/FormFields/SelectFormField";

import { FACILITY_FEATURE_TYPES, FACILITY_TYPES } from "@/common/constants";
import {
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "@/common/validation";

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
  is_public: z.boolean().default(false),
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      is_public: false,
    },
  });

  const { mutate: createFacility, isPending } = useMutation({
    mutationFn: mutate(routes.facility.create),
    onSuccess: (_data: BaseFacility) => {
      toast.success(t("facility_added_successfully"));
      queryClient.invalidateQueries({ queryKey: ["organizationFacilities"] });
      form.reset();
      onSubmitSuccess?.();
    },
    onError: (error: Error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      if (errorData?.errors?.msg) {
        errorData.errors.msg.forEach((msg) => {
          toast.error(msg);
        });
      } else {
        toast.error(t("facility_add_error"));
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
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          setIsGettingLocation(false);
          toast.success(t("location_updated_successfully"));
        },
        (error) => {
          setIsGettingLocation(false);
          toast.error(t("unable_to_get_location") + error.message);
        },
        { timeout: 10000 }, // 10 second timeout
      );
    } else {
      toast.error(t("geolocation_is_not_supported_by_this_browser"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="facility_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facility Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-cy="facility-type">
                        <SelectValue placeholder="Select facility type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FACILITY_TYPES.map((type) => (
                        <SelectItem
                          key={type.text}
                          value={type.text}
                          data-cy="facility-type-option"
                        >
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
                    <Input
                      data-cy="facility-name"
                      placeholder="Enter facility name"
                      {...field}
                    />
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
                  <Textarea
                    {...field}
                    data-cy="facility-description"
                    placeholder="Describe your facility (Markdown supported)"
                    className="h-24"
                  />
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
                    placeholder="Select facility features"
                    options={FACILITY_FEATURE_TYPES}
                    optionLabel={(o) => o.name}
                    optionValue={(o) => o.id}
                    onChange={handleFeatureChange}
                    error={form.formState.errors.features?.message}
                    id="facility-features"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="facility-phone"
                      placeholder="+91XXXXXXXXXX"
                      {...field}
                    />
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
                    <Input
                      data-cy="facility-pincode"
                      placeholder="Enter pincode"
                      {...field}
                    />
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
                  <Textarea
                    {...field}
                    data-cy="facility-address"
                    placeholder="Enter complete address"
                    className="h-20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Location Details</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2"
              data-cy="get-location-button"
            >
              {isGettingLocation ? (
                <>
                  <CareIcon icon="l-spinner" className="h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <CareIcon icon="l-location-point" className="h-4 w-4" />
                  Get Current Location
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-cy="facility-latitude"
                      placeholder="Enter latitude"
                      disabled={isGettingLocation}
                      className={isGettingLocation ? "animate-pulse" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      data-cy="facility-longitude"
                      placeholder="Enter longitude"
                      disabled={isGettingLocation}
                      className={isGettingLocation ? "animate-pulse" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">Visibility Settings</h3>
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-cy="make-facility-public"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base">
                    Make this facility public
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    When enabled, this facility will be visible to the public
                    and can be discovered by anyone using the platform
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-cy="submit-facility"
        >
          {isPending ? (
            <>
              <CareIcon
                icon="l-spinner"
                className="mr-2 h-4 w-4 animate-spin"
              />
              Creating Facility...
            </>
          ) : (
            "Create Facility"
          )}
        </Button>
      </form>
    </Form>
  );
}
