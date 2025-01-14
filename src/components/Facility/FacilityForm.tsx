import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";
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
import query from "@/Utils/request/query";
import { getPincodeDetails, parsePhoneNumber } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { BaseFacility } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";
import { useFetchOrganizationByName } from "@/types/organization/organizationApi";

import { FacilityModel } from "./models";

const facilityFormSchema = z.object({
  facility_type: z.string().min(1, "Facility type is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  features: z.array(z.number()).default([]),
  pincode: z.string().refine(validatePincode, "Invalid pincode"),
  geo_organization: z.string().min(1, t("organization_required")).optional(),
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

interface FacilityProps {
  organizationId?: string;
  facilityId?: string;
  onSubmitSuccess?: () => void;
}

export default function FacilityForm(props: FacilityProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { facilityId, onSubmitSuccess } = props;
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);
  const [pincode, setPincode] = useState("");

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facility_type: "",
      name: "",
      description: "",
      features: [],
      pincode: "",
      geo_organization: "",
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
  });

  const { mutate: updateFacility, isPending: isUpdatePending } = useMutation({
    mutationFn: mutate(routes.updateFacility, {
      pathParams: { id: facilityId || "" },
    }),
    onSuccess: (_data: FacilityModel) => {
      toast.success(t("facility_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["organizationFacilities"] });
      form.reset();
      onSubmitSuccess?.();
    },
  });

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId || "" },
    }),
    enabled: !!facilityId,
  });

  const onSubmit: (data: FacilityFormValues) => void = (
    data: FacilityFormValues,
  ) => {
    const requestData = {
      ...data,
      phone_number: parsePhoneNumber(data.phone_number),
      geo_organization: data?.geo_organization
        ? JSON.parse(data.geo_organization)?.id
        : undefined,
    };

    if (facilityId) {
      updateFacility(requestData);
    } else {
      createFacility(requestData);
    }
  };

  const handleFeatureChange = (value: any) => {
    const { value: features }: { value: Array<number> } = value;
    form.setValue("features", features);
  };

  // Update form when facility data is loaded
  useEffect(() => {
    if (facilityData) {
      form.reset({
        facility_type: facilityData.facility_type,
        name: facilityData.name,
        description: facilityData.description || "",
        features: facilityData.features || [],
        pincode: facilityData.pincode?.toString() || "",
        geo_organization: JSON.stringify(facilityData?.geo_organization) || "",
        address: facilityData.address,
        phone_number: facilityData.phone_number,
        latitude: facilityData.latitude?.toString() || "",
        longitude: facilityData.longitude?.toString() || "",
        is_public: facilityData.is_public,
      });
    }
  }, [facilityData, form]);

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
        { timeout: 10000 },
      );
    } else {
      toast.error(t("geolocation_is_not_supported_by_this_browser"));
    }
  };

  const { data: pincodeData } = useQuery({
    queryKey: ["pincodeDetails", pincode],
    queryFn: () => getPincodeDetails(pincode, careConfig.govDataApiKey),
    enabled:
      validatePincode(pincode) &&
      Number(pincode) !== Number(facilityData?.pincode),
  });
  const { statename: stateName, districtname: districtName } =
    pincodeData || {};

  const { data: stateOrg } = useFetchOrganizationByName(stateName);
  const { data: districtOrg } = useFetchOrganizationByName(
    districtName,
    stateOrg?.id,
  );

  useEffect(() => {
    if (stateOrg && districtOrg) {
      setSelectedLevels([stateOrg, districtOrg]);
    } else {
      setSelectedLevels([]);
    }
  }, [stateOrg, districtOrg]);

  const handlePincodeChange = (value: string) => {
    setPincode(value);
    setSelectedLevels([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-lg font-medium">{t("basic_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="facility_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Facility Type</FormLabel>
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
                  <FormLabel required>Facility Name</FormLabel>
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
          <h3 className="text-lg font-medium">{t("contact_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="facility-phone"
                      placeholder="+91XXXXXXXXXX"
                      maxLength={13}
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
                  <FormLabel required>Pincode</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="facility-pincode"
                      placeholder="Enter pincode"
                      maxLength={6}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handlePincodeChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="geo_organization"
              render={({ field }) => (
                <FormItem className="md:col-span-2 grid-cols-1 grid md:grid-cols-2 gap-5">
                  <FormControl>
                    <OrganizationSelector
                      value={field.value}
                      parentSelectedLevels={selectedLevels}
                      onChange={field.onChange}
                      required
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
                <FormLabel required>Address</FormLabel>
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
            <h3 className="text-lg font-medium">{t("location_details")}</h3>
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
                  {t("getting_location")}
                </>
              ) : (
                <>
                  <CareIcon icon="l-location-point" className="h-4 w-4" />
                  {t("get_current_location")}
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
          <h3 className="text-lg font-medium">{t("visibility_settings")}</h3>
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
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={facilityId ? isUpdatePending : isPending}
          data-cy={facilityId ? "update-facility" : "submit-facility"}
        >
          {facilityId ? (
            isUpdatePending ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                {t("updating_facility")}
              </>
            ) : (
              t("update_facility")
            )
          ) : isPending ? (
            <>
              <CareIcon
                icon="l-spinner"
                className="mr-2 h-4 w-4 animate-spin"
              />
              {t("creating_facility")}
            </>
          ) : (
            t("create_facility")
          )}
        </Button>
      </form>
    </Form>
  );
}
