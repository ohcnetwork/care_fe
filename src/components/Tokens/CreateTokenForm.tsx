import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { LocationSearch } from "@/components/Location/LocationSearch";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { HealthcareServiceSelector } from "@/pages/Facility/services/HealthcareServiceSelector";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { cn } from "@/lib/utils";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenGenerateWithQueue, TokenRead } from "@/types/tokens/token/token";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { UserReadMinimal } from "@/types/user/user";

interface Props {
  patientId?: string;
  facilityId: string;
  patientName?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  disableRedirectOnSuccess?: boolean;
}

export default function CreateTokenForm({
  patientId,
  facilityId,
  patientName,
  trigger,
  onSuccess,
  disableRedirectOnSuccess = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
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
      }),
      enabled: isOpen && currentStep === 2,
    },
  );

  // HealthcareServiceSelector handles its own data fetching

  const categories = categoriesResponse?.results || [];

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
        navigate(`/facility/${facilityId}/tokens/${data.id}`);
      }
    },
  });

  function onSubmit(data: z.infer<typeof tokenFormSchema>) {
    const tokenRequest: TokenGenerateWithQueue = {
      patient: patientId,
      category: data.categoryId,
      note: data.note,
      resource_type: selectedResourceType,
      resource_id: data.resourceId,
      date: new Date().toISOString().split("T")[0], // Today's date
    };

    createToken(tokenRequest);
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset all state when closing
      setCurrentStep(1);
      setSelectedResourceType(SchedulableResourceType.Practitioner);
      setSelectedUser(null);
      setSelectedLocation(null);
      setSelectedService(null);
      form.reset();
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedResourceType) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      // Reset form fields and resource selection from step 2
      form.setValue("resourceId", "");
      form.setValue("categoryId", "");
      form.setValue("note", "");
      setSelectedUser(null);
      setSelectedLocation(null);
      setSelectedService(null);
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
          <SheetTitle>
            {currentStep === 1 ? t("select_resource_type") : t("create_token")}
          </SheetTitle>
          <SheetDescription>
            {currentStep === 1 ? (
              t("select_resource_type_description")
            ) : patientName ? (
              <Trans
                i18nKey="create_token_for_patient"
                values={{ patientName }}
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
            {currentStep === 1 ? (
              <div className="space-y-5">
                {/* Resource Type Selection */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
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
                        onClick={() => setSelectedResourceType(type)}
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
              </div>
            ) : (
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingCategories
                                  ? t("loading_categories")
                                  : t("select_token_category")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: TokenCategoryRead) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <span>{category.name}</span>
                                {category.shorthand && (
                                  <span className="text-xs text-gray-500">
                                    ({category.shorthand})
                                  </span>
                                )}
                                {category.default && (
                                  <span className="text-xs text-primary">
                                    ({t("default")})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            )}
            <div className="flex justify-between mt-6 space-x-2">
              {currentStep === 2 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  {t("back")}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    form.reset();
                  }}
                  className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                >
                  {t("cancel")}
                </Button>
                {currentStep === 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!selectedResourceType}
                  >
                    {t("next")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={
                      isPending ||
                      !form.watch("resourceId") ||
                      !form.watch("categoryId")
                    }
                  >
                    {isPending ? t("creating") : t("create_token")}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
