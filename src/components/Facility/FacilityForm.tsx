import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import LocationPicker from "@/components/Common/GeoLocationPicker";
import { FacilityModel } from "@/components/Facility/models";

import { FACILITY_FEATURE_TYPES, FACILITY_TYPES } from "@/common/constants";
import { validatePincode } from "@/common/validation";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import GovtOrganizationSelector from "@/pages/Organization/components/GovtOrganizationSelector";
import { BaseFacility } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface FacilityProps {
  organizationId?: string;
  facilityId?: string;
  onSubmitSuccess?: () => void;
}

export default function FacilityForm({
  organizationId,
  facilityId,
  onSubmitSuccess,
}: FacilityProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);

  const facilityFormSchema = z.object({
    facility_type: z.string().min(1, t("facility_type_required")),
    name: z.string().min(1, t("name_is_required")),
    description: z.string().optional(),
    features: z.array(z.number()).default([]),
    pincode: z.string().refine(validatePincode, t("invalid_pincode")),
    geo_organization: z.string().min(1, t("field_required")),
    address: z.string().min(1, t("address_is_required")),
    phone_number: validators().phoneNumber.required,
    latitude: validators().coordinates.latitude.optional(),
    longitude: validators().coordinates.longitude.optional(),
    is_public: z.boolean().default(false),
  });

  type FacilityFormValues = z.infer<typeof facilityFormSchema>;

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facility_type: "",
      name: "",
      description: "",
      features: [],
      pincode: "",
      geo_organization: organizationId || "",
      address: "",
      phone_number: "",
      latitude: undefined,
      longitude: undefined,
      is_public: false,
    },
  });

  const { data: org } = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId },
    }),
    enabled: !!organizationId,
  });

  useEffect(() => {
    const levels: Organization[] = [];
    if (org && org.org_type === "govt") levels.push(org);
    setSelectedLevels(levels);
  }, [org, organizationId]);

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
      queryClient.invalidateQueries({
        queryKey: ["organizationFacilities"],
      });
      queryClient.invalidateQueries({
        queryKey: ["facility"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
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
    if (facilityId) {
      updateFacility({
        ...data,
        latitude: data.latitude ?? 0,
        longitude: data.longitude ?? 0,
      });
    } else {
      createFacility(data);
    }
  };

  const handleFeatureChange = (value: string[]) => {
    const features = value.map((val) => Number(val));
    form.setValue("features", features, { shouldDirty: true });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude, {
            shouldDirty: true,
          });
          form.setValue("longitude", position.coords.longitude, {
            shouldDirty: true,
          });
          setIsGettingLocation(false);
          toast.success(t("location_updated_successfully"));
        },
        (error) => {
          setIsGettingLocation(false);
          toast.error(t("unable_to_get_current_location") + error.message);
        },
        { timeout: 10000 },
      );
    } else {
      toast.error(t("geolocation_is_not_supported_by_this_browser"));
    }
  };

  // Update form when facility data is loaded
  useEffect(() => {
    if (facilityData) {
      setSelectedLevels([
        facilityData.geo_organization as unknown as Organization,
      ]);
      form.reset({
        facility_type: facilityData.facility_type,
        name: facilityData.name,
        description: facilityData.description || "",
        features: facilityData.features || [],
        pincode: facilityData.pincode?.toString() || "",
        geo_organization: (
          facilityData.geo_organization as unknown as Organization
        )?.id,
        address: facilityData.address,
        phone_number: facilityData.phone_number,
        latitude: facilityData.latitude
          ? Number(facilityData.latitude)
          : undefined,
        longitude: facilityData.longitude
          ? Number(facilityData.longitude)
          : undefined,
        is_public: facilityData.is_public,
      });
    }
  }, [facilityData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("basic_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="facility_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("facility_type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-cy="facility-type">
                        <SelectValue placeholder={t("select_facility_type")} />
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
                  <FormLabel required>{t("facility_name")}</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="facility-name"
                      placeholder={t("enter_facility_name")}
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
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    data-cy="facility-description"
                    placeholder={t("markdown_supported")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t("features")}</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={FACILITY_FEATURE_TYPES.map((obj) => ({
                        value: obj.id.toString(),
                        label: obj.name,
                        icon: obj.icon,
                      }))}
                      onValueChange={handleFeatureChange}
                      value={field.value.map((val) => val.toString())}
                      placeholder={t("select_facility_feature")}
                      id="facility-features"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("contact_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("phone_number")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      data-cy="facility-phone"
                      placeholder={t("enter_phone_number")}
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
                  <FormLabel required>{t("pincode")}</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="facility-pincode"
                      placeholder={t("enter_pincode")}
                      maxLength={6}
                      {...field}
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
                    <GovtOrganizationSelector
                      {...field}
                      value={form.watch("geo_organization")}
                      selected={selectedLevels}
                      onChange={(value) =>
                        form.setValue("geo_organization", value, {
                          shouldDirty: true,
                        })
                      }
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
                <FormLabel required>{t("address")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    data-cy="facility-address"
                    placeholder={t("enter_address")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <LocationPicker
            latitude={form.watch("latitude")}
            longitude={form.watch("longitude")}
            onLocationSelect={(lat, lng) => {
              form.setValue("latitude", lat, { shouldDirty: true });
              form.setValue("longitude", lng, { shouldDirty: true });
            }}
            isGettingLocation={isGettingLocation}
            onGetCurrentLocation={handleGetCurrentLocation}
          />
        </div>

        {/* Visibility Settings */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("visibility_settings")}</h3>
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4 bg-muted/5">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-cy="make-facility-public"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base">
                    {t("make_facility_public")}
                  </FormLabel>
                  <p className="text-sm text-gray-500">
                    {t("make_facility_public_description")}
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
          variant="primary"
          disabled={
            facilityId ? isUpdatePending || !form.formState.isDirty : isPending
          }
          data-cy={facilityId ? "update-facility" : "submit-facility"}
        >
          {facilityId ? (
            isUpdatePending ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
                {t("updating_facility")}
              </>
            ) : (
              t("update_facility")
            )
          ) : isPending ? (
            <>
              <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
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
