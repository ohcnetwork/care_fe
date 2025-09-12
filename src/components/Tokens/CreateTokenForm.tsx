import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
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
import RadioInput from "@/components/ui/RadioInput";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { dateQueryString } from "@/Utils/utils";

import { LocationSearch } from "@/components/Location/LocationSearch";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { HealthcareServiceSelector } from "@/pages/Facility/services/HealthcareServiceSelector";

import { cn } from "@/lib/utils";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenGenerateWithQueue, TokenRead } from "@/types/tokens/token/token";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

import { PatientRead } from "@/types/emr/patient/patient";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { UserReadMinimal } from "@/types/user/user";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface Props {
  patient?: PatientRead;
  facilityId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  disableRedirectOnSuccess?: boolean;
}

export default function CreateTokenForm({
  patient,
  facilityId,
  trigger,
  onSuccess,
  disableRedirectOnSuccess = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedResourceType, setSelectedResourceType] =
    useState<SchedulableResourceType>(SchedulableResourceType.Practitioner);

  const [selectedUser, setSelectedUser] = useState<UserReadMinimal | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );
  const [selectedService, setSelectedService] =
    useState<HealthcareServiceReadSpec | null>(null);

  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const tokenFormSchema = z.object({
    resourceId: z.string().min(1, {
      message: t("resource_id_is_required"),
    }),
    categoryId: z.string().min(1, {
      message: t("category_is_required"),
    }),
    note: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      resourceId: "",
      categoryId: "",
      note: "",
    },
  });

  // Queue selection is no longer needed - backend auto-handles queue selection

  // Fetch available token categories
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: ["tokenCategories", facilityId, selectedResourceType],
      queryFn: query(tokenCategoryApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          resource_type: selectedResourceType,
        },
      }),
      enabled: isOpen,
    },
  );

  // HealthcareServiceSelector handles its own data fetching

  const categories = categoriesResponse?.results;

  // Set default category when categories of resource type are loaded
  useEffect(() => {
    form.setValue("categoryId", "");

    if (categories?.length && !form.watch("categoryId")) {
      const options = categories.filter(
        (category) => category.resource_type === selectedResourceType,
      );
      form.setValue(
        "categoryId",
        options.find((category) => category.default)?.id ?? options[0].id,
      );
    }
  }, [categories, form, selectedResourceType]);

  const { mutate: createToken, isPending } = useMutation({
    mutationFn: mutate(tokenQueueApi.generateToken, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: (data: TokenRead) => {
      toast.success(t("token_created"));
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["tokens", facilityId],
      });
      onSuccess?.();
      if (!disableRedirectOnSuccess) {
        navigate(`/facility/${facilityId}/patients/verify`, {
          query: {
            phone_number: patient?.phone_number,
            year_of_birth: patient?.year_of_birth.toString(),
            partial_id: patient?.id.slice(0, 5),
            queue_id: data.queue.id,
            token_id: data.id,
          },
        });
      }
    },
  });

  function onSubmit(data: z.infer<typeof tokenFormSchema>) {
    const tokenRequest: TokenGenerateWithQueue = {
      patient: patient?.id,
      category: data.categoryId,
      note: data.note,
      resource_type: selectedResourceType,
      resource_id: data.resourceId,
      date: dateQueryString(new Date()),
    };

    createToken(tokenRequest);
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset all state when closing
      setSelectedResourceType(SchedulableResourceType.Practitioner);
      setSelectedUser(null);
      setSelectedLocation(null);
      setSelectedService(null);
      form.reset();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="secondary"
            className="h-14 w-full justify-start text-lg"
          >
            <Ticket className="mr-4 size-6" />
            {t("create_token")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("create_token")}</SheetTitle>
          <SheetDescription>
            {patient?.name ? (
              <Trans
                i18nKey="create_token_for_patient"
                values={{ patientName: patient?.name }}
                components={{
                  strong: <strong className="font-semibold text-gray-950" />,
                }}
              />
            ) : (
              t("create_new_token_description")
            )}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-2"
          >
            <div className="space-y-6">
              {/* Resource Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">
                  {t("select_resource_type")}
                </label>
                <div className="grid grid-cols-1 gap-3 mt-1">
                  {Object.values(SchedulableResourceType).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-auto min-h-16 w-full justify-start text-left",
                        selectedResourceType === type &&
                          "ring-2 ring-primary text-primary bg-primary/5",
                      )}
                      onClick={() => {
                        setSelectedResourceType(type);
                        // Reset resource selection when type changes
                        form.setValue("resourceId", "");
                        setSelectedUser(null);
                        setSelectedLocation(null);
                        setSelectedService(null);
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <div className="text-sm font-semibold">
                          {t(`resource_type__${type}`)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t(`resource_type_description__${type}`)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-gray-200" />

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Resource Selection */}
                <FormField
                  control={form.control}
                  name="resourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedResourceType ===
                          SchedulableResourceType.Practitioner &&
                          t("practitioner")}
                        {selectedResourceType ===
                          SchedulableResourceType.Location && t("location")}
                        {selectedResourceType ===
                          SchedulableResourceType.HealthcareService &&
                          t("healthcare_service")}
                      </FormLabel>
                      <FormControl>
                        <div>
                          {selectedResourceType ===
                            SchedulableResourceType.Practitioner && (
                            <PractitionerSelector
                              facilityId={facilityId}
                              selected={selectedUser}
                              onSelect={(user) => {
                                setSelectedUser(user);
                                const resourceId = user?.id || "";
                                field.onChange(resourceId);
                              }}
                            />
                          )}

                          {selectedResourceType ===
                            SchedulableResourceType.Location && (
                            <LocationSearch
                              facilityId={facilityId}
                              onSelect={(location) => {
                                setSelectedLocation(location);
                                const resourceId = location.id;
                                field.onChange(resourceId);
                              }}
                              value={selectedLocation}
                            />
                          )}

                          {selectedResourceType ===
                            SchedulableResourceType.HealthcareService && (
                            <HealthcareServiceSelector
                              facilityId={facilityId}
                              selected={selectedService}
                              onSelect={(service) => {
                                setSelectedService(service);
                                const resourceId = service?.id || "";
                                field.onChange(resourceId);
                              }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Token Category Selection */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("category")}</FormLabel>
                      <FormControl>
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center py-8 text-gray-500">
                            {t("loading_categories")}
                          </div>
                        ) : categories && categories.length > 0 ? (
                          <RadioInput
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoadingCategories}
                            options={
                              categories?.map(
                                (category: TokenCategoryRead) => ({
                                  value: category.id,
                                  label: `${category.name}${
                                    category.shorthand
                                      ? ` (${category.shorthand})`
                                      : ""
                                  }`,
                                }),
                              ) ?? []
                            }
                          />
                        ) : (
                          <div className="flex items-center justify-center py-8 text-gray-500">
                            {t("no_categories_found")}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Note Field */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("note")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("enter_note_optional")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                data-shortcut-id="cancel-action"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending ||
                  !selectedResourceType ||
                  !form.watch("resourceId") ||
                  !form.watch("categoryId")
                }
                data-shortcut-id="submit-action"
              >
                {isPending ? t("creating") : t("create_token")}
                <ShortcutBadge actionId="submit-action" className="bg-white" />
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
