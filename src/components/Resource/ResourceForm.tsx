import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import RadioInput from "@/components/ui/RadioInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import UserSelector from "@/components/Common/UserSelector";
import { FacilityModel } from "@/components/Facility/models";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { RESOURCE_STATUS_CHOICES } from "@/common/constants";
import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import { AppCacheDB, OfflineWritesEntry } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap, PathParamsObject } from "@/OfflineSupport/offlineKeys";
import {
  handleOfflineRecordSuccess,
  isOfflineId,
  normaliZedResourcerequestRecord,
  saveOfflineWrite,
  saveOfflineWriteData,
} from "@/OfflineSupport/offlineWriteHelpers";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import validators from "@/Utils/validators";
import patientApi from "@/types/emr/patient/patientApi";
import { FacilityData } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import {
  CreateResourceRequest,
  ResourceRequest,
  UpdateResourceRequest,
} from "@/types/resourceRequest/resourceRequest";
import { UserBase } from "@/types/user/user";

interface ResourceProps {
  facilityId: number;
  id?: string;
}

export default function ResourceForm({ facilityId, id }: ResourceProps) {
  const [facilitySearch, setFacilitySearch] = useState("");
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const [{ related_patient, offlineEntryId }] = useQueryParams();
  const [assignedToUser, setAssignedToUser] = useState<UserBase>();
  const [assignFacility, setAssignFacility] = useState<FacilityModel>();
  const [offlineEntry, setOfflineEntry] = useState<OfflineWritesEntry | null>(
    null,
  );
  const [isLoadingOfflineEntry, setIsLoadingOfflineEntry] = useState(false);
  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const db = new AppCacheDB();
  const resourceFormSchema = z.object({
    status: z.string().min(1, { message: t("field_required") }),
    category: z.string().min(1, { message: t("field_required") }),
    assigned_facility: z.object({
      id: z.string(),
      name: z.string(),
    }),
    emergency: z.enum(["true", "false"]),
    title: z.string().min(1, { message: t("field_required") }),
    reason: z.string().min(1, { message: t("field_required") }),
    referring_facility_contact_name: z
      .string()
      .min(1, { message: t("field_required") }),
    referring_facility_contact_number: validators().phoneNumber.required,
    priority: z.number().default(1),
    assigned_to: z.string().optional(),
  });

  type ResourceFormValues = z.infer<typeof resourceFormSchema>;

  const { data: patientData } = useQuery({
    queryKey: ["patient", related_patient],
    queryFn: query(patientApi.getPatient, {
      pathParams: { id: String(related_patient) },
    }),
    meta: { persist: true },
    networkMode: "online",
    enabled: !!related_patient,
  });

  const { data: resourceData } = useQuery({
    queryKey: ["resource_request", id],
    queryFn: query(routes.getResourceDetails, {
      pathParams: { id: String(id) },
    }),
    meta: { persist: true },
    networkMode: "online",
    enabled: !!id,
  });

  const form = useForm({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      status: "pending",
      category: "",
      assigned_facility: undefined,
      assigned_to: "",
      emergency: "false" as const,
      title: "",
      reason: "",
      referring_facility_contact_name: "",
      referring_facility_contact_number: "",
      priority: 1,
    },
  });

  const mappedResourceFields = (resourceData: ResourceRequest) => {
    form.reset({
      status: resourceData.status,
      category: resourceData.category,
      assigned_facility: resourceData.assigned_facility,
      assigned_to: resourceData.assigned_to?.id,
      emergency: resourceData.emergency ? "true" : "false",
      title: resourceData.title,
      reason: resourceData.reason,
      referring_facility_contact_name:
        resourceData.referring_facility_contact_name,
      referring_facility_contact_number:
        resourceData.referring_facility_contact_number,
      priority: resourceData.priority,
    });
    if (resourceData.assigned_to) {
      setAssignedToUser(resourceData.assigned_to);
    } else {
      setAssignedToUser(undefined);
    }
    if (resourceData.assigned_facility) {
      setAssignFacility(resourceData.assigned_facility);
    } else {
      setAssignFacility(undefined);
    }
  };


  useEffect(() => {
    if (offlineEntryId && !id) {
      setIsLoadingOfflineEntry(true);
      const loadOfflineEntry = async () => {
        try {
          const entry = await db.OfflineWrites.get(offlineEntryId);
          if (entry && entry.normalizedData) {
            setOfflineEntry(entry);
          }
        } catch (error) {
          console.error("Error loading offline entry:", error);
        } finally {
          setIsLoadingOfflineEntry(false);
        }
      };
      loadOfflineEntry();
    }
  }, [offlineEntryId]);

  useEffect(() => {
    const loadResourcerequest = async () => {

      const dataToUse = offlineEntryId
        ? offlineEntry?.normalizedData
        : resourceData;

      if (dataToUse) {
        mappedResourceFields(dataToUse as ResourceRequest);
        return;
      }
    };

    loadResourcerequest();
  }, [resourceData, offlineEntry, form]);

  const { mutate: createResource, isPending } = useMutation({
    mutationFn: mutate(routes.createResource),
    onSuccess: async (data: ResourceRequest) => {
      if (offlineEntryId) {
        await handleOfflineRecordSuccess(offlineEntryId, data);
      }
      toast.success(t("resource_created_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`);
    },
  });

  const { mutate: updateResource, isPending: isUpdatePending } = useMutation({
    mutationFn: mutate(routes.updateResource, {
      pathParams: { id: String(id) },
    }),
    onSuccess: async (data: ResourceRequest) => {
      if (offlineEntryId) {
        await handleOfflineRecordSuccess(offlineEntryId, data);
      }
      toast.success(t("resource_updated_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`);
    },
  });

  const toFacilityModel = (facility: FacilityData): FacilityModel => ({
    id: facility.id,
    name: facility.name,
    address: facility.address,
    description: facility.description,
    facility_type: facility.facility_type,
    phone_number: facility.phone_number,
    read_cover_image_url: facility.read_cover_image_url,
    latitude: facility.latitude,
    longitude: facility.longitude,
    location:
      facility.latitude !== undefined && facility.longitude !== undefined
        ? { latitude: facility.latitude, longitude: facility.longitude }
        : undefined,
    pincode: facility.pincode,
    geo_organization: facility.geo_organization?.id ?? undefined,
    is_public: facility.is_public,
  });

  const queueUpdatedResourceRequest = async (
    resourcePayload: UpdateResourceRequest,
    resourceId: string,
  ) => {
    if (!resourceId) {
      toast.error(t("resource_id_missing"));
      return;
    }
    const updatePaginatedResourceCache = <T extends { id: string }>(
      queryClient: QueryClient,
      queryKey: unknown[],
      updatedResource: T,
    ) => {
      const prevList = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);

      if (prevList?.results?.length) {
        const updatedList: PaginatedResponse<T> = {
          ...prevList,
          results: prevList.results.map((entry) =>
            entry.id === updatedResource.id ? updatedResource : entry,
          ),
        };

        queryClient.setQueryData(queryKey, updatedList);
      }
    };
    try {
      const entry = await db.OfflineWrites.get(resourceId);

      if (entry) {
        const isCreate = entry.type === OfflineKeyMap.create_resource_request;


        const existingPayload = isCreate
          ? (entry.payload as CreateResourceRequest)
          : (entry.payload as UpdateResourceRequest);

        // only assign if resourcePayload.related_patient is undefined/null,
        //  it will happen when updating un-synced resource req
        if (resourcePayload.related_patient == null) {
          resourcePayload.related_patient = existingPayload.related_patient;
        }
        let updatedPayload: CreateResourceRequest | UpdateResourceRequest;

        if (isCreate) {
          const { id: _id, ...rest } = resourcePayload; // remove id to match this of type `createresourcereuest`
          updatedPayload = {
            ...existingPayload,
            ...rest,
          };
        } else {
          updatedPayload = {
            ...existingPayload,
            ...resourcePayload,
          };
        }

        const updatedEntry: OfflineWritesEntry = {
          ...entry,
          payload: updatedPayload,
        };

        await db.OfflineWrites.update(resourceId, updatedEntry);
        const normalizedResource = normaliZedResourcerequestRecord(
          updatedEntry,
          patientData,
          assignFacility,
          assignedToUser,
          queryClient,
          authUser,
        );

        await db.OfflineWrites.update(updatedEntry.id, {
          normalizedData: normalizedResource,
        });

        updatePaginatedResourceCache(
          queryClient,
          ["resourceRequests", resourceData?.related_patient?.id],
          normalizedResource,
        );

        queryClient.setQueryData(
          ["resource_request", resourceId],
          normalizedResource,
        );
      } else {
        const offlineEntry: saveOfflineWriteData = {
          id: resourceId,
          userId: authUser.external_id,
          facilityId: String(facilityId),
          mutationSyncRouteKey: OfflineKeyMap.update_resource_request,
          mutationPathParams: { id: String(id) } satisfies PathParamsObject<
            typeof routes.updateResource
          >,
          type: OfflineKeyMap.update_resource_request,
          resourceType: "resourceRequest",
          payload: resourcePayload,
          serverTimestamp: resourceData?.modified_date,
          useQueryRouteKey: "getResourceDetails",
          useQueryPathParams: { id: String(id) } satisfies PathParamsObject<
            typeof routes.getResourceDetails
          >,
        };
        const saveResult = await saveOfflineWrite(offlineEntry);
        if (!saveResult.success) {
          toast.error(saveResult.error);
          return;
        }

        const normalizedResource = normaliZedResourcerequestRecord(
          saveResult.entry,
          patientData,
          assignFacility,
          assignedToUser,
          queryClient,
          authUser,
        );


        await db.OfflineWrites.update(saveResult.entry.id, {
          normalizedData: normalizedResource,
        });

        updatePaginatedResourceCache(
          queryClient,
          ["resourceRequests", resourceData?.related_patient?.id],
          normalizedResource,
        );

        queryClient.setQueryData(
          ["resource_request", resourceId],
          normalizedResource,
        );
      }

      toast.success(t("resource_updated_successfully"));

      navigate(`/facility/${facilityId}/resource/${resourceId}`);
    } catch (error) {
      console.error("Error while queuing resource update:", error);
      toast.error(t("unexpected_error_while_updating_resource"));
      return;
    }
  };

  const queueNewResourceRequest = async (
    resourcePayload: CreateResourceRequest,
  ) => {
    try {
      const generatedId = `offline-${crypto.randomUUID()}`;

      const offlineEntry: saveOfflineWriteData = {
        id: generatedId,
        userId: authUser.external_id,
        facilityId: String(facilityId),
        mutationSyncRouteKey: OfflineKeyMap.create_resource_request,
        type: OfflineKeyMap.create_resource_request,
        resourceType: "resourceRequest",
        payload: resourcePayload,
        parentMutationId: isOfflineId(related_patient)
          ? related_patient
          : undefined,
      };

      const saveResult = await saveOfflineWrite(offlineEntry);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const normalizedResource = normaliZedResourcerequestRecord(
        saveResult.entry,
        patientData,
        assignFacility,
        assignedToUser,
        queryClient,
        authUser,
      );


      await db.OfflineWrites.update(saveResult.entry.id, {
        normalizedData: normalizedResource,
      });

      const prevResourceRequestList = queryClient.getQueryData<
        PaginatedResponse<ResourceRequest>
      >(["resourceRequests", related_patient]);

      const updatedResourceRequestList: PaginatedResponse<ResourceRequest> =
        prevResourceRequestList?.results
          ? {
            ...prevResourceRequestList,
            results: [...prevResourceRequestList.results, normalizedResource],
            count:
              (prevResourceRequestList.count ??
                prevResourceRequestList.results.length) + 1,
          }
          : {
            count: 1,
            results: [normalizedResource],
          };

      queryClient.setQueryData(
        ["resourceRequests", related_patient],
        updatedResourceRequestList,
      );

      queryClient.setQueryData(
        ["resource_request", generatedId],
        normalizedResource,
      );

      toast.success(t("resource_created_successfully"));
      navigate(`/facility/${facilityId}/resource/${generatedId}`);
    } catch (error) {
      console.error("Error while queuing resource request:", error);
      toast.error(t("unexpected_error_while_creating_resource"));
      return;
    }
  };

  const onSubmit = (data: ResourceFormValues) => {
    const resourcePayload = {
      status: data.status,
      category: data.category,
      origin_facility: String(facilityId),
      assigned_facility: data.assigned_facility?.id,
      assigned_to: assignedToUser?.id || null,
      approving_facility: null,
      emergency: data.emergency === "true",
      title: data.title,
      reason: data.reason,
      referring_facility_contact_name: data.referring_facility_contact_name,
      referring_facility_contact_number: data.referring_facility_contact_number,
      related_patient: related_patient,
      priority: data.priority,
    };

    if (id) {
      if (!onlineManager.isOnline()) {
        queueUpdatedResourceRequest({ ...resourcePayload, id }, id);
        return;
      } else updateResource({ ...resourcePayload, id });
    } else {
      if (!onlineManager.isOnline()) {
        queueNewResourceRequest(resourcePayload);
        return;
      } else createResource(resourcePayload);
    }
  };

  const { data: facilities } = useQuery({
    queryKey: ["facilities", facilitySearch],
    queryFn: query.debounced(facilityApi.getAllFacilities, {
      queryParams: {
        search_text: facilitySearch ? facilitySearch : undefined,
        limit: 50,
      },
    }),
    meta: { persist: true },
    networkMode: "online",
  });

  const facilityOptions = facilities?.results.map((facility) => ({
    label: facility.name,
    value: facility.id,
  }));

  const handleUserChange = (user: UserBase) => {
    form.setValue("assigned_to", user.id, { shouldDirty: true });
    setAssignedToUser(user);
  };

  const fillMyDetails = () => {
    form.setValue(
      "referring_facility_contact_name",
      `${authUser.first_name} ${authUser.last_name}`.trim(),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    if (authUser.phone_number) {
      form.setValue(
        "referring_facility_contact_number",
        authUser.phone_number,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
  };

  if (isPending || isUpdatePending || isLoadingOfflineEntry) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <PageTitle
        title={id ? t("update_resource_request") : t("create_resource_request")}
      />
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {patientData && (
            <Alert>
              <div className="flex items-center gap-2">
                <Link
                  href={`/facility/${facilityId}/patient/${related_patient}/resource_requests`}
                  className="flex items-center gap-2"
                >
                  <CareIcon icon="l-user" className="size-5 text-blue-700" />
                  <AlertDescription className="text-sm text-blue-700 whitespace-nowrap">
                    <span>
                      {t("linked_patient")}:{" "}
                      <strong className="font-medium">
                        {patientData.name}
                      </strong>
                    </span>
                  </AlertDescription>
                </Link>
              </div>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{t("basic_information")}</h3>
              <p className="text-sm text-gray-500">
                {t("resource_request_basic_info_description")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <FormField
                control={form.control}
                name="assigned_facility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>
                      {t("facility_for_care_support")}
                    </FormLabel>
                    <FormControl>
                      <Autocomplete
                        {...field}
                        showClearButton={!id}
                        data-cy="select-facility"
                        options={mergeAutocompleteOptions(
                          facilityOptions ?? [],
                          field.value
                            ? {
                              label: field.value.name,
                              value: field.value.id,
                            }
                            : undefined,
                        )}
                        value={field.value?.id ?? ""}
                        placeholder={t("start_typing_to_search")}
                        onSearch={setFacilitySearch}
                        onChange={(value) => {
                          const facility = facilities?.results.find(
                            (f) => f.id === value,
                          );
                          if (facility) {
                            form.setValue("assigned_facility", facility, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            const facilityModel = toFacilityModel(facility);
                            setAssignFacility(facilityModel);
                          } else {
                            form.resetField("assigned_facility");
                            setAssignFacility(undefined);
                          }

                          // When the assigned facility changes, we need to clear the assigned to user
                          form.setValue("assigned_to", undefined, {
                            shouldDirty: true,
                          });
                          setAssignedToUser(undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("select_facility_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("is_this_an_emergency")}</FormLabel>
                    <FormControl>
                      <RadioInput
                        {...field}
                        onValueChange={field.onChange}
                        options={[
                          { value: "true", label: t("yes") },
                          { value: "false", label: t("no") },
                        ]}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("emergency_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("status")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          data-cy="select-status-dropdown"
                          ref={field.ref}
                        >
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESOURCE_STATUS_CHOICES.map((option, index) => (
                          <SelectItem key={index} value={option.text}>
                            {t(`resource_status__${option.text}`)}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger
                          data-cy="select-category-dropdown"
                          ref={field.ref}
                        >
                          <SelectValue
                            placeholder={t("category_description")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESOURCE_CATEGORY_CHOICES.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {id && !isOfflineId(id) && (
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("assigned_to")}</FormLabel>
                      <FormControl>
                        <UserSelector
                          facilityId={form.watch("assigned_facility")?.id}
                          selected={assignedToUser}
                          onChange={handleUserChange}
                          placeholder={t("search_users")}
                          noOptionsMessage={t("no_users_found")}
                          popoverClassName="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
          <Separator />

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{t("request_details")}</h3>
              <p className="text-sm text-gray-500">
                {t("resource_request_details_description")}
              </p>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("request_title")}</FormLabel>
                  <FormControl>
                    <Input
                      data-cy="title-input"
                      {...field}
                      placeholder={t("request_title_placeholder")}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("request_title_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("request_reason")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      data-cy="reason-input"
                      placeholder={t("request_reason_placeholder")}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("request_reason_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {t("contact_information")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("contact_information_description")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={fillMyDetails}
                className="shrink-0"
                data-cy="fill_my_details_button"
              >
                <CareIcon icon="l-user" className="mr-2 size-4" />
                {t("fill_my_details")}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
              <FormField
                control={form.control}
                name="referring_facility_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("contact_person")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(value) => field.onChange(value)}
                        data-cy="contact_person"
                      />
                    </FormControl>
                    <FormDescription>
                      {t("contact_person_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referring_facility_contact_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>{t("contact_phone")}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        data-cy="contact_person_phone"
                        onChange={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("contact_phone_description")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={() => goBack()}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                id ? isUpdatePending || !form.formState.isDirty : isPending
              }
            >
              {isPending && (
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
