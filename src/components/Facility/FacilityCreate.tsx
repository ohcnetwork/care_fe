import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Card from "@/CAREUI/display/Card";
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

import GLocationPicker from "@/components/Common/GLocationPicker";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { FacilityRequest } from "@/components/Facility/models";
import { PhoneNumberValidator } from "@/components/Form/FieldValidators";
import PhoneNumberFormField from "@/components/Form/FormFields/PhoneNumberFormField";
import { MultiSelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";

import useAppHistory from "@/hooks/useAppHistory";

import { FACILITY_FEATURE_TYPES, FACILITY_TYPES } from "@/common/constants";
import {
  phonePreg,
  validateLatitude,
  validateLongitude,
  validatePincode,
} from "@/common/validation";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import request from "@/Utils/request/request";
import { parsePhoneNumber } from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";

interface FacilityProps {
  facilityId?: string;
}
export const FacilityCreate = (props: FacilityProps) => {
  const { t } = useTranslation();
  const { facilityId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const { goBack } = useAppHistory();

  const facilityFormSchema = z.object({
    facility_type: z.string().min(1, { message: t("required") }),
    name: z.string().min(1, { message: t("required") }),
    description: z.string().optional(),
    features: z.array(z.number()).default([]),
    pincode: z.string().refine(validatePincode, {
      message: t("invalid_pincode"),
    }),
    geo_organization: z.string().min(1, { message: t("required") }),
    address: z.string().min(1, { message: t("required") }),
    phone_number: z
      .string()
      .min(1, { message: t("required") })
      .refine(
        (val: string) => {
          if (
            !PhoneNumberValidator(["mobile", "landline"])(val) === undefined ||
            !phonePreg(val)
          ) {
            return false;
          }
          return true;
        },
        {
          message: t("invalid_phone_number"),
        },
      ),
    latitude: z
      .string()
      .min(1, { message: t("required") })
      .refine((val) => !val || validateLatitude(val), {
        message: t("latitude_invalid"),
      }),
    longitude: z
      .string()
      .min(1, { message: t("required") })
      .refine((val) => !val || validateLongitude(val), {
        message: t("longitude_invalid"),
      }),
    is_public: z.boolean().default(false),
  });

  type FacilityFormValues = z.infer<typeof facilityFormSchema>;

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId || "" },
    }),
    enabled: !!facilityId,
  });

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
      phone_number: "",
      latitude: "",
      longitude: "",
      is_public: false,
    },
  });

  // Update form when facility data is loaded
  useEffect(() => {
    if (facilityData) {
      form.reset({
        facility_type: facilityData.facility_type,
        name: facilityData.name,
        description: facilityData.description || "",
        features: facilityData.features || [],
        pincode: facilityData.pincode?.toString() || "",
        geo_organization: facilityData.geo_organization,
        address: facilityData.address,
        phone_number: facilityData.phone_number,
        latitude: facilityData.latitude?.toString() || "",
        longitude: facilityData.longitude?.toString() || "",
        is_public: facilityData.is_public,
      });
    }
  }, [facilityData, form]);

  const handleLocationChange = (location: google.maps.LatLng | undefined) => {
    if (location) {
      form.setValue("latitude", location.lat().toFixed(7));
      form.setValue("longitude", location.lng().toFixed(7));
    }
  };

  const handleSelectCurrentLocation = (
    setCenter: (lat: number, lng: number) => void,
  ) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        form.setValue("latitude", String(position.coords.latitude));
        form.setValue("longitude", String(position.coords.longitude));
        setCenter?.(position.coords.latitude, position.coords.longitude);
      });
    }
  };

  const handleFeatureChange = (value: any) => {
    const { value: features }: { value: Array<number> } = value;
    form.setValue("features", features);
  };

  const onSubmit = async (data: FacilityFormValues) => {
    setIsLoading(true);
    try {
      const requestData: FacilityRequest = {
        ...data,
        phone_number: parsePhoneNumber(data.phone_number),
      };

      const { res, data: responseData } = facilityId
        ? await request(routes.updateFacility, {
            body: requestData,
            pathParams: { id: facilityId },
          })
        : await request(routes.createFacility, {
            body: requestData,
          });

      if (res?.ok && responseData) {
        toast.success(
          facilityId
            ? t("facility_updated_success")
            : t("facility_added_successfully"),
        );
        navigate(`/facility/${responseData.id}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page
      title={facilityId ? "Update Facility" : "Create Facility"}
      crumbsReplacements={{
        [facilityId || "????"]: { name: form.watch("name") },
      }}
    >
      <Card className="mt-4">
        <div className="md:p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="facility_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("facility_type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <FormLabel>{t("facility_name")}</FormLabel>
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
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("features")}</FormLabel>
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
                  </FormItem>
                )}
              />
              <div>
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pincode")}</FormLabel>
                      <FormControl>
                        <TextFormField
                          {...field}
                          required
                          onChange={(value) => {
                            field.onChange(value.value);
                          }}
                          error={form.formState.errors.pincode?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-5">
                <OrganizationSelector
                  required={true}
                  onChange={(value) => form.setValue("geo_organization", value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>{t("address")}</FormLabel>
                      <FormControl>
                        <TextAreaFormField
                          {...field}
                          required
                          onChange={(value) => {
                            field.onChange(value.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <PhoneNumberFormField
                          label={
                            <FormLabel>
                              {t("emergency_contact_number")}
                            </FormLabel>
                          }
                          {...field}
                          types={["mobile", "landline"]}
                          onChange={(value) => {
                            field.onChange(value.value);
                          }}
                          error={form.formState.errors.phone_number?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-row items-center gap-3">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("location")}</FormLabel>
                      <FormControl>
                        <TextFormField
                          className="flex-1"
                          {...field}
                          placeholder="Latitude"
                          onChange={(value) => {
                            field.onChange(value.value);
                          }}
                          error={form.formState.errors.latitude?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-center md:block">
                  <Popover id="map-popover" className="relative">
                    <>
                      <PopoverButton>
                        <Button
                          variant="primary"
                          type="button"
                          id="facility-location-button"
                          className="tooltip p-2 rounded-3xl"
                        >
                          <CareIcon icon="l-map-marker" className="text-xl" />
                          <span className="tooltip-text tooltip-bottom">
                            Select location from map
                          </span>
                        </Button>
                      </PopoverButton>

                      <Transition
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <PopoverPanel className="absolute -right-36 bottom-10 sm:-right-48">
                          <GLocationPicker
                            lat={Number(form.getValues("latitude"))}
                            lng={Number(form.getValues("longitude"))}
                            handleOnChange={handleLocationChange}
                            handleOnClose={() => null}
                            handleOnSelectCurrentLocation={
                              handleSelectCurrentLocation
                            }
                          />
                        </PopoverPanel>
                      </Transition>
                    </>
                  </Popover>
                </div>
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{t("location")}</FormLabel>
                      <FormControl>
                        <TextFormField
                          className="flex-1"
                          {...field}
                          placeholder="Longitude"
                          onChange={(value) => {
                            field.onChange(value.value);
                          }}
                          error={form.formState.errors.longitude?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">
                          Make this facility public
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          When enabled, this facility will be visible to the
                          public and can be discovered by anyone using the
                          platform
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => goBack()}
                  type="button"
                >
                  {t("cancel")}
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loading />
                  ) : facilityId ? (
                    t("update_facility")
                  ) : (
                    t("save_facility")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </Page>
  );
};
